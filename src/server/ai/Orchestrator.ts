/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ORCHESTRATOR v3.0 — Simplified Single-Pass Generation
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SIMPLIFIED in v3.0:
 * - Removed QA validation loop
 * - Removed auto-repair logic
 * - Removed Art Editor review
 * - Single-pass generation with strong prompt constraints
 * - Optional prompt enhancement preserved
 *
 * Quality is now ensured by:
 * 1. Strong negative constraints in buildPrompt()
 * 2. Client-side greyscale detection (separate module)
 * 3. User-triggered regeneration
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    generateColoringPage as generateWithGemini,
    enhancePrompt,
    getPromptPreview,
    GEMINI_IMAGE_MODEL,
    StyleId,
    ComplexityId,
    AudienceId,
    ImageSize,
} from './gemini-client';

import {
    generateColoringPage as generateWithReplicate,
    enhancePromptForFlux,
    REPLICATE_MODEL,
} from './replicate-client';

import { getTierConfig, QualityTier } from './QualityTiers';

import { Logger } from '../../lib/logger';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface GenerateAndValidateRequest {
    /** User's scene description */
    userPrompt: string;
    /** Visual style */
    styleId: StyleId;
    /** Complexity level */
    complexityId: ComplexityId;
    /** Target audience */
    audienceId: AudienceId;
    /** Aspect ratio */
    aspectRatio?: string;
    /** Image resolution */
    imageSize?: ImageSize;
    /** Gemini API key */
    apiKey: string;
    /** Replicate API token (required for Swift tier) */
    replicateApiToken?: string;
    /** Quality tier (determines which provider to use) */
    tier?: QualityTier;
    /** User email (for feature gating) */
    userEmail?: string;
    /** Abort signal */
    signal?: AbortSignal;
    /** Pipeline configuration */
    config?: Partial<PipelineConfig>;
    /** Style reference images for multimodal style transfer (max 5) */
    styleReferenceImages?: Array<{ base64: string; mimeType: string }>;
}

export interface PipelineConfig {
    /** Enable prompt enhancement */
    enableEnhancement: boolean;
    /** Progress callback */
    onProgress?: (progress: PipelineProgress) => void;
    /** Enable verbose logging */
    enableLogging: boolean;
}

export interface PipelineProgress {
    phase: 'initializing' | 'enhancing' | 'generating' | 'complete' | 'failed';
    message: string;
    percentComplete: number;
}

export interface GenerateAndValidateResult {
    success: boolean;
    imageUrl: string | null;
    qualityScore: number;
    isPublishable: boolean;
    totalAttempts: number;
    totalDurationMs: number;
    error?: string;
    summary: string;
    promptUsed: string;
    enhancedPrompt?: string;
    metadata: {
        requestId: string;
        model: string;
        imageSize: ImageSize;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: PipelineConfig = {
    enableEnhancement: true,
    enableLogging: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR (SIMPLIFIED)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a coloring page with single-pass generation
 * Quality is ensured by strong prompt constraints, not post-generation QA
 */
export const generateAndValidate = async (
    request: GenerateAndValidateRequest
): Promise<GenerateAndValidateResult> => {
    const startTime = Date.now();
    const requestId = `orch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const config: PipelineConfig = { ...DEFAULT_CONFIG, ...request.config };

    const {
        userPrompt,
        styleId,
        complexityId,
        audienceId,
        aspectRatio = '1:1',
        imageSize = '2K',
        apiKey,
        replicateApiToken,
        tier = 'studio',
        userEmail,
        signal,
        styleReferenceImages,
    } = request;

    // Determine provider based on tier
    // FEATURE GATE: Only jamie@myjoe.app can use Replicate for now
    const tierConfig = getTierConfig(tier);
    const canUseReplicate = userEmail?.toLowerCase() === 'jamie@myjoe.app';
    const useReplicate = tierConfig.provider === 'replicate' && canUseReplicate;

    let currentPrompt = userPrompt;
    let enhancedPrompt: string | undefined;

    // Helper: Report progress
    const reportProgress = (
        phase: PipelineProgress['phase'],
        message: string,
        percent: number
    ) => {
        config.onProgress?.({
            phase,
            message,
            percentComplete: percent,
        });
    };

    // Helper: Log if enabled
    const log = (msg: string) => {
        if (config.enableLogging) {
            Logger.info('AI', `[${requestId}] ${msg}`);
        }
    };

    log(`Starting generation: ${styleId} / ${complexityId} / ${audienceId}`);
    reportProgress('initializing', 'Initializing...', 0);

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 1: Enhance prompt (optional)
    // Use Flux-specific enhancer for Swift tier (shorter, subject-focused)
    // ─────────────────────────────────────────────────────────────────────────────
    if (config.enableEnhancement) {
        reportProgress('enhancing', 'Enhancing prompt...', 10);

        try {
            let enhanceResult;
            
            if (useReplicate) {
                // Flux LoRA: Use lightweight, subject-focused enhancer
                log('Using Flux-optimized enhancer (concise output)');
                enhanceResult = await enhancePromptForFlux({
                    userPrompt,
                    styleId,
                    complexityId,
                    audienceId,
                    apiKey,
                    signal,
                });
            } else {
                // Gemini: Use full verbose enhancer
                enhanceResult = await enhancePrompt({
                    userPrompt,
                    styleId,
                    complexityId,
                    audienceId,
                    apiKey,
                    signal,
                });
            }

            if (enhanceResult.success) {
                enhancedPrompt = enhanceResult.enhancedPrompt;
                currentPrompt = enhancedPrompt;
                log(`Prompt enhanced: "${enhancedPrompt.substring(0, 100)}..."`);
            }
        } catch (error: any) {
            if (error.message === 'Aborted') throw error;
            log(`Enhancement failed, using original prompt: ${error.message}`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 2: Generate image (single pass)
    // ─────────────────────────────────────────────────────────────────────────────
    if (signal?.aborted) {
        throw new Error('Aborted');
    }

    reportProgress('generating', `Generating image via ${useReplicate ? 'Replicate' : 'Gemini'}...`, 30);

    // Route to appropriate provider based on tier
    let genResult;
    if (useReplicate && replicateApiToken) {
        // Swift tier: Use Replicate (GPT Image 1.5)
        log(`Using Replicate (Flux Coloring Book LoRA) for Swift tier`);
        genResult = await generateWithReplicate(
            {
                userPrompt: currentPrompt,
                styleId,
                complexityId,
                audienceId,
                aspectRatio,
                imageSize,
                apiKey, // Not used by Replicate but required by interface
                signal,
                enableLogging: config.enableLogging,
            },
            replicateApiToken
        );
    } else {
        // Studio tier (or fallback): Use Gemini
        log(`Using Gemini for ${tier} tier`);
        genResult = await generateWithGemini({
            userPrompt: currentPrompt,
            styleId,
            complexityId,
            audienceId,
            aspectRatio,
            imageSize,
            apiKey,
            signal,
            enableLogging: config.enableLogging,
            styleReferenceImages,
        });
    }

    // Determine which model was used for metadata
    const modelUsed = useReplicate && replicateApiToken ? REPLICATE_MODEL : GEMINI_IMAGE_MODEL;

    const totalDurationMs = Date.now() - startTime;

    if (!genResult.success || !genResult.imageUrl) {
        log(`Generation failed: ${genResult.error}`);
        reportProgress('failed', genResult.error || 'Generation failed', 100);

        return {
            success: false,
            imageUrl: null,
            qualityScore: 0,
            isPublishable: false,
            totalAttempts: 1,
            totalDurationMs,
            error: genResult.error,
            summary: 'Generation failed',
            promptUsed: genResult.promptUsed,
            enhancedPrompt,
            metadata: {
                requestId,
                model: modelUsed,
                imageSize,
            },
        };
    }

    log(`Image generated in ${genResult.durationMs}ms`);
    reportProgress('complete', 'Generation complete', 100);

    return {
        success: true,
        imageUrl: genResult.imageUrl,
        qualityScore: 100, // Assume quality until client-side check
        isPublishable: true,
        totalAttempts: 1,
        totalDurationMs,
        summary: `Generated successfully in ${totalDurationMs}ms`,
        promptUsed: genResult.promptUsed,
        enhancedPrompt,
        metadata: {
            requestId,
            model: modelUsed,
            imageSize,
        },
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick generation without enhancement (for previews)
 */
export const quickGenerate = async (
    request: GenerateAndValidateRequest
): Promise<GenerateAndValidateResult> => {
    return generateAndValidate({
        ...request,
        config: {
            ...request.config,
            enableEnhancement: false,
        },
    });
};

/**
 * Get a preview of what prompt would be generated
 */
export const previewPrompt = (
    userPrompt: string,
    styleId: StyleId,
    complexityId: ComplexityId,
    audienceId: AudienceId
): string => {
    return getPromptPreview(userPrompt, styleId, complexityId, audienceId);
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type {
    StyleId,
    ComplexityId,
    AudienceId,
    ImageSize,
};
