/* eslint-disable @typescript-eslint/no-explicit-any */
// biome-ignore lint/suspicious/noExplicitAny: Database query results use any for flexibility

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
    analysisEvents,
    comments,
    communityPosts,
    communityReplies,
    sceneEvaluations,
    stories,
    storyInsights,
    users,
} from "@/lib/schemas/database";

// Use Gemini Flash for analysis insights (fast, cost-effective for text generation)
const analysisModel = google("gemini-2.0-flash-exp");

export interface GenerateInsightsParams {
    storyId: string;
    includeTypes?: string[];
}

export interface GenerateEditorInsightsParams {
    storyId?: string; // If not provided, generates insights for all stories
    userId?: string; // If provided, generates insights for user's stories only
}

export interface GenerateMarketerInsightsParams {
    storyId: string;
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

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
// biome-ignore lint/suspicious/noExplicitAny: Database query result type
async function generateQualityInsights(story: any): Promise<void> {
    // biome-ignore lint/suspicious/noExplicitAny: Database query result type
    const sceneIds = story.chapters.flatMap((ch: any) =>
        // biome-ignore lint/suspicious/noExplicitAny: Database query result type
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
        description: `Your ${lowestCategory.category} scores average ${lowestCategory.value.toFixed(1)}/100. ${recommendations.summary}`,
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
        createdAt: new Date().toISOString(),
    });
}

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
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
            description: `Reader engagement has dropped by ${decline.toFixed(0)}% over the last 30 days. Consider publishing new content or engaging with your community.`,
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
            createdAt: new Date().toISOString(),
        });
    }
}

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
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
                gte(comments.createdAt, thirtyDaysAgo.toISOString()),
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
        description: analysis.summary,
        severity: "info",
        actionItems: analysis.suggestions,
        metrics: {
            totalComments: recentComments.length,
            sentiment: analysis.sentiment,
            themes: analysis.themes,
        },
        aiModel: "gemini-2.0-flash-exp",
        confidenceScore: "0.75",
        createdAt: new Date().toISOString(),
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
            model: analysisModel,
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
            model: analysisModel,
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

// =============================================================================
// AI Editor - Community Monitoring & Retention Insights
// =============================================================================

/**
 * Generate AI Editor insights for community engagement and user retention
 * Monitors community posts, replies, and user activity to suggest retention strategies
 */
export async function generateEditorInsights({
    storyId,
    userId,
}: GenerateEditorInsightsParams): Promise<void> {
    let targetStories: any[] = [];

    if (storyId) {
        const story = await db.query.stories.findFirst({
            where: eq(stories.id, storyId),
        });
        if (story) targetStories = [story];
    } else if (userId) {
        targetStories = await db.query.stories.findMany({
            where: eq(stories.authorId, userId),
        });
    }

    if (targetStories.length === 0) return;

    for (const story of targetStories) {
        await Promise.all([
            generateCommunityEngagementInsights(story),
            generateContentDemandInsights(story),
            generateRetentionStrategyInsights(story),
            generateUserChurnRiskInsights(story),
        ]);
    }
}

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
async function generateCommunityEngagementInsights(story: any): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get community posts and replies for this story
    const posts = await db
        .select({
            id: communityPosts.id,
            title: communityPosts.title,
            content: communityPosts.content,
            authorId: communityPosts.authorId,
            likes: communityPosts.likes,
            replies: communityPosts.replies,
            views: communityPosts.views,
            createdAt: communityPosts.createdAt,
        })
        .from(communityPosts)
        .where(
            and(
                eq(communityPosts.storyId, story.id),
                gte(communityPosts.createdAt, thirtyDaysAgo.toISOString()),
            ),
        )
        .orderBy(desc(communityPosts.createdAt))
        .limit(50);

    if (posts.length === 0) {
        // Low community engagement - suggest creating engaging content
        await db.insert(storyInsights).values({
            id: nanoid(),
            storyId: story.id,
            insightType: "community_engagement",
            title: "Low Community Activity",
            description:
                "No community posts in the last 30 days. Creating engaging community content can significantly improve user retention.",
            severity: "warning",
            actionItems: [
                "Create a discussion post asking readers about their favorite character",
                "Share behind-the-scenes content about your writing process",
                "Ask readers for feedback on upcoming story directions",
                "Host a Q&A session with your readers",
            ],
            metrics: {
                totalPosts: 0,
                periodDays: 30,
            },
            aiModel: "rule-based",
            confidenceScore: "0.95",
            createdAt: new Date().toISOString(),
        });
        return;
    }

    // Analyze community engagement patterns
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalReplies = posts.reduce((sum, p) => sum + (p.replies || 0), 0);
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const avgEngagementRate =
        totalViews > 0 ? ((totalLikes + totalReplies) / totalViews) * 100 : 0;

    // Use AI to analyze post content and suggest engagement strategies
    const analysis = await analyzeCommunityEngagement(posts);

    await db.insert(storyInsights).values({
        id: nanoid(),
        storyId: story.id,
        insightType: "community_engagement",
        title: "Community Engagement Analysis",
        description: analysis.summary,
        severity: avgEngagementRate < 5 ? "warning" : "info",
        actionItems: analysis.suggestions,
        metrics: {
            totalPosts: posts.length,
            totalLikes,
            totalReplies,
            totalViews,
            avgEngagementRate: avgEngagementRate.toFixed(2),
            topTopics: analysis.topTopics,
            periodDays: 30,
        },
        aiModel: "gemini-2.0-flash-exp",
        confidenceScore: "0.82",
        createdAt: new Date().toISOString(),
    });
}

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
async function generateContentDemandInsights(story: any): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get recent community posts and replies to identify content demand
    const posts = await db
        .select({
            title: communityPosts.title,
            content: communityPosts.content,
            replies: communityPosts.replies,
        })
        .from(communityPosts)
        .where(
            and(
                eq(communityPosts.storyId, story.id),
                gte(communityPosts.createdAt, thirtyDaysAgo.toISOString()),
            ),
        )
        .limit(30);

    const replies = await db
        .select({
            content: communityReplies.content,
            postId: communityReplies.postId,
        })
        .from(communityReplies)
        .innerJoin(
            communityPosts,
            eq(communityReplies.postId, communityPosts.id),
        )
        .where(
            and(
                eq(communityPosts.storyId, story.id),
                gte(communityReplies.createdAt, thirtyDaysAgo.toISOString()),
            ),
        )
        .limit(100);

    if (posts.length < 3 && replies.length < 5) return;

    // Analyze content demand using AI
    const contentAnalysis = await analyzeContentDemand(
        posts.map((p) => `${p.title}\n${p.content}`),
        replies.map((r) => r.content),
    );

    await db.insert(storyInsights).values({
        id: nanoid(),
        storyId: story.id,
        insightType: "content_demand",
        title: "Content Demand Analysis",
        description: contentAnalysis.summary,
        severity: "info",
        actionItems: contentAnalysis.suggestions,
        metrics: {
            analyzedPosts: posts.length,
            analyzedReplies: replies.length,
            requestedThemes: contentAnalysis.themes,
            requestedCharacters: contentAnalysis.characters,
            periodDays: 30,
        },
        aiModel: "gemini-2.0-flash-exp",
        confidenceScore: "0.78",
        createdAt: new Date().toISOString(),
    });
}

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
async function generateRetentionStrategyInsights(story: any): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get engagement data for trend analysis
    const recentEngagement = await db
        .select({
            views: sql<number>`COUNT(DISTINCT ${analysisEvents.sessionId})`,
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, story.id),
                gte(analysisEvents.timestamp, thirtyDaysAgo.toISOString()),
            ),
        );

    const previousEngagement = await db
        .select({
            views: sql<number>`COUNT(DISTINCT ${analysisEvents.sessionId})`,
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, story.id),
                gte(analysisEvents.timestamp, sixtyDaysAgo.toISOString()),
                sql`${analysisEvents.timestamp} < ${thirtyDaysAgo.toISOString()}`,
            ),
        );

    const recentViews = recentEngagement[0]?.views || 0;
    const previousViews = previousEngagement[0]?.views || 0;
    const changePercent =
        previousViews > 0
            ? ((recentViews - previousViews) / previousViews) * 100
            : 0;

    // Generate AI-powered retention strategies
    const strategies = await generateRetentionStrategies(
        story,
        recentViews,
        changePercent,
    );

    const severity =
        changePercent < -20 ? "warning" : changePercent < 0 ? "info" : "info";

    await db.insert(storyInsights).values({
        id: nanoid(),
        storyId: story.id,
        insightType: "retention_strategy",
        title:
            changePercent < 0
                ? "Reader Retention Strategies Needed"
                : "Reader Retention Optimization",
        description: strategies.summary,
        severity,
        actionItems: strategies.suggestions,
        metrics: {
            recentViews,
            previousViews,
            changePercent: changePercent.toFixed(1),
            trend: changePercent < 0 ? "declining" : "growing",
        },
        aiModel: "gemini-2.0-flash-exp",
        confidenceScore: "0.80",
        createdAt: new Date().toISOString(),
    });
}

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
async function generateUserChurnRiskInsights(story: any): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Identify users who were active but haven't engaged recently
    const activeUsersBefore = await db
        .select({
            userId: analysisEvents.userId,
            lastActivity: sql<string>`MAX(${analysisEvents.timestamp})`,
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, story.id),
                sql`${analysisEvents.userId} IS NOT NULL`,
            ),
        )
        .groupBy(analysisEvents.userId)
        .having(
            sql`MAX(${analysisEvents.timestamp}) < ${thirtyDaysAgo.toISOString()}`,
        );

    if (activeUsersBefore.length === 0) return;

    const churnRiskPercent =
        (activeUsersBefore.length /
            Math.max(activeUsersBefore.length + 10, 1)) *
        100;

    await db.insert(storyInsights).values({
        id: nanoid(),
        storyId: story.id,
        insightType: "user_churn_risk",
        title: "Reader Churn Risk Detected",
        description: `${activeUsersBefore.length} previously active readers haven't engaged in 30+ days. Consider re-engagement campaigns.`,
        severity: churnRiskPercent > 30 ? "warning" : "info",
        actionItems: [
            "Send personalized email to inactive readers with story updates",
            "Create a 'welcome back' post highlighting what they've missed",
            "Offer exclusive content or early access to re-engage readers",
            "Publish a new chapter or major story development",
        ],
        metrics: {
            inactiveUsers: activeUsersBefore.length,
            churnRiskPercent: churnRiskPercent.toFixed(1),
            periodDays: 30,
        },
        aiModel: "rule-based",
        confidenceScore: "0.88",
        createdAt: new Date().toISOString(),
    });
}

// =============================================================================
// AI Marketer - Ad Optimization & Revenue Insights
// =============================================================================

/**
 * Generate AI Marketer insights for ad optimization and revenue growth
 * Analyzes ad performance, reader engagement patterns, and suggests revenue optimization
 */
export async function generateMarketerInsights({
    storyId,
}: GenerateMarketerInsightsParams): Promise<void> {
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

    await Promise.all([
        generateAdOptimizationInsights(story),
        generateRevenueOpportunityInsights(story),
        generatePublishingScheduleInsights(story),
        generateAudienceGrowthInsights(story),
    ]);
}

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
async function generateAdOptimizationInsights(story: any): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Analyze page views and reading patterns for ad optimization
    const viewData = await db
        .select({
            sceneId: analysisEvents.sceneId,
            views: sql<number>`COUNT(*)`,
            avgDuration: sql<number>`AVG(CASE WHEN ${analysisEvents.metadata}->>'durationSeconds' IS NOT NULL THEN (${analysisEvents.metadata}->>'durationSeconds')::int ELSE NULL END)`,
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, story.id),
                gte(analysisEvents.timestamp, thirtyDaysAgo.toISOString()),
                eq(analysisEvents.eventType, "scene_read"),
            ),
        )
        .groupBy(analysisEvents.sceneId)
        .limit(20);

    if (viewData.length === 0) return;

    // Generate AI-powered ad optimization strategies
    const adAnalysis = await analyzeAdOptimization(story, viewData);

    await db.insert(storyInsights).values({
        id: nanoid(),
        storyId: story.id,
        insightType: "ad_optimization",
        title: "Ad Placement Optimization",
        description: adAnalysis.summary,
        severity: "info",
        actionItems: adAnalysis.suggestions,
        metrics: {
            totalViews: viewData.reduce(
                (sum, d) => sum + (Number(d.views) || 0),
                0,
            ),
            avgViewDuration: average(
                viewData.map((d) => Number(d.avgDuration) || 0),
            ).toFixed(1),
            highEngagementScenes: viewData.filter(
                (d) => Number(d.avgDuration) > 60,
            ).length,
            periodDays: 30,
        },
        aiModel: "gemini-2.0-flash-exp",
        confidenceScore: "0.76",
        createdAt: new Date().toISOString(),
    });
}

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
async function generateRevenueOpportunityInsights(story: any): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Analyze reader engagement for revenue opportunities
    const engagementData = await db
        .select({
            totalReaders: sql<number>`COUNT(DISTINCT ${analysisEvents.userId})`,
            totalSessions: sql<number>`COUNT(DISTINCT ${analysisEvents.sessionId})`,
            avgSessionDuration: sql<number>`AVG(CASE WHEN ${analysisEvents.metadata}->>'durationSeconds' IS NOT NULL THEN (${analysisEvents.metadata}->>'durationSeconds')::int ELSE NULL END)`,
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, story.id),
                gte(analysisEvents.timestamp, thirtyDaysAgo.toISOString()),
            ),
        );

    const data = engagementData[0];
    if (!data || (data.totalReaders || 0) < 10) return;

    // Generate revenue optimization strategies
    const revenueAnalysis = await analyzeRevenueOpportunities(story, data);

    await db.insert(storyInsights).values({
        id: nanoid(),
        storyId: story.id,
        insightType: "revenue_opportunity",
        title: "Revenue Growth Opportunities",
        description: revenueAnalysis.summary,
        severity: "info",
        actionItems: revenueAnalysis.suggestions,
        metrics: {
            totalReaders: data.totalReaders,
            totalSessions: data.totalSessions,
            avgSessionDuration: Number(data.avgSessionDuration || 0).toFixed(1),
            estimatedRevenueMultiplier: revenueAnalysis.estimatedMultiplier,
            periodDays: 30,
        },
        aiModel: "gemini-2.0-flash-exp",
        confidenceScore: "0.74",
        createdAt: new Date().toISOString(),
    });
}

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
async function generatePublishingScheduleInsights(story: any): Promise<void> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Analyze publishing pattern and reader engagement by day/time
    const publishingData = await db
        .select({
            dayOfWeek: sql<number>`EXTRACT(DOW FROM ${analysisEvents.timestamp})`,
            hour: sql<number>`EXTRACT(HOUR FROM ${analysisEvents.timestamp})`,
            views: sql<number>`COUNT(*)`,
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, story.id),
                eq(analysisEvents.eventType, "chapter_read_start"),
                gte(analysisEvents.timestamp, ninetyDaysAgo.toISOString()),
            ),
        )
        .groupBy(
            sql`EXTRACT(DOW FROM ${analysisEvents.timestamp})`,
            sql`EXTRACT(HOUR FROM ${analysisEvents.timestamp})`,
        );

    if (publishingData.length < 5) return;

    // Find optimal publishing times
    const scheduleAnalysis = await analyzePublishingSchedule(publishingData);

    await db.insert(storyInsights).values({
        id: nanoid(),
        storyId: story.id,
        insightType: "publishing_schedule",
        title: "Optimal Publishing Schedule",
        description: scheduleAnalysis.summary,
        severity: "info",
        actionItems: scheduleAnalysis.suggestions,
        metrics: {
            optimalDays: scheduleAnalysis.bestDays,
            optimalHours: scheduleAnalysis.bestHours,
            peakEngagementTime: scheduleAnalysis.peakTime,
            periodDays: 90,
        },
        aiModel: "gemini-2.0-flash-exp",
        confidenceScore: "0.79",
        createdAt: new Date().toISOString(),
    });
}

// biome-ignore lint/suspicious/noExplicitAny: Database query result type
async function generateAudienceGrowthInsights(story: any): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Analyze new vs returning readers
    const audienceData = await db
        .select({
            newReaders: sql<number>`COUNT(DISTINCT CASE WHEN ${analysisEvents.metadata}->>'isFirstVisit' = 'true' THEN ${analysisEvents.userId} END)`,
            returningReaders: sql<number>`COUNT(DISTINCT CASE WHEN ${analysisEvents.metadata}->>'isFirstVisit' = 'false' THEN ${analysisEvents.userId} END)`,
            totalViews: sql<number>`COUNT(*)`,
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, story.id),
                gte(analysisEvents.timestamp, thirtyDaysAgo.toISOString()),
            ),
        );

    const data = audienceData[0];
    if (!data) return;

    const newReaders = Number(data.newReaders) || 0;
    const returningReaders = Number(data.returningReaders) || 0;
    const growthRate =
        returningReaders > 0
            ? (newReaders / (newReaders + returningReaders)) * 100
            : 0;

    // Generate audience growth strategies
    const growthAnalysis = await analyzeAudienceGrowth(
        story,
        newReaders,
        returningReaders,
        growthRate,
    );

    await db.insert(storyInsights).values({
        id: nanoid(),
        storyId: story.id,
        insightType: "audience_growth",
        title: "Audience Growth Strategy",
        description: growthAnalysis.summary,
        severity: growthRate < 20 ? "warning" : "info",
        actionItems: growthAnalysis.suggestions,
        metrics: {
            newReaders,
            returningReaders,
            growthRate: growthRate.toFixed(1),
            totalViews: data.totalViews,
            periodDays: 30,
        },
        aiModel: "gemini-2.0-flash-exp",
        confidenceScore: "0.77",
        createdAt: new Date().toISOString(),
    });
}

// =============================================================================
// AI Analysis Helper Functions
// =============================================================================

async function analyzeCommunityEngagement(posts: any[]): Promise<{
    summary: string;
    suggestions: string[];
    topTopics: string[];
}> {
    const prompt = `Analyze these community posts for engagement patterns:

${posts
    .slice(0, 10)
    .map(
        (p) =>
            `Title: ${p.title}\nLikes: ${p.likes}, Replies: ${p.replies}, Views: ${p.views}`,
    )
    .join("\n\n")}

Provide:
1. A one-sentence summary of community engagement health
2. Top 3-5 topics being discussed
3. 3-5 specific suggestions to improve community engagement

Format as JSON:
{
  "summary": "string",
  "topTopics": ["string"],
  "suggestions": ["string"]
}`;

    try {
        const { text } = await generateText({
            model: analysisModel,
            prompt,
            temperature: 0.6,
        });

        return JSON.parse(
            text ||
                '{"summary": "Unable to analyze", "topTopics": [], "suggestions": []}',
        );
    } catch (error) {
        console.error("Failed to analyze community engagement:", error);
        return {
            summary: "Unable to analyze community engagement at this time.",
            topTopics: [],
            suggestions: ["Manually review community posts for patterns"],
        };
    }
}

async function analyzeContentDemand(
    posts: string[],
    replies: string[],
): Promise<{
    summary: string;
    suggestions: string[];
    themes: string[];
    characters: string[];
}> {
    const prompt = `Analyze reader discussions to identify content demand:

Posts:
${posts.slice(0, 10).join("\n\n")}

Replies:
${replies.slice(0, 20).join("\n\n")}

Identify:
1. What content readers are asking for
2. Which themes interest them most
3. Which characters they want to see more of
4. Suggestions for new content to create

Format as JSON:
{
  "summary": "string",
  "themes": ["string"],
  "characters": ["string"],
  "suggestions": ["string"]
}`;

    try {
        const { text } = await generateText({
            model: analysisModel,
            prompt,
            temperature: 0.6,
        });

        return JSON.parse(
            text ||
                '{"summary": "Unable to analyze", "themes": [], "characters": [], "suggestions": []}',
        );
    } catch (error) {
        console.error("Failed to analyze content demand:", error);
        return {
            summary: "Unable to analyze content demand at this time.",
            themes: [],
            characters: [],
            suggestions: ["Review community discussions manually"],
        };
    }
}

async function generateRetentionStrategies(
    story: any,
    recentViews: number,
    changePercent: number,
): Promise<{
    summary: string;
    suggestions: string[];
}> {
    const prompt = `As a reader retention expert, analyze this story's engagement:

Story: ${story.title}
Recent views (30 days): ${recentViews}
Change from previous period: ${changePercent.toFixed(1)}%

Provide:
1. A one-sentence summary of retention status
2. 4-6 specific, actionable strategies to improve reader retention

Format as JSON:
{
  "summary": "string",
  "suggestions": ["string"]
}`;

    try {
        const { text } = await generateText({
            model: analysisModel,
            prompt,
            temperature: 0.7,
        });

        return JSON.parse(
            text ||
                '{"summary": "Unable to generate strategies", "suggestions": []}',
        );
    } catch (error) {
        console.error("Failed to generate retention strategies:", error);
        return {
            summary: "Unable to generate retention strategies at this time.",
            suggestions: [
                "Publish content consistently",
                "Engage with reader comments",
                "Create community discussions",
            ],
        };
    }
}

async function analyzeAdOptimization(
    story: any,
    viewData: any[],
): Promise<{
    summary: string;
    suggestions: string[];
}> {
    const prompt = `As an ad optimization expert, analyze this story's ad placement potential:

Story: ${story.title}
Total scenes with views: ${viewData.length}
High engagement scenes (60+ seconds): ${viewData.filter((d) => Number(d.avgDuration) > 60).length}

Provide:
1. A one-sentence summary of ad optimization opportunities
2. 4-6 specific suggestions for optimal ad placement

Format as JSON:
{
  "summary": "string",
  "suggestions": ["string"]
}`;

    try {
        const { text } = await generateText({
            model: analysisModel,
            prompt,
            temperature: 0.6,
        });

        return JSON.parse(
            text || '{"summary": "Unable to analyze", "suggestions": []}',
        );
    } catch (error) {
        console.error("Failed to analyze ad optimization:", error);
        return {
            summary: "Unable to analyze ad optimization at this time.",
            suggestions: [
                "Place ads in high-engagement scenes",
                "Avoid interrupting emotional moments",
                "Test different ad formats",
            ],
        };
    }
}

async function analyzeRevenueOpportunities(
    story: any,
    data: any,
): Promise<{
    summary: string;
    suggestions: string[];
    estimatedMultiplier: string;
}> {
    const totalReaders = Number(data.totalReaders) || 0;
    const avgDuration = Number(data.avgSessionDuration) || 0;

    const prompt = `As a revenue optimization expert, analyze revenue opportunities:

Story: ${story.title}
Total readers (30 days): ${totalReaders}
Average session duration: ${avgDuration.toFixed(0)} seconds

Provide:
1. A one-sentence summary of revenue potential
2. 4-6 specific strategies to increase ad revenue
3. Estimated revenue multiplier potential (as percentage)

Format as JSON:
{
  "summary": "string",
  "suggestions": ["string"],
  "estimatedMultiplier": "X.Xx"
}`;

    try {
        const { text } = await generateText({
            model: analysisModel,
            prompt,
            temperature: 0.6,
        });

        return JSON.parse(
            text ||
                '{"summary": "Unable to analyze", "suggestions": [], "estimatedMultiplier": "1.0"}',
        );
    } catch (error) {
        console.error("Failed to analyze revenue opportunities:", error);
        return {
            summary: "Unable to analyze revenue opportunities at this time.",
            suggestions: ["Increase reader engagement", "Grow audience size"],
            estimatedMultiplier: "1.0",
        };
    }
}

async function analyzePublishingSchedule(publishingData: any[]): Promise<{
    summary: string;
    suggestions: string[];
    bestDays: string[];
    bestHours: string[];
    peakTime: string;
}> {
    // Find peak engagement times
    const sortedByViews = [...publishingData].sort(
        (a, b) => Number(b.views) - Number(a.views),
    );
    const topSlots = sortedByViews.slice(0, 5);

    const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    const bestDays = [
        ...new Set(
            topSlots.map(
                (slot) => dayNames[Number(slot.dayOfWeek)] || "Unknown",
            ),
        ),
    ].slice(0, 3);
    const bestHours = [
        ...new Set(topSlots.map((slot) => `${Number(slot.hour)}:00`)),
    ].slice(0, 3);

    const peakSlot = topSlots[0];
    const peakTime = peakSlot
        ? `${dayNames[Number(peakSlot.dayOfWeek)]} at ${Number(peakSlot.hour)}:00`
        : "Unknown";

    const prompt = `As a publishing strategy expert, analyze optimal publishing times:

Peak engagement: ${peakTime}
Best days: ${bestDays.join(", ")}
Best hours: ${bestHours.join(", ")}

Provide:
1. A one-sentence summary of optimal publishing strategy
2. 3-5 specific scheduling recommendations for maximizing ad revenue

Format as JSON:
{
  "summary": "string",
  "suggestions": ["string"]
}`;

    try {
        const { text } = await generateText({
            model: analysisModel,
            prompt,
            temperature: 0.6,
        });

        const result = JSON.parse(
            text || '{"summary": "Unable to analyze", "suggestions": []}',
        );

        return {
            ...result,
            bestDays,
            bestHours,
            peakTime,
        };
    } catch (error) {
        console.error("Failed to analyze publishing schedule:", error);
        return {
            summary: "Unable to analyze publishing schedule at this time.",
            suggestions: ["Publish during peak reader activity times"],
            bestDays,
            bestHours,
            peakTime,
        };
    }
}

async function analyzeAudienceGrowth(
    story: any,
    newReaders: number,
    returningReaders: number,
    growthRate: number,
): Promise<{
    summary: string;
    suggestions: string[];
}> {
    const prompt = `As an audience growth expert, analyze reader acquisition:

Story: ${story.title}
New readers (30 days): ${newReaders}
Returning readers: ${returningReaders}
Growth rate: ${growthRate.toFixed(1)}%

Provide:
1. A one-sentence summary of audience growth status
2. 4-6 specific strategies to grow audience for better ad revenue

Format as JSON:
{
  "summary": "string",
  "suggestions": ["string"]
}`;

    try {
        const { text } = await generateText({
            model: analysisModel,
            prompt,
            temperature: 0.7,
        });

        return JSON.parse(
            text || '{"summary": "Unable to analyze", "suggestions": []}',
        );
    } catch (error) {
        console.error("Failed to analyze audience growth:", error);
        return {
            summary: "Unable to analyze audience growth at this time.",
            suggestions: [
                "Promote story on social media",
                "Improve story discoverability",
                "Engage with reader community",
            ],
        };
    }
}
