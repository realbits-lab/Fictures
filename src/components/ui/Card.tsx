import React from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "elevated" | "outlined";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
	({ className, variant = "default", ...props }, ref) => {
		const variants = {
			default:
				"bg-[rgb(var(--color-card)/85%)] backdrop-blur-sm border-theme border-[rgb(var(--color-border)/60%)] text-[rgb(var(--color-card-foreground))]",
			elevated:
				"bg-[rgb(var(--color-card)/90%)] backdrop-blur-sm shadow-lg border-theme border-[rgb(var(--color-border)/60%)] text-[rgb(var(--color-card-foreground))]",
			outlined:
				"bg-[rgb(var(--color-card)/40%)] backdrop-blur-sm border-theme-thick border-[rgb(var(--color-border)/80%)] text-[rgb(var(--color-card-foreground))]",
		};

		return (
			<div
				ref={ref}
				className={cn("rounded-theme-card p-6", variants[variant], className)}
				{...props}
			/>
		);
	},
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col space-y-1.5 pb-4", className)}
		{...props}
	/>
));

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn(
			"text-lg font-semibold leading-none tracking-tight text-[rgb(var(--color-card-foreground))]",
			className,
		)}
		{...props}
	/>
));

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn("text-sm text-[rgb(var(--color-muted-foreground))]", className)}
		{...props}
	/>
));

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("", className)} {...props} />
));

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center pt-4", className)}
		{...props}
	/>
));

CardFooter.displayName = "CardFooter";

export {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
};
