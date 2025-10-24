import React from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
	size?: "sm" | "md" | "lg";
	icon?: React.ReactNode;
	loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "primary",
			size = "md",
			icon,
			loading = false,
			children,
			disabled,
			...props
		},
		ref,
	) => {
		const baseStyles = [
			"inline-flex items-center justify-center gap-2",
			"rounded-theme-button font-medium transition-colors",
			"focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]",
			"disabled:opacity-50 disabled:cursor-not-allowed",
		];

		const variants = {
			primary: [
				"bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]",
				"hover:bg-[rgb(var(--primary)/90%)] focus:ring-[rgb(var(--primary)/50%)]",
			],
			secondary: [
				"bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))]",
				"hover:bg-[rgb(var(--secondary)/80%)] focus:ring-[rgb(var(--secondary)/50%)]",
			],
			outline: [
				"border-theme border-[rgb(var(--border))] bg-transparent text-[rgb(var(--foreground))]",
				"hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--accent-foreground))] focus:ring-[rgb(var(--primary)/50%)]",
			],
			ghost: [
				"bg-transparent text-[rgb(var(--foreground))]",
				"hover:bg-[rgb(var(--muted))] focus:ring-[rgb(var(--muted)/50%)]",
			],
			destructive: [
				"bg-[rgb(var(--destructive))] text-[rgb(var(--destructive-foreground))]",
				"hover:bg-[rgb(var(--destructive)/90%)] focus:ring-[rgb(var(--destructive)/50%)]",
			],
		};

		const sizes = {
			sm: "h-8 px-3 text-sm",
			md: "h-10 px-4 text-base",
			lg: "h-12 px-6 text-lg",
		};

		return (
			<button
				className={cn(baseStyles, variants[variant], sizes[size], className)}
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
	},
);

Button.displayName = "Button";

export { Button };
