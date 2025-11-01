"use client";

import { cn } from "@/lib/utils/cn";

interface ViewToggleProps {
  view: "card" | "table";
  onViewChange: (view: "card" | "table") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] p-1">
      <button
        onClick={() => onViewChange("card")}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
          view === "card"
            ? "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] shadow-sm"
            : "text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-foreground))]"
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
        Card
      </button>
      <button
        onClick={() => onViewChange("table")}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
          view === "table"
            ? "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] shadow-sm"
            : "text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-foreground))]"
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <line x1="3" x2="21" y1="6" y2="6" />
          <line x1="3" x2="21" y1="12" y2="12" />
          <line x1="3" x2="21" y1="18" y2="18" />
        </svg>
        Table
      </button>
    </div>
  );
}
