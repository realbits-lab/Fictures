import React from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "md", 
    icon, 
    loading = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = [
      "inline-flex items-center justify-center gap-2",
      "rounded-lg font-medium transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed"
    ];

    const variants = {
      primary: [
        "bg-blue-600 text-white",
        "hover:bg-blue-700 focus:ring-blue-500"
      ],
      secondary: [
        "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
        "hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500"
      ],
      ghost: [
        "bg-transparent text-gray-700 dark:text-gray-300",
        "hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500"
      ],
      destructive: [
        "bg-red-600 text-white",
        "hover:bg-red-700 focus:ring-red-500"
      ]
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-base",
      lg: "h-12 px-6 text-lg"
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {icon && <span>{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };