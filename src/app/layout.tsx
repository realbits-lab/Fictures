import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from '@/lib/auth';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import { GlobalNavigation } from '@/components/layout/GlobalNavigation';
import { AuthModal } from '@/components/auth/AuthModal';
import { AdSenseScript } from '@/components/ads';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { ReadingHistorySync } from '@/components/analytics/ReadingHistorySync';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
            </AuthModalProvider>
          </SessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}