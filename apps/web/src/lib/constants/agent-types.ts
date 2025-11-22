/**
 * Studio Agent Types
 *
 * Defines the types of AI agents available in the system.
 */

export const AGENT_TYPES = [
    "story-generator", // Main story generation agent
    "editor", // AI Editor - monitors community, suggests retention strategies
    "marketer", // AI Marketer - analyzes ads, suggests revenue optimization
] as const;

export type AgentType = (typeof AGENT_TYPES)[number];

/**
 * Insight Types
 *
 * Defines the types of insights that can be generated for stories.
 */
export const INSIGHT_TYPES = [
    // Existing types
    "quality_improvement",
    "engagement_drop",
    "reader_feedback",
    "pacing_issue",
    "character_development",
    "plot_consistency",
    "trending_up",
    "publishing_opportunity",
    "audience_mismatch",
    // New types for AI Editor
    "community_engagement", // Community activity and engagement patterns
    "retention_strategy", // User retention recommendations
    "content_demand", // Popular content themes from community discussions
    "user_churn_risk", // Users at risk of leaving
    // New types for AI Marketer
    "ad_optimization", // Ad placement and performance optimization
    "revenue_opportunity", // Revenue generation opportunities
    "publishing_schedule", // Optimal publishing times for ad revenue
    "audience_growth", // Strategies to grow audience for better ad performance
] as const;

export type InsightType = (typeof INSIGHT_TYPES)[number];
