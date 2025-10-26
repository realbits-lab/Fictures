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

const gnbMenuItems: NavItem[] = [
  { href: "/studio", label: "Studio", icon: "🎬" },
  { href: "/novels", label: "Novels", icon: "📖" },
  { href: "/comics", label: "Comics", icon: "🎨" },
  { href: "/community", label: "Community", icon: "💬" },
  { href: "/publish", label: "Publish", icon: "📤" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" }
];

export function GlobalNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActiveRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Filter navigation items based on user role
  const visibleGnbItems = gnbMenuItems.filter((item) => {
    // Studio, Publish, Analytics, and Comics are writer/manager specific
    if (item.href === '/studio' || item.href === '/publish' || item.href === '/analytics' || item.href === '/comics') {
      return session?.user?.role === 'writer' || session?.user?.role === 'manager';
    }

    // Novels and Community are visible to all users (authenticated or anonymous)
    if (item.href === '/novels' || item.href === '/community') {
      return true;
    }

    // Settings requires authentication
    return !!session;
  });

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-[rgb(var(--border))] bg-[rgb(var(--background))/95%] backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--background))/60%]">
      <nav className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo */}
        <Link 
          href="/" 
          className={cn(
            "flex items-center space-x-2 text-xl font-bold transition-colors px-2 py-1 rounded-lg",
            pathname === "/"
              ? "bg-[rgb(var(--primary)/10%)] text-[rgb(var(--primary))]"
              : "text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]"
          )}
        >
          <span className="text-2xl">📖</span>
          <span>Fictures</span>
        </Link>

        {/* GNB Menu Items */}
        <div className="hidden md:flex items-center space-x-1">
          {visibleGnbItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActiveRoute(item.href)
                  ? "bg-[rgb(var(--primary)/10%)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Auth Section */}
        <div className="hidden md:flex items-center">
          <AuthSection />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Open menu</span>
            <div className="flex flex-col space-y-1">
              <div className="w-4 h-0.5 bg-[rgb(var(--foreground))]" />
              <div className="w-4 h-0.5 bg-[rgb(var(--foreground))]" />
              <div className="w-4 h-0.5 bg-[rgb(var(--foreground))]" />
            </div>
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[70] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-16 right-0 left-0 bg-[rgb(var(--background))] border-b border-[rgb(var(--border))] shadow-lg z-[75] md:hidden">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {/* Navigation Items */}
              {visibleGnbItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    isActiveRoute(item.href)
                      ? "bg-[rgb(var(--primary)/10%)] text-[rgb(var(--primary))]"
                      : "text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]"
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Auth Section */}
              <div className="pt-2 border-t border-[rgb(var(--border))]">
                <MobileAuthSection onNavigate={() => setIsMobileMenuOpen(false)} />
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

function AuthSection() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <div className="w-4 h-4 border-2 border-[rgb(var(--muted))] border-t-[rgb(var(--primary))] rounded-full animate-spin"></div>
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
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]"
      >
        {session.user?.image && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-6 h-6 rounded-full object-cover"
            onError={() => setImageError(true)}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                setImageError(true);
              }
            }}
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center text-xs font-semibold text-[rgb(var(--primary-foreground))]">
            {session.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <span className="hidden xl:block">{session.user?.name}</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[rgb(var(--popover))] border border-[rgb(var(--border))] rounded-lg shadow-lg z-[70]">
          <div className="px-4 py-2">
            <SignOutButton />
          </div>
        </div>
      )}

      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-[65]"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

function MobileAuthSection({ onNavigate }: { onNavigate: () => void }) {
  const { data: session, status } = useSession();
  const [imageError, setImageError] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center px-4 py-3">
        <div className="w-5 h-5 border-2 border-[rgb(var(--muted))] border-t-[rgb(var(--primary))] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div onClick={onNavigate}>
        <SignInButton />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* User Info */}
      <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-[rgb(var(--muted))]">
        {session.user?.image && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-10 h-10 rounded-full object-cover"
            onError={() => setImageError(true)}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                setImageError(true);
              }
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center text-base font-semibold text-[rgb(var(--primary-foreground))]">
            {session.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex-1">
          <div className="font-medium text-[rgb(var(--foreground))]">{session.user?.name}</div>
          <div className="text-sm text-[rgb(var(--muted-foreground))]">{session.user?.email}</div>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="px-2" onClick={onNavigate}>
        <SignOutButton />
      </div>
    </div>
  );
}