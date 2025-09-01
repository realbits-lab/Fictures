"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

const primaryNavItems: NavItem[] = [
  { href: "/stories", label: "Stories", icon: "📚" },
  { href: "/write", label: "Write", icon: "📝" },
  { href: "/community", label: "Community", icon: "💬" },
  { href: "/publish", label: "Publish", icon: "📤" },
  { href: "/ai", label: "AI", icon: "🤖" }
];

const secondaryNavItems: NavItem[] = [
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/notifications", label: "Notifications", icon: "🔔" }
];

export function GlobalNavigation() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-700 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <nav className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-gray-100"
        >
          <span className="text-2xl">📖</span>
          <span>Fictures</span>
        </Link>

        {/* Primary Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActiveRoute(item.href)
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Secondary Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {secondaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActiveRoute(item.href)
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="hidden xl:block">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
          >
            <span className="sr-only">Open menu</span>
            <div className="flex flex-col space-y-1">
              <div className="w-4 h-0.5 bg-gray-900 dark:bg-gray-100" />
              <div className="w-4 h-0.5 bg-gray-900 dark:bg-gray-100" />
              <div className="w-4 h-0.5 bg-gray-900 dark:bg-gray-100" />
            </div>
          </Button>
        </div>
      </nav>
    </header>
  );
}