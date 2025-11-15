import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export function CommunityHighlights() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span>💬</span>
                    Community Highlights
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="p-3 bg-[rgb(var(--color-muted)/50%)] rounded-lg">
                        <p className="text-sm text-[rgb(var(--color-foreground))] mb-2">
                            &ldquo;Theory about Maya&rsquo;s true power
                            origin&rdquo;
                        </p>
                        <div className="flex items-center gap-4 text-xs text-[rgb(var(--color-muted-foreground))]">
                            <span>+847 💬</span>
                            <span>+234 ❤️</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
