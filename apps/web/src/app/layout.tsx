import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AdSenseScript } from "@/components/ads";
import { GoogleAnalytics } from "@/components/analysis/GoogleAnalytics";
import { PageViewTracker } from "@/components/analysis/PageViewTracker";
import { ReadingHistorySync } from "@/components/analysis/ReadingHistorySync";
import { AuthModal } from "@/components/auth/AuthModal";
import { SessionProvider } from "@/components/auth/SessionProvider";
// Debug tools
import { CacheDebugPanel } from "@/components/debug/CacheDebugPanel";
import { GlobalNavigation } from "@/components/layout/GlobalNavigation";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { auth } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
    preload: false, // Only preload the main font, not the monospace
});

export const metadata: Metadata = {
    title: "Fictures",
    description: "AI-powered content creation platform",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <AdSenseScript />
                <GoogleAnalytics />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ThemeProvider>
                    <SessionProvider session={session}>
                        <AuthModalProvider>
                            <PageViewTracker />
                            <ReadingHistorySync />
                            <GlobalNavigation />
                            {children}
                            <AuthModal />
                            <Toaster
                                richColors
                                position="top-right"
                                closeButton
                                duration={5000}
                            />
                            {/* Debug Panel: Ctrl+Shift+D (development only) */}
                            <CacheDebugPanel />
                        </AuthModalProvider>
                    </SessionProvider>
                </ThemeProvider>
                <Analytics />
            </body>
        </html>
    );
}
