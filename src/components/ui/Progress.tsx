import React from "react";
import { cn } from "@/lib/utils/cn";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  showValue?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    size = "md", 
    variant = "default",
    showValue = false,
    ...props 
  }, ref) => {
    const percentage = Math.min((value / max) * 100, 100);

    const sizes = {
      sm: "h-2",
      md: "h-3", 
      lg: "h-4"
    };

    const variants = {
      default: "bg-blue-600",
      success: "bg-green-600",
      warning: "bg-yellow-600", 
      danger: "bg-red-600"
    };

    return (
      <div className="w-full space-y-2">
        <div
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
            sizes[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full transition-all duration-300 ease-in-out rounded-full",
              variants[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showValue && (
          <div className="text-right text-sm text-gray-600 dark:text-gray-400">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };