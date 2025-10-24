"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui";

interface SettingsNavItem {
  href: string;
  label: string;
  icon: string;
}

const settingsNavItems: SettingsNavItem[] = [
  { href: "/settings", label: "Account", icon: "👤" },
  { href: "/settings/writing", label: "Writing Preferences", icon: "✏️" },
  { href: "/settings/ai-assistant", label: "AI Assistant", icon: "🤖" },
  { href: "/settings/api-keys", label: "API Keys", icon: "🔑" },
  { href: "/settings/appearance", label: "Appearance", icon: "🎨" },
  { href: "/settings/notifications", label: "Notifications", icon: "🔔" },
  { href: "/settings/privacy", label: "Privacy & Security", icon: "🔒" },
  { href: "/settings/analytics", label: "Data & Analytics", icon: "📊" },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === "/settings") {
      return pathname === "/settings";
    }
    return pathname === href;
  };

  return (
    <Card>
      <CardContent className="py-4">
        <nav className="space-y-2">
          {settingsNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActiveRoute(item.href)
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}