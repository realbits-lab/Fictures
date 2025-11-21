import Link from "next/link";
import { Card, CardContent } from "@/components/ui";

export function CreateStoryCard() {
    return (
        <Link href="/stories/new" className="block h-full">
            <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 border-2 border-dashed border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))]">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] space-y-4 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-primary))] transition-colors">
                    <div className="text-6xl">📖</div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold">+ Create New</h3>
                        <h4 className="text-lg font-semibold">Story</h4>
                        <p className="text-sm text-[rgb(var(--color-muted-foreground)/80%)]">
                            Start your next literary adventure
                        </p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
