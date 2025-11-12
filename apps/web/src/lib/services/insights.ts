import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
    analysisEvents,
    chapters,
    comments,
    sceneEvaluations,
    scenes,
    stories,
    storyInsights,
} from "@/lib/db/schema";

// Use Gemini Flash for analytics insights (fast, cost-effective for text generation)
const analyticsModel = google("gemini-2.0-flash-exp");

export interface GenerateInsightsParams {
    storyId: string;
    includeTypes?: string[];
}

export async function generateStoryInsights({
    storyId,
    includeTypes = [
        "quality_improvement",
        "engagement_drop",
        "reader_feedback",
    ],
}: GenerateInsightsParams): Promise<void> {
    const story = await db.query.stories.findFirst({
        where: eq(stories.id, storyId),
        with: {
            chapters: {
                with: {
                    scenes: true,
                },
            },
        },
    });

    if (!story) throw new Error("Story not found");

    for (const insightType of includeTypes) {
        switch (insightType) {
            case "quality_improvement":
                await generateQualityInsights(story);
                break;
            case "engagement_drop":
                await generateEngagementInsights(story);
                break;
            case "reader_feedback":
                await generateReaderFeedbackInsights(story);
                break;
        }
    }
}

async function generateQualityInsights(story: any): Promise<void> {
    const sceneIds = story.chapters.flatMap((ch: any) =>
        ch.scenes.map((sc: any) => sc.id),
    );

    if (sceneIds.length === 0) return;

    const allEvaluations = await db
        .select()
        .from(sceneEvaluations)
        .where(
            sql`${sceneEvaluations.sceneId} IN (${sql.join(
                sceneIds.map((id: string) => sql`${id}`),
                sql`, `,
            )})`,
        );

    if (allEvaluations.length === 0) return;

    const avgScores = {
        plot: average(allEvaluations.map((e: any) => parseFloat(e.plotScore))),
        character: average(
            allEvaluations.map((e: any) => parseFloat(e.characterScore)),
        ),
        pacing: average(
            allEvaluations.map((e: any) => parseFloat(e.pacingScore)),
        ),
        prose: average(
            allEvaluations.map((e: any) => parseFloat(e.proseScore)),
        ),
        worldBuilding: average(
            allEvaluations.map((e: any) => parseFloat(e.worldBuildingScore)),
        ),
    };

    const lowestCategory = Object.entries(avgScores).reduce(
        (min, [key, value]) =>
            value < min.value ? { category: key, value } : min,
        { category: "", value: 100 },
    );

    const problemScenes = allEvaluations
        .filter((e: any) => {
            const scoreKey = `${lowestCategory.category}Score`;
            return parseFloat(e[scoreKey as keyof typeof e] as string) < 70;
        })
        .sort((a: any, b: any) => {
            const scoreKey = `${lowestCategory.category}Score`;
            return (
                parseFloat(a[scoreKey as keyof typeof a] as string) -
                parseFloat(b[scoreKey as keyof typeof b] as string)
            );
        })
        .slice(0, 3);

    const recommendations = await generateRecommendations(
        story,
        lowestCategory.category,
        problemScenes,
    );

    await db.insert(storyInsights).values({
        id: nanoid(),
        storyId: story.id,
        insightType: "quality_improvement",
        title: `Improve ${capitalizeFirst(lowestCategory.category)}`,
        summary: `Your ${lowestCategory.category} scores average ${lowestCategory.value.toFixed(1)}/100. ${recommendations.summary}`,
        severity: lowestCategory.value < 60 ? "warning" : "info",
        actionItems: recommendations.actionItems,
        metrics: {
            category: lowestCategory.category,
            avgScore: lowestCategory.value,
            affectedScenes: problemScenes.length,
            scores: avgScores,
        },
        aiModel: "gemini-2.0-flash-exp",
        confidenceScore: "0.85",
        createdAt: new Date(),
    });
}

async function generateEngagementInsights(story: any): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString();

    const engagementData = await db
        .select({
            date: sql<string>`DATE(${analysisEvents.timestamp})`,
            views: sql<number>`COUNT(DISTINCT CASE WHEN ${analysisEvents.eventType} = 'chapter_read_start' THEN ${analysisEvents.id} END)`,
            engagements: sql<number>`COUNT(CASE WHEN ${analysisEvents.eventType} IN ('comment_created', 'story_liked') THEN ${analysisEvents.id} END)`,
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, story.id),
                gte(analysisEvents.timestamp, thirtyDaysAgoString),
            ),
        )
        .groupBy(sql`DATE(${analysisEvents.timestamp})`)
        .orderBy(sql`DATE(${analysisEvents.timestamp})`);

    if (engagementData.length < 3) return;

    const slope = calculateTrendSlope(engagementData.map((d) => d.views || 0));

    if (slope < -0.5) {
        const decline = Math.abs(
            (slope * 100) / (engagementData[0]?.views || 1),
        );

        await db.insert(storyInsights).values({
            id: nanoid(),
            storyId: story.id,
            insightType: "engagement_drop",
            title: "Engagement Declining",
            summary: `Reader engagement has dropped by ${decline.toFixed(0)}% over the last 30 days. Consider publishing new content or engaging with your community.`,
            severity: decline > 30 ? "warning" : "info",
            actionItems: [
                "Publish a new chapter to re-engage readers",
                "Post a community update or behind-the-scenes content",
                "Respond to recent comments to boost interaction",
                "Share your story on social media",
            ],
            metrics: {
                declinePercentage: decline,
                currentViews:
                    engagementData[engagementData.length - 1]?.views || 0,
                peakViews: Math.max(...engagementData.map((d) => d.views || 0)),
            },
            aiModel: "rule-based",
            confidenceScore: "0.90",
            createdAt: new Date(),
        });
    }
}

async function generateReaderFeedbackInsights(story: any): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentComments = await db
        .select({
            content: comments.content,
        })
        .from(comments)
        .where(
            and(
                eq(comments.storyId, story.id),
                gte(comments.createdAt, thirtyDaysAgo),
            ),
        )
        .limit(50);

    if (recentComments.length < 5) return;

    const analysis = await analyzeCommentSentiment(
        recentComments.map((c) => c.content),
    );

    await db.insert(storyInsights).values({
        id: nanoid(),
        storyId: story.id,
        insightType: "reader_feedback",
        title: "Reader Feedback Summary",
        summary: analysis.summary,
        severity: "info",
        actionItems: analysis.suggestions,
        metrics: {
            totalComments: recentComments.length,
            sentiment: analysis.sentiment,
            themes: analysis.themes,
        },
        aiModel: "gemini-2.0-flash-exp",
        confidenceScore: "0.75",
        createdAt: new Date(),
    });
}

async function generateRecommendations(
    story: any,
    category: string,
    problemScenes: any[],
): Promise<{ summary: string; actionItems: string[] }> {
    const prompt = `As a writing coach, analyze this story's ${category} issues:

Story: ${story.title}
Problematic scenes: ${problemScenes.map((s: any) => s.sceneId).join(", ")}

Scene evaluations:
${JSON.stringify(
    problemScenes.map((s: any) => ({
        sceneId: s.sceneId,
        score: s[`${category}Score`],
    })),
    null,
    2,
)}

Provide:
1. A one-sentence summary of the issue
2. 3-5 specific, actionable recommendations to improve ${category}

Format as JSON:
{
  "summary": "string",
  "actionItems": ["string"]
}`;

    try {
        const { text } = await generateText({
            model: analyticsModel,
            prompt,
            temperature: 0.7,
        });

        return JSON.parse(
            text ||
                '{"summary": "Unable to generate recommendations", "actionItems": []}',
        );
    } catch (error) {
        console.error("Failed to generate recommendations:", error);
        return {
            summary: "Unable to generate AI recommendations at this time.",
            actionItems: [
                "Review your scenes manually for improvements",
                "Consider getting feedback from beta readers",
            ],
        };
    }
}

async function analyzeCommentSentiment(commentTexts: string[]): Promise<{
    summary: string;
    sentiment: { positive: number; neutral: number; negative: number };
    themes: string[];
    suggestions: string[];
}> {
    const prompt = `Analyze these reader comments for a fiction story:

${commentTexts.join("\n\n")}

Provide:
1. Overall sentiment breakdown (percentage positive, neutral, negative)
2. Top 3-5 recurring themes readers mention
3. A one-sentence summary
4. 3-5 suggestions for the author based on feedback

Format as JSON:
{
  "summary": "string",
  "sentiment": { "positive": number, "neutral": number, "negative": number },
  "themes": ["string"],
  "suggestions": ["string"]
}`;

    try {
        const { text } = await generateText({
            model: analyticsModel,
            prompt,
            temperature: 0.5,
        });

        return JSON.parse(
            text ||
                '{"summary": "Unable to analyze", "sentiment": {"positive": 0, "neutral": 0, "negative": 0}, "themes": [], "suggestions": []}',
        );
    } catch (error) {
        console.error("Failed to analyze sentiment:", error);
        return {
            summary: "Unable to analyze comment sentiment at this time.",
            sentiment: { positive: 0, neutral: 0, negative: 0 },
            themes: [],
            suggestions: ["Manually review reader comments for patterns"],
        };
    }
}

function average(numbers: number[]): number {
    return numbers.length > 0
        ? numbers.reduce((a, b) => a + b, 0) / numbers.length
        : 0;
}

function calculateTrendSlope(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0;

    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
