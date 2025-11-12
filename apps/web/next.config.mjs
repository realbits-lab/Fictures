const config = {
    experimental: {
        staleTimes: {
            dynamic: 0,
            static: 0,
        },
    },
    // Configure image domains for Vercel Blob storage and external images
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.public.blob.vercel-storage.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "picsum.photos",
                port: "",
                pathname: "/**",
            },
        ],
    },
    // Disable caching for dynamic content, but allow caching for static assets
    headers: async () => {
        return [
            {
                // Allow caching for static assets (CSS, JS, images, fonts)
                source: "/_next/static/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            {
                // No cache for API routes and dynamic pages
                source: "/((?!_next/static).*)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "no-cache, no-store, must-revalidate",
                    },
                    {
                        key: "Pragma",
                        value: "no-cache",
                    },
                    {
                        key: "Expires",
                        value: "0",
                    },
                ],
            },
        ];
    },
};

export default config;
