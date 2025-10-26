"use client";

import * as React from "react";

export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Popover({ open, onOpenChange, children }: PopoverProps) {
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onOpenChange?.(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open, onOpenChange]);

  return <div ref={popoverRef}>{children}</div>;
}

export interface PopoverTriggerProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function PopoverTrigger({ onClick, children, className }: PopoverTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  );
}

export interface PopoverContentProps {
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
  className?: string;
}

export function PopoverContent({
  align = "center",
  side = "bottom",
  children,
  className
}: PopoverContentProps) {
  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  const alignClasses = {
    start: side === "top" || side === "bottom" ? "left-0" : "top-0",
    center: side === "top" || side === "bottom" ? "left-1/2 -translate-x-1/2" : "top-1/2 -translate-y-1/2",
    end: side === "top" || side === "bottom" ? "right-0" : "bottom-0",
  };

  return (
    <div
      className={`absolute z-50 ${positionClasses[side]} ${alignClasses[align]} ${className || ""}`}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-5 min-w-[320px] max-w-[500px] animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}
