"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui";
import { SignInButton } from "@/components/auth/SignInButton";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

const primaryNavItems: NavItem[] = [
  { href: "/browse", label: "Browse", icon: "🔍" },
  { href: "/stories", label: "Stories", icon: "📚" },
  { href: "/community", label: "Community", icon: "💬" },
  { href: "/ai", label: "AI", icon: "🤖" }
];

const secondaryNavItems: NavItem[] = [
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
  { href: "/notifications", label: "Notifications", icon: "🔔" }
];

export function GlobalNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActiveRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Filter navigation items based on user role
  const visiblePrimaryNavItems = primaryNavItems.filter((item) => {
    // Browse is visible to all users
    if (item.href === '/browse') return true;
    
    // Stories is only visible to writers and managers
    if (item.href === '/stories') {
      return session?.user?.role === 'writer' || session?.user?.role === 'manager';
    }
    
    // Other items visible to all authenticated users
    return true;
  });

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
          {visiblePrimaryNavItems.map((item) => (
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
          <AuthSection />
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

function AuthSection() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <SignInButton />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-6 h-6 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600';
                fallback.textContent = session.user?.name?.[0] || 'U';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
            {session.user?.name?.[0] || 'U'}
          </div>
        )}
        <span className="hidden xl:block">{session.user?.name}</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <Link
            href="/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
            onClick={() => setIsDropdownOpen(false)}
          >
            <span className="mr-2">👤</span>
            Profile
          </Link>
          <div className="border-t border-gray-200 dark:border-gray-600">
            <div className="px-4 py-2">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
      
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}