import React from "react";
import { cn } from "@/lib/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: "default" | "success" | "warning" | "danger" | "info";
	size?: "sm" | "md" | "lg";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
	({ className, variant = "default", size = "md", ...props }, ref) => {
		const baseStyles = [
			"inline-flex items-center font-medium theme-badge",
			"border-theme",
		];

		const variants = {
			default:
				"bg-[rgb(var(--color-muted))] text-[rgb(var(--color-muted-foreground))] border-[rgb(var(--color-border))]",
			success:
				"bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
			warning:
				"bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
			danger:
				"bg-[rgb(var(--color-destructive)/10%)] text-[rgb(var(--color-destructive))] border-[rgb(var(--color-destructive)/20%)]",
			info: "bg-[rgb(var(--color-primary)/10%)] text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary)/20%)]",
		};

		const sizes = {
			sm: "px-2 py-1 text-xs",
			md: "px-2.5 py-1.5 text-sm",
			lg: "px-3 py-2 text-base",
		};

		return (
			<span
				ref={ref}
				className={cn(baseStyles, variants[variant], sizes[size], className)}
				{...props}
			/>
		);
	},
);

Badge.displayName = "Badge";

export { Badge };
