import { type NextRequest, NextResponse } from "next/server";
import { createUserWithPassword, findUserByEmail } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password, name } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required" },
				{ status: 400 },
			);
		}

		const existingUser = await findUserByEmail(email);
		if (existingUser) {
			return NextResponse.json(
				{ error: "User already exists with this email" },
				{ status: 409 },
			);
		}

		const user = await createUserWithPassword({
			email,
			password,
			name,
		});

		return NextResponse.json({
			message: "User created successfully",
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
			},
		});
	} catch (error) {
		console.error("Registration error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
