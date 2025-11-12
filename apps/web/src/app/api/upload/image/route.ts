import { put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { getBlobPath } from "@/lib/utils/blob-path";

/**
 * POST /api/upload/image
 * Upload an image to Vercel Blob storage
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    error: "Unauthorized",
                    message: "You must be logged in to upload images",
                },
                { status: 401 },
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "Bad Request", message: "No file provided" },
                { status: 400 },
            );
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                {
                    error: "Bad Request",
                    message: "File size exceeds 5MB limit",
                },
                { status: 400 },
            );
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                {
                    error: "Bad Request",
                    message:
                        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed",
                },
                { status: 400 },
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        let processedBuffer = buffer;
        const metadata: { width?: number; height?: number } = {};

        try {
            const image = sharp(buffer);
            const imageMetadata = await image.metadata();
            metadata.width = imageMetadata.width;
            metadata.height = imageMetadata.height;

            if (imageMetadata.width && imageMetadata.width > 1920) {
                processedBuffer = Buffer.from(
                    await image
                        .resize(1920, null, { withoutEnlargement: true })
                        .toBuffer(),
                );
            }
        } catch (error) {
            console.error("Image processing error:", error);
        }

        const relativePath = `uploads/${session.user.id}/${Date.now()}-${file.name}`;
        const filename = getBlobPath(relativePath);

        const blob = await put(filename, processedBuffer, {
            access: "public",
            contentType: file.type,
        });

        return NextResponse.json({
            url: blob.url,
            filename: file.name,
            size: processedBuffer.length,
            width: metadata.width,
            height: metadata.height,
        });
    } catch (error) {
        console.error("Image upload error:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: "Failed to upload image",
            },
            { status: 500 },
        );
    }
}
