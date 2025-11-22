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
import { AdvancedCacheMetricsDashboard } from "@/components/debug/AdvancedCacheMetricsDashboard";
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
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Fictures",
    },
    formatDetection: {
        telephone: false,
    },
    openGraph: {
        type: "website",
        siteName: "Fictures",
        title: "Fictures - AI-Powered Story Creation",
        description:
            "AI-powered content creation platform for writing stories, novels, and comics",
    },
    twitter: {
        card: "summary",
        title: "Fictures - AI-Powered Story Creation",
        description:
            "AI-powered content creation platform for writing stories, novels, and comics",
    },
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
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
                />
                <meta name="theme-color" content="#000000" />
                <meta name="mobile-web-app-capable" content="yes" />
                <link
                    rel="apple-touch-icon"
                    href="/icons/apple-touch-icon.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="32x32"
                    href="/favicon.ico"
                />
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
                            {/* Cache Debug Tools - Only available in development mode */}
                            {/* Ctrl+Shift+D for Debug Panel, Ctrl+Shift+M for Metrics Dashboard */}
                            {process.env.NODE_ENV === "development" && (
                                <>
                                    <CacheDebugPanel />
                                    <AdvancedCacheMetricsDashboard />
                                </>
                            )}
                        </AuthModalProvider>
                    </SessionProvider>
                </ThemeProvider>
                <Analytics />
            </body>
        </html>
    );
}
