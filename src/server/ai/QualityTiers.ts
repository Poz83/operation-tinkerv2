/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUALITY TIERS v1.0 — Swift ⚡ and Studio 🎯
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Define the two quality tiers that determine which AI models are used
 * and how many tokens each action costs.
 *
 * TIERS:
 * - Swift ⚡: Fast, affordable (Gemini 2.5 Flash Image) - 1 token/image
 * - Studio 🎯: Premium quality (Gemini 3 Pro Image) - 3 tokens/image
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type QualityTier = 'swift' | 'studio';

export interface TierConfig {
    /** Display name */
    name: string;
    /** Emoji icon */
    emoji: string;
    /** Model for image generation */
    imageModel: string;
    /** Model for text/planning */
    textModel: string;
    /** Token cost per generated image */
    tokenCostPerImage: number;
    /** Token cost for Creative Director */
    tokenCostForDirector: number;
    /** User-facing description */
    description: string;
    /** Maximum resolution */
    maxResolution: '1K' | '2K';
    /** Estimated cost per image (for reference) */
    estimatedCostPerImage: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const QUALITY_TIERS: Record<QualityTier, TierConfig> = {
    swift: {
        name: 'Swift',
        emoji: '⚡',
        imageModel: 'gemini-2.5-flash-image',
        textModel: 'gemini-3-flash-preview',
        tokenCostPerImage: 1,
        tokenCostForDirector: 2,
        description: 'Fast & affordable. Perfect for drafts and volume creators.',
        maxResolution: '1K',
        estimatedCostPerImage: 0.039,
    },
    studio: {
        name: 'Studio',
        emoji: '🎯',
        imageModel: 'gemini-3-pro-image-preview',
        textModel: 'gemini-3-flash-preview',
        tokenCostPerImage: 3,
        tokenCostForDirector: 2,
        description: 'Premium quality. Best for final, publishable books.',
        maxResolution: '2K',
        estimatedCostPerImage: 0.134,
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the configuration for a quality tier
 */
export const getTierConfig = (tier: QualityTier): TierConfig => {
    return QUALITY_TIERS[tier];
};

/**
 * Calculate token cost for a book
 */
export const calculateBookTokenCost = (
    tier: QualityTier,
    pageCount: number,
    includeDirector: boolean = true
): number => {
    const config = QUALITY_TIERS[tier];
    const imageCost = pageCount * config.tokenCostPerImage;
    const directorCost = includeDirector ? config.tokenCostForDirector : 0;
    return imageCost + directorCost;
};

/**
 * Calculate estimated $ cost for a book
 */
export const calculateBookDollarCost = (
    tier: QualityTier,
    pageCount: number
): number => {
    const config = QUALITY_TIERS[tier];
    return pageCount * config.estimatedCostPerImage;
};

/**
 * Get the image model for a tier
 */
export const getImageModel = (tier: QualityTier): string => {
    return QUALITY_TIERS[tier].imageModel;
};

/**
 * Get the text model for a tier
 */
export const getTextModel = (tier: QualityTier): string => {
    return QUALITY_TIERS[tier].textModel;
};

/**
 * Format tier for display
 */
export const formatTier = (tier: QualityTier): string => {
    const config = QUALITY_TIERS[tier];
    return `${config.emoji} ${config.name}`;
};

/**
 * Get tier comparison for UI
 */
export const getTierComparison = (pageCount: number) => {
    return {
        swift: {
            ...QUALITY_TIERS.swift,
            totalTokens: calculateBookTokenCost('swift', pageCount),
            estimatedCost: calculateBookDollarCost('swift', pageCount),
        },
        studio: {
            ...QUALITY_TIERS.studio,
            totalTokens: calculateBookTokenCost('studio', pageCount),
            estimatedCost: calculateBookDollarCost('studio', pageCount),
        },
    };
};
