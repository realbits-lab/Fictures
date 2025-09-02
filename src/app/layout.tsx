import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from '@/lib/auth';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { GlobalNavigation } from '@/components/layout/GlobalNavigation';
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={session}>
          <GlobalNavigation />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}