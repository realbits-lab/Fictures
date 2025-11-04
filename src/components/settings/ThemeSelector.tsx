"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";

interface ThemeSelectorProps {
	className?: string;
}

interface ThemeOption {
	id: string;
	name: string;
	summary: string;
	preview: {
		background: string;
		foreground: string;
		primary: string;
		secondary: string;
	};
}

const themeOptions: ThemeOption[] = [
	{
		id: "light",
		name: "Light",
		summary: "Clean and bright with standard rounded corners",
		preview: {
			background: "rgb(255, 255, 255)",
			foreground: "rgb(39, 39, 42)",
			primary: "rgb(59, 130, 246)",
			secondary: "rgb(244, 244, 245)",
		},
	},
	{
		id: "dark",
		name: "Dark",
		summary: "Sleek minimal design with sharp edges",
		preview: {
			background: "rgb(9, 9, 11)",
			foreground: "rgb(244, 244, 245)",
			primary: "rgb(59, 130, 246)",
			secondary: "rgb(39, 39, 42)",
		},
	},
	{
		id: "ocean",
		name: "Blue Ocean",
		summary: "Flowing design with gentle curved borders",
		preview: {
			background: "rgb(248, 250, 252)",
			foreground: "rgb(30, 58, 138)",
			primary: "rgb(59, 130, 246)",
			secondary: "rgb(219, 234, 254)",
		},
	},
	{
		id: "purple",
		name: "Purple Dream",
		summary: "Creative with bold rounded elements and thick borders",
		preview: {
			background: "rgb(250, 245, 255)",
			foreground: "rgb(88, 28, 135)",
			primary: "rgb(147, 51, 234)",
			secondary: "rgb(233, 213, 255)",
		},
	},
	{
		id: "forest",
		name: "Forest Green",
		summary: "Natural organic feel with small clean corners",
		preview: {
			background: "rgb(247, 254, 231)",
			foreground: "rgb(21, 128, 61)",
			primary: "rgb(34, 197, 94)",
			secondary: "rgb(220, 252, 231)",
		},
	},
	{
		id: "sunset",
		name: "Warm Sunset",
		summary: "Cozy theme with extra-large rounded elements",
		preview: {
			background: "rgb(255, 247, 237)",
			foreground: "rgb(154, 52, 18)",
			primary: "rgb(234, 88, 12)",
			secondary: "rgb(254, 215, 170)",
		},
	},
	{
		id: "rose",
		name: "Rose Garden",
		summary: "Elegant refinement with delicate small corners",
		preview: {
			background: "rgb(255, 241, 242)",
			foreground: "rgb(159, 18, 57)",
			primary: "rgb(244, 63, 94)",
			secondary: "rgb(254, 205, 211)",
		},
	},
	{
		id: "midnight",
		name: "Midnight",
		summary: "Technical precision with minimal sharp geometry",
		preview: {
			background: "rgb(15, 23, 42)",
			foreground: "rgb(241, 245, 249)",
			primary: "rgb(168, 85, 247)",
			secondary: "rgb(30, 41, 59)",
		},
	},
];

function ThemePreview({
	theme,
	isSelected,
	onClick,
}: {
	theme: ThemeOption;
	isSelected: boolean;
	onClick: () => void;
}) {
	return (
		<div
			className={cn(
				"relative cursor-pointer group transition-all duration-200",
				"border-2 rounded-xl p-1",
				isSelected
					? "border-[rgb(var(--color-primary))] ring-2 ring-[rgb(var(--color-primary)/20%)]"
					: "border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-border)/80%)]",
			)}
			onClick={onClick}
		>
			{/* Theme Preview Card */}
			<div
				className="relative overflow-hidden transition-all"
				style={{ borderRadius: `var(--radius-card, 0.75rem)` }}
				data-theme={theme.id}
			>
				{/* Color Preview */}
				<div
					className="h-20 w-full flex"
					style={{
						backgroundColor: theme.preview.background,
						borderRadius: `var(--radius-card, 0.5rem) var(--radius-card, 0.5rem) 0 0`,
					}}
					data-theme={theme.id}
				>
					{/* Header simulation - Button-like element */}
					<div className="flex-1 p-2 space-y-1">
						<div
							className="h-3 w-16 transition-all"
							style={{
								backgroundColor: theme.preview.primary,
								borderRadius: `var(--radius-button, 0.5rem)`,
								border: `var(--color-border-width, 1px) var(--color-border-style, solid) ${theme.preview.primary}`,
							}}
						/>
						<div
							className="h-2 w-12 transition-all"
							style={{
								backgroundColor: theme.preview.secondary,
								borderRadius: `var(--radius-badge, 0.25rem)`,
							}}
						/>
					</div>
					{/* Content simulation - Input-like elements */}
					<div className="flex-1 p-2 space-y-1">
						<div
							className="h-2 w-full transition-all"
							style={{
								backgroundColor: theme.preview.foreground,
								opacity: 0.2,
								borderRadius: `var(--radius-input, 0.375rem)`,
								border: `var(--color-border-width, 1px) var(--color-border-style, solid)`,
								borderColor: `${theme.preview.foreground}20`,
							}}
						/>
						<div
							className="h-2 w-8 transition-all"
							style={{
								backgroundColor: theme.preview.foreground,
								opacity: 0.3,
								borderRadius: `var(--radius-input, 0.375rem)`,
								border: `var(--color-border-width, 1px) var(--color-border-style, solid)`,
								borderColor: `${theme.preview.foreground}20`,
							}}
						/>
						<div
							className="h-2 w-10 transition-all"
							style={{
								backgroundColor: theme.preview.foreground,
								opacity: 0.2,
								borderRadius: `var(--radius-input, 0.375rem)`,
								border: `var(--color-border-width, 1px) var(--color-border-style, solid)`,
								borderColor: `${theme.preview.foreground}20`,
							}}
						/>
					</div>
				</div>

				{/* Theme Info */}
				<div
					className="p-3 border-t transition-all"
					style={{
						backgroundColor: theme.preview.background,
						borderColor: theme.preview.secondary,
						color: theme.preview.foreground,
						borderRadius: `0 0 var(--radius-card, 0.5rem) var(--radius-card, 0.5rem)`,
						borderWidth: `var(--color-border-width, 1px) 0 0 0`,
						borderStyle: `var(--color-border-style, solid)`,
					}}
					data-theme={theme.id}
				>
					<div className="text-sm font-medium">{theme.name}</div>
					<div className="text-xs opacity-60 mt-1 leading-tight">
						{theme.summary}
					</div>
				</div>

				{/* Selected indicator */}
				{isSelected && (
					<div className="absolute top-2 right-2">
						<div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
							<svg
								className="w-2.5 h-2.5 text-white"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
					</div>
				)}

				{/* Hover effect */}
				<div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-lg" />
			</div>
		</div>
	);
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
	const { theme, setTheme, resolvedTheme } = useTheme();
	const { data: session } = useSession();
	const [mounted, setMounted] = useState(false);

	// Save theme preference to database
	const saveThemePreference = async (newTheme: string) => {
		if (!session?.user?.id) return;

		try {
			await fetch('/settings/api/user', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					preferences: {
						theme: newTheme,
					},
				}),
			});
		} catch (error) {
			console.error('Failed to save theme preference:', error);
		}
	};

	// Handle theme change with database persistence
	const handleThemeChange = (newTheme: string) => {
		setTheme(newTheme);
		saveThemePreference(newTheme);
	};

	// Load user's saved theme preference
	useEffect(() => {
		const loadUserTheme = async () => {
			if (!session?.user?.id) return;

			try {
				const response = await fetch('/settings/api/user');
				if (response.ok) {
					const settings = await response.json();
					if (settings.preferences?.theme && settings.preferences.theme !== theme) {
						setTheme(settings.preferences.theme);
					}
				}
			} catch (error) {
				console.error('Failed to load user theme preference:', error);
			}
		};

		if (mounted && session?.user?.id) {
			loadUserTheme();
		}
	}, [session?.user?.id, mounted, theme, setTheme]);

	// Avoid hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className={cn("space-y-4", className)}>
				<div className="animate-pulse">
					<div className="h-6 bg-[rgb(var(--color-muted))] rounded w-48 mb-2"></div>
					<div className="h-4 bg-[rgb(var(--color-muted))] rounded w-96 mb-4"></div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{[...Array(8)].map((_, i) => (
							<div
								key={i}
								className="h-32 bg-[rgb(var(--color-muted))] rounded-xl"
							></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	const currentTheme =
		themeOptions.find((t) => t.id === resolvedTheme) || themeOptions[0];

	return (
		<div className={cn("space-y-4", className)}>
			<div>
				<h3 className="text-lg font-semibold text-[rgb(var(--color-foreground))] mb-2">
					Choose Your Theme
				</h3>
				<p className="text-sm text-[rgb(var(--color-muted-foreground))]">
					Select a theme to personalize your writing experience. Changes are
					applied instantly.
				</p>
			</div>

			{/* System Theme Option */}
			<div className="mb-4">
				<div
					className={cn(
						"flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
						theme === "system"
							? "border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/10%)]"
							: "border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-border)/80%)]",
					)}
					onClick={() => handleThemeChange("system")}
				>
					<div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-green-500">
						<svg
							className="w-5 h-5 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<div className="flex-1">
						<div className="text-sm font-medium text-[rgb(var(--color-foreground))]">
							System
						</div>
						<div className="text-xs text-[rgb(var(--color-muted-foreground))]">
							Use your device&apos;s theme setting
						</div>
					</div>
					{theme === "system" && (
						<div className="w-5 h-5 text-[rgb(var(--color-primary))]">
							<svg fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{themeOptions.map((themeOption) => (
					<ThemePreview
						key={themeOption.id}
						theme={themeOption}
						isSelected={theme === themeOption.id}
						onClick={() => handleThemeChange(themeOption.id)}
					/>
				))}
			</div>

			{/* Current Theme Info */}
			<div className="mt-6 p-4 bg-[rgb(var(--color-muted)/50%)] rounded-lg border border-[rgb(var(--color-border))]">
				<div className="flex items-center gap-3">
					<div className="flex -space-x-1">
						<div
							className="w-4 h-4 rounded-full border border-[rgb(var(--color-background))]"
							style={{ backgroundColor: currentTheme.preview.primary }}
						/>
						<div
							className="w-4 h-4 rounded-full border border-[rgb(var(--color-background))]"
							style={{ backgroundColor: currentTheme.preview.secondary }}
						/>
						<div
							className="w-4 h-4 rounded-full border border-[rgb(var(--color-background))]"
							style={{ backgroundColor: currentTheme.preview.background }}
						/>
					</div>
					<div>
						<div className="text-sm font-medium text-[rgb(var(--color-foreground))]">
							Current Theme:{" "}
							{theme === "system"
								? `System (${currentTheme.name})`
								: currentTheme.name}
						</div>
						<div className="text-xs text-[rgb(var(--color-muted-foreground))]">
							{currentTheme.summary}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
