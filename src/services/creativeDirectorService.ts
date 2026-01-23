/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CREATIVE DIRECTOR SERVICE — Frontend Integration
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    createBookPlan,
    quickBookPlan,
    extractPromptsForGeneration,
    CreateBookPlanRequest,
    CreativeDirectorResult,
    GeneratedPrompt,
    CreativeBrief,
    BuyerPersona,
    CombinatorialMatrix,
    NarrativeArc,
} from '../server/ai/CreativeDirector';

import {
    QualityTier,
    TierConfig,
    getTierConfig,
    calculateBookTokenCost,
    calculateBookDollarCost,
    getTierComparison,
    QUALITY_TIERS,
} from '../server/ai/QualityTiers';

import { getStoredApiKey } from '../lib/crypto';
import { AudienceId, ComplexityId, StyleId } from '../server/ai/gemini-client';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type {
    CreativeDirectorResult,
    GeneratedPrompt,
    CreativeBrief,
    BuyerPersona,
    CombinatorialMatrix,
    NarrativeArc,
    QualityTier,
    TierConfig,
};

export { QUALITY_TIERS, getTierConfig, calculateBookTokenCost, getTierComparison };

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY HELPER
// ═══════════════════════════════════════════════════════════════════════════════

const getApiKey = async (): Promise<string> => {
    const storedKey = await getStoredApiKey();
    if (storedKey) return storedKey;
    throw new Error('No API key available. Please set your Gemini API key in Settings.');
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATIVE DIRECTOR SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export interface BookPlanOptions {
    concept: string;
    totalPages: number;
    audienceId: AudienceId;
    complexityId: ComplexityId;
    styleId: StyleId;
    tier: QualityTier;
    signal?: AbortSignal;
    onProgress?: (phase: string, message: string, percent: number) => void;
}

/**
 * Create a full book plan using the Creative Director
 */
export const planBook = async (options: BookPlanOptions): Promise<CreativeDirectorResult> => {
    const apiKey = await getApiKey();

    return createBookPlan({
        concept: options.concept,
        totalPages: options.totalPages,
        audienceId: options.audienceId,
        complexityId: options.complexityId,
        styleId: options.styleId,
        apiKey,
        signal: options.signal,
        onProgress: options.onProgress,
    });
};

/**
 * Quick book plan with defaults
 */
export const quickPlan = async (
    concept: string,
    totalPages: number = 40
): Promise<CreativeDirectorResult> => {
    const apiKey = await getApiKey();
    return quickBookPlan(concept, totalPages, apiKey);
};

/**
 * Extract prompts ready for image generation
 */
export const getPromptsForGeneration = extractPromptsForGeneration;

/**
 * Get cost estimate before generating
 */
export const estimateBookCost = (
    tier: QualityTier,
    pageCount: number
): { tokens: number; estimatedDollars: number; tierName: string } => {
    const config = getTierConfig(tier);
    return {
        tokens: calculateBookTokenCost(tier, pageCount),
        estimatedDollars: calculateBookDollarCost(tier, pageCount),
        tierName: `${config.emoji} ${config.name}`,
    };
};

/**
 * Compare both tiers for a given page count
 */
export const compareTiers = (pageCount: number) => {
    return getTierComparison(pageCount);
};
