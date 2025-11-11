import Link from "next/link";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui";

export default async function AuthError({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const { error } = await searchParams;

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 pt-16">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="text-4xl mb-4">⚠️</div>
					<CardTitle className="text-2xl">Authentication Error</CardTitle>
					<p className="text-gray-600 dark:text-gray-400">
						There was a problem signing you in
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{error && (
						<div className="text-red-600 text-sm text-center p-3 bg-red-50 dark:bg-red-950 rounded-md">
							Error: {error}
						</div>
					)}
					<Link href="/" className="w-full">
						<Button className="w-full">Return to Home</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
