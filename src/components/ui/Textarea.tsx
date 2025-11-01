import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					"flex min-h-[80px] w-full theme-input border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] px-3 py-2 text-sm ring-offset-[rgb(var(--color-background))] placeholder:text-[rgb(var(--color-muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical text-[rgb(var(--color-foreground))]",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea };