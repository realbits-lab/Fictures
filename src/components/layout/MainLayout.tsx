import React from "react";
import { GlobalNavigation } from "./GlobalNavigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <GlobalNavigation />
      <main className="container mx-auto max-w-screen-2xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}