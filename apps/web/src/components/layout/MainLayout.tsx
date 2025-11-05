import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      <main className="container mx-auto max-w-screen-2xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}