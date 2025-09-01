import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@/components/ui";

export function AIAssistantWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🤖</span>
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          &ldquo;Ready to help with Shadow Keeper Part 3 development. Shall we review character arcs and plan Part 4?&rdquo;
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1">
          Ask AI
        </Button>
        <Button size="sm" variant="ghost">
          📖
        </Button>
      </CardFooter>
    </Card>
  );
}