import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-10 w-full theme-input border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] px-3 py-2 text-sm ring-offset-[rgb(var(--color-background))] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[rgb(var(--color-muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-[rgb(var(--color-foreground))]",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
