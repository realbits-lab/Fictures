/**
 * Token Cost Calculation Utilities
 *
 * Calculate costs for AI model token usage based on current pricing.
 * Prices are in USD per million tokens.
 *
 * Pricing sources (as of 2025):
 * - OpenAI GPT-4o-mini: $0.150/1M input, $0.600/1M output
 * - OpenAI GPT-4o: $2.50/1M input, $10.00/1M output
 * - Anthropic Claude 3.5 Sonnet: $3.00/1M input, $15.00/1M output
 * - Anthropic Claude 3 Haiku: $0.25/1M input, $1.25/1M output
 */

export interface ModelPricing {
    inputPricePerMillion: number; // USD per 1M tokens
    outputPricePerMillion: number; // USD per 1M tokens
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
    "gpt-4o-mini": {
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.6,
    },
    "gpt-4o": {
        inputPricePerMillion: 2.5,
        outputPricePerMillion: 10.0,
    },
    "gpt-4-turbo": {
        inputPricePerMillion: 10.0,
        outputPricePerMillion: 30.0,
    },
    "gpt-3.5-turbo": {
        inputPricePerMillion: 0.5,
        outputPricePerMillion: 1.5,
    },
    "claude-3.5-sonnet": {
        inputPricePerMillion: 3.0,
        outputPricePerMillion: 15.0,
    },
    "claude-3-sonnet": {
        inputPricePerMillion: 3.0,
        outputPricePerMillion: 15.0,
    },
    "claude-3-haiku": {
        inputPricePerMillion: 0.25,
        outputPricePerMillion: 1.25,
    },
    "claude-3-opus": {
        inputPricePerMillion: 15.0,
        outputPricePerMillion: 75.0,
    },
};

/**
 * Calculate the cost in cents (USD) for token usage
 *
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens generated
 * @param modelName - Name of the AI model used
 * @returns Cost in cents (USD), or 0 if model not found
 */
export function calculateTokenCost(
    inputTokens: number,
    outputTokens: number,
    modelName: string,
): number {
    const pricing = MODEL_PRICING[modelName];
    if (!pricing) {
        console.warn(`Unknown model pricing for: ${modelName}`);
        return 0;
    }

    // Calculate cost in USD
    const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
    const outputCost =
        (outputTokens / 1_000_000) * pricing.outputPricePerMillion;
    const totalCostUSD = inputCost + outputCost;

    // Convert to cents and round
    return Math.round(totalCostUSD * 100);
}

/**
 * Format cost in cents as USD currency string
 *
 * @param cents - Cost in cents
 * @returns Formatted currency string (e.g., "$1.23")
 */
export function formatCost(cents: number): string {
    const dollars = cents / 100;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    }).format(dollars);
}

/**
 * Calculate estimated ad revenue based on impressions
 *
 * Assumes average CPM (cost per thousand impressions) of $2.00
 * This is a conservative estimate for Google AdSense
 *
 * @param impressions - Number of ad impressions
 * @param cpm - Cost per thousand impressions (default: $2.00)
 * @returns Estimated revenue in cents (USD)
 */
export function calculateAdRevenue(
    impressions: number,
    cpm: number = 2.0,
): number {
    const revenueUSD = (impressions / 1000) * cpm;
    return Math.round(revenueUSD * 100);
}

/**
 * Calculate ROI (Return on Investment)
 *
 * @param revenue - Total revenue in cents
 * @param cost - Total cost in cents
 * @returns ROI as a percentage (e.g., 150 for 150% ROI), or null if cost is 0
 */
export function calculateROI(
    revenue: number,
    cost: number,
): number | null {
    if (cost === 0) return null;
    return ((revenue - cost) / cost) * 100;
}

/**
 * Calculate profit margin
 *
 * @param revenue - Total revenue in cents
 * @param cost - Total cost in cents
 * @returns Profit margin as a percentage (e.g., 60 for 60% margin), or null if revenue is 0
 */
export function calculateProfitMargin(
    revenue: number,
    cost: number,
): number | null {
    if (revenue === 0) return null;
    return ((revenue - cost) / revenue) * 100;
}

/**
 * Token usage summary type
 */
export interface TokenUsageSummary {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number; // in cents
    model: string;
}

/**
 * ROI summary type
 */
export interface ROISummary {
    totalCost: number; // in cents
    totalRevenue: number; // in cents
    profit: number; // in cents (revenue - cost)
    roi: number | null; // percentage
    profitMargin: number | null; // percentage
    impressions: number;
}

/**
 * Calculate comprehensive ROI summary
 *
 * @param tokenUsage - Token usage data
 * @param adImpressions - Number of ad impressions
 * @param adRevenueOverride - Optional override for ad revenue (if tracked separately)
 * @returns Complete ROI summary
 */
export function calculateROISummary(
    tokenUsage: TokenUsageSummary[],
    adImpressions: number,
    adRevenueOverride?: number,
): ROISummary {
    const totalCost = tokenUsage.reduce((sum, usage) => sum + usage.cost, 0);
    const totalRevenue =
        adRevenueOverride ?? calculateAdRevenue(adImpressions);
    const profit = totalRevenue - totalCost;
    const roi = calculateROI(totalRevenue, totalCost);
    const profitMargin = calculateProfitMargin(totalRevenue, totalCost);

    return {
        totalCost,
        totalRevenue,
        profit,
        roi,
        profitMargin,
        impressions: adImpressions,
    };
}
