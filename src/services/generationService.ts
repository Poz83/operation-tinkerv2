/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GENERATION SERVICE v3.0 — Simplified UI Service Layer
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This is the PRIMARY service layer for UI components to interact with
 * the generation pipeline. It wraps the orchestrator and handles:
 *
 * - API key resolution
 * - Project/image persistence to Supabase
 * - Image caching via ImageCacheService
 * - Progress callbacks for React state
 * - Batch generation for book plans
 * - Cost estimation
 *
 * v3.0 Changes:
 * - Simplified architecture: single-pass generation (no QA loop)
 * - Removed qaService and repairs dependencies
 * - Quality ensured by strong prompt constraints + client-side checks
 *
 * Architecture:
 *
 *   React Component
 *       │
 *       ▼
 *   generationService.generatePage()
 *       │
 *       ├─► Orchestrator.generateAndValidate()
 *       │       │
 *       │       └─► gemini-client.ts (single AI call)
 *       │
 *       ├─► projectsService.saveProject()
 *       │
 *       └─► ImageCacheService.cacheImage()
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    generateAndValidate,
    quickGenerate,
    previewPrompt,
    GenerateAndValidateRequest,
    GenerateAndValidateResult,
    PipelineConfig,
    PipelineProgress,
    StyleId,
    ComplexityId,
    AudienceId,
    ImageSize,
} from '../server/ai/Orchestrator';

import { Logger } from '../lib/logger';

import { getStoredApiKey } from '../lib/crypto';
import { fetchProject } from './projectsService';
import { uploadProjectImage, getSignedUrl } from './storageService';
import { cacheImage, getCachedImage, cacheFromUrl } from './ImageCacheService';
import { supabase } from '../lib/supabase';

import type {
    SavedProject,
    ColoringPage,
    CharacterDNA,
    StyleDNA
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Request for generating a single coloring page
 */
export interface GeneratePageRequest {
    /** User's prompt/description */
    prompt: string;
    /** Visual style ID */
    style: StyleId;
    /** Complexity level */
    complexity: ComplexityId;
    /** Target audience */
    audience: AudienceId;
    /** Aspect ratio (e.g., '3:4', '1:1') */
    aspectRatio: string;
    /** Page index in project (for ordering) */
    pageIndex?: number;
    /** Whether prompt contains text to render */
    requiresText?: boolean;
    /** Hero character DNA for consistency */
    heroDNA?: CharacterDNA;
    /** Style DNA from reference image */
    styleDNA?: StyleDNA | null;
    /** Reference image for style transfer */
    referenceImage?: { base64: string; mimeType: string };
    /** Multiple style reference images for multimodal style transfer (max 5) */
    styleReferenceImages?: Array<{ base64: string; mimeType: string }>;
    /** Project ID to save to (optional) */
    projectId?: string;
    /** Save to project automatically */
    autoSave?: boolean;
    /** Abort signal */
    signal?: AbortSignal;
}

/**
 * Configuration for page generation
 */
export interface GeneratePageConfig {
    /** Generation mode: 'quick' (no enhancement), 'standard' (with enhancement) */
    mode: 'quick' | 'standard';
    /** Enable verbose logging */
    enableLogging?: boolean;
    /** Progress callback */
    onProgress?: (progress: GenerationProgress) => void;
}

/**
 * Progress update for UI
 */
export interface GenerationProgress {
    /** Current phase */
    phase: 'preparing' | 'enhancing' | 'generating' | 'validating' | 'saving' | 'complete' | 'failed';
    /** Current step message */
    message: string;
    /** Percentage complete (0-100) */
    percent: number;
    /** Current attempt number */
    attempt: number;
    /** Maximum attempts */
    maxAttempts: number;
    /** Estimated time remaining (ms) */
    estimatedTimeRemaining?: number;
}

/**
 * Result from page generation
 */
export interface GeneratePageResult {
    /** Whether generation succeeded */
    success: boolean;
    /** Generated page data */
    page: ColoringPage | null;
    /** Image URL (data URL or signed URL) */
    imageUrl: string | null;
    /** Quality score (0-100) */
    qualityScore: number;
    /** Whether image is publishable */
    isPublishable: boolean;
    /** Total attempts made */
    attempts: number;
    /** Total duration in ms */
    durationMs: number;
    /** Estimated cost */
    estimatedCost: number;
    /** Error message if failed */
    error?: string;
    /** Detailed result from orchestrator */
    orchestratorResult?: GenerateAndValidateResult;
}

/**
 * Request for batch generation (book plan)
 */
export interface BatchGenerateRequest {
    /** Project to generate pages for */
    project: SavedProject;
    /** Page prompts with metadata */
    pages: Array<{
        prompt: string;
        pageIndex: number;
        requiresText?: boolean;
        vectorMode?: 'organic' | 'geometric' | 'standard' | 'illustration';
    }>;
    /** Whether to use the first high-quality image as a reference for subsequent pages */
    autoConsistency?: boolean;
    /** Helper logic for auto-consistency carried over from legacy pipeline */
    sessionReferenceImage?: { base64: string; mimeType: string };
    /** Style reference images for multimodal style transfer (max 5) */
    styleReferenceImages?: Array<{ base64: string; mimeType: string }>;
    /** Abort signal */
    signal?: AbortSignal;
}

/**
 * Result from batch generation
 */
export interface BatchGenerateResult {
    /** Generated pages */
    pages: ColoringPage[];
    /** Number of successful generations */
    successCount: number;
    /** Number of failed generations */
    failureCount: number;
    /** Total duration in ms */
    totalDurationMs: number;
    /** Total estimated cost */
    totalEstimatedCost: number;
    /** Per-page results */
    pageResults: Map<number, GeneratePageResult>;
}

/**
 * Usage statistics
 */
export interface UsageStats {
    totalGenerations: number;
    totalCost: number;
    successRate: number;
    averageDurationMs: number;
    averageAttempts: number;
    byStyle: Record<string, number>;
    byComplexity: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COST ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════════

const COST_PER_GENERATION: Record<string, number> = {
    '1K': 0.02,
    '2K': 0.04,
    '4K': 0.08,
};

const COMPLEXITY_TO_RESOLUTION: Record<string, '1K' | '2K' | '4K'> = {
    'Very Simple': '1K',
    'Simple': '1K',
    'Moderate': '2K',
    'Intricate': '2K',
    'Extreme Detail': '4K',
};

const estimateCost = (complexity: string, attempts: number = 1): number => {
    const resolution = COMPLEXITY_TO_RESOLUTION[complexity] || '2K';
    return COST_PER_GENERATION[resolution] * attempts;
};

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════════

let cachedApiKey: string | null = null;

const getApiKey = async (): Promise<string | null> => {
    if (cachedApiKey) return cachedApiKey;
    cachedApiKey = await getStoredApiKey();
    return cachedApiKey;
};

/**
 * Clear cached API key (call when user updates their key)
 */
export const clearApiKeyCache = (): void => {
    cachedApiKey = null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS ADAPTER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Adapt orchestrator progress to service progress format
 */
const adaptProgress = (
    orchestratorProgress: PipelineProgress,
    additionalPhase?: 'saving'
): GenerationProgress => {
    const phaseMap: Record<string, GenerationProgress['phase']> = {
        'initializing': 'preparing',
        'enhancing': 'enhancing',
        'generating': 'generating',
        'complete': 'complete',
        'failed': 'failed',
    };

    return {
        phase: additionalPhase || phaseMap[orchestratorProgress.phase] || 'generating',
        message: orchestratorProgress.message,
        percent: orchestratorProgress.percentComplete,
        attempt: 1,
        maxAttempts: 1,
    };
};


// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE PAGE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a single coloring page
 * 
 * This is the primary function for UI components to call.
 * It handles the complete workflow including optional persistence.
 * 
 * @example
 * // Basic usage
 * const result = await generatePage({
 *   prompt: 'A cute dragon eating a taco',
 *   style: 'Hand Drawn Bold & Easy',
 *   complexity: 'Simple',
 *   audience: 'preschool',
 *   aspectRatio: '3:4',
 * });
 * 
 * @example
 * // With progress updates and auto-save
 * const result = await generatePage(
 *   {
 *     prompt: 'A magical forest',
 *     style: 'Whimsical',
 *     complexity: 'Moderate',
 *     audience: 'kids',
 *     aspectRatio: '1:1',
 *     projectId: 'CB123456',
 *     autoSave: true,
 *   },
 *   {
 *     mode: 'standard',
 *     onProgress: (p) => setProgress(p),
 *   }
 * );
 */
export const generatePage = async (
    request: GeneratePageRequest,
    config: GeneratePageConfig = { mode: 'standard' }
): Promise<GeneratePageResult> => {
    const startTime = Date.now();

    // Resolve API key
    const apiKey = await getApiKey();
    if (!apiKey) {
        return {
            success: false,
            page: null,
            imageUrl: null,
            qualityScore: 0,
            isPublishable: false,
            attempts: 0,
            durationMs: Date.now() - startTime,
            estimatedCost: 0,
            error: 'API Key not configured. Please add your key in Settings.',
        };
    }

    // Report initial progress
    config.onProgress?.({
        phase: 'preparing',
        message: 'Preparing generation request...',
        percent: 0,
        attempt: 1,
        maxAttempts: 1,
    });

    // Determine image size from complexity
    const imageSize: ImageSize = COMPLEXITY_TO_RESOLUTION[request.complexity] || '2K';

    // Build orchestrator request
    const orchestratorRequest: GenerateAndValidateRequest = {
        userPrompt: request.prompt,
        styleId: request.style,
        complexityId: request.complexity,
        audienceId: request.audience,
        aspectRatio: request.aspectRatio,
        imageSize,
        apiKey,
        signal: request.signal,
        config: buildPipelineConfig(config),
        // Pass style reference images for multimodal generation
        styleReferenceImages: request.styleReferenceImages,
    };

    // Run generation
    let orchestratorResult: GenerateAndValidateResult;

    try {
        switch (config.mode) {
            case 'quick':
                orchestratorResult = await quickGenerate(orchestratorRequest);
                break;
            default:
                orchestratorResult = await generateAndValidate(orchestratorRequest);
        }
    } catch (error: any) {
        if (error.message === 'Aborted') {
            throw error;
        }

        return {
            success: false,
            page: null,
            imageUrl: null,
            qualityScore: 0,
            isPublishable: false,
            attempts: 0,
            durationMs: Date.now() - startTime,
            estimatedCost: 0,
            error: error.message || 'Generation failed',
        };
    }

    // Build page object
    const page: ColoringPage | null = orchestratorResult.success && orchestratorResult.imageUrl
        ? {
            id: orchestratorResult.metadata?.requestId || crypto.randomUUID(),
            imageUrl: orchestratorResult.imageUrl,
            prompt: request.prompt,
            pageIndex: request.pageIndex ?? 0,
            status: 'complete',
            isLoading: false,
            isCover: request.pageIndex === 0,
        }
        : null;

    // Handle auto-save (only for real projects, not temp IDs)
    const isValidProjectId = request.projectId &&
        request.projectId !== 'temp-project-id' &&
        (request.projectId.startsWith('CB') || request.projectId.startsWith('HL'));

    if (request.autoSave && isValidProjectId && page && orchestratorResult.imageUrl) {
        config.onProgress?.({
            phase: 'saving',
            message: 'Saving to project...',
            percent: 95,
            attempt: 1,
            maxAttempts: 1,
        });

        try {
            await savePageToProject(request.projectId, page, orchestratorResult.imageUrl);
        } catch (saveError) {
            Logger.error('SYSTEM', 'Failed to auto-save page:', saveError);
            // Don't fail the generation just because save failed
        }
    }

    // Cache the image
    if (orchestratorResult.imageUrl && page) {
        try {
            // Convert data URL to blob for caching
            const response = await fetch(orchestratorResult.imageUrl);
            const blob = await response.blob();
            await cacheImage(page.id, blob, `generated/${page.id}`);
        } catch (cacheError) {
            Logger.warn('SYSTEM', 'Failed to cache generated image:', cacheError);
        }
    }

    // Report completion
    config.onProgress?.({
        phase: orchestratorResult.success ? 'complete' : 'failed',
        message: orchestratorResult.summary,
        percent: 100,
        attempt: 1,
        maxAttempts: 1,
    });

    return {
        success: orchestratorResult.success,
        page,
        imageUrl: orchestratorResult.imageUrl,
        qualityScore: orchestratorResult.qualityScore,
        isPublishable: orchestratorResult.isPublishable,
        attempts: orchestratorResult.totalAttempts,
        durationMs: Date.now() - startTime,
        estimatedCost: estimateCost(request.complexity, orchestratorResult.totalAttempts),
        error: orchestratorResult.error,
        orchestratorResult,
    };
};

/**
 * Build pipeline config from service config
 */
const buildPipelineConfig = (config: GeneratePageConfig): Partial<PipelineConfig> => {
    return {
        enableLogging: config.enableLogging,
        enableEnhancement: config.mode !== 'quick',
        onProgress: config.onProgress
            ? (p) => config.onProgress!(adaptProgress(p))
            : undefined,
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate multiple pages for a book plan
 * 
 * @example
 * const result = await batchGenerate({
 *   project: myProject,
 *   pages: bookPlan.map((item, i) => ({
 *     prompt: item.prompt,
 *     pageIndex: i,
 *     requiresText: item.requiresText,
 *   })),
 * }, {
 *   mode: 'standard',
 *   onPageComplete: (pageIndex, result) => {
 *     updatePageInUI(pageIndex, result);
 *   },
 *   onBatchProgress: (completed, total) => {
 *     setOverallProgress(completed / total);
 *   },
 * });
 */
export interface BatchGenerateConfig extends Omit<GeneratePageConfig, 'onProgress'> {
    /** Called when each page completes */
    onPageComplete?: (pageIndex: number, result: GeneratePageResult) => void;
    /** Called with overall batch progress */
    onBatchProgress?: (completed: number, total: number, currentPage: number) => void;
    /** Concurrency (default: 1 for sequential) */
    concurrency?: number;
    /** Delay between pages in ms (to avoid rate limiting) */
    delayBetweenPages?: number;
    /** Called with progress updates for the current page */
    onPageProgress?: (pageIndex: number, progress: GenerationProgress) => void;
}

export const batchGenerate = async (
    request: BatchGenerateRequest,
    config: BatchGenerateConfig = { mode: 'standard' }
): Promise<BatchGenerateResult> => {
    const startTime = Date.now();
    const pageResults = new Map<number, GeneratePageResult>();
    const generatedPages: ColoringPage[] = [];
    let successCount = 0;
    let failureCount = 0;
    let totalCost = 0;

    const { project, pages, signal, autoConsistency } = request;
    const concurrency = config.concurrency || 1;
    const delayBetweenPages = config.delayBetweenPages ?? 1000;

    let sessionReferenceImage = request.sessionReferenceImage;

    // Process pages
    if (concurrency === 1) {
        // Sequential processing
        for (let i = 0; i < pages.length; i++) {
            if (signal?.aborted) {
                throw new Error('Aborted');
            }

            const pageSpec = pages[i];
            config.onBatchProgress?.(i, pages.length, pageSpec.pageIndex);

            const result = await generatePage(
                {
                    prompt: pageSpec.prompt,
                    style: project.visualStyle as StyleId,
                    complexity: project.complexity as ComplexityId,
                    audience: project.targetAudienceId as AudienceId,
                    aspectRatio: getAspectRatioFromPageSize(project.pageSizeId),
                    pageIndex: pageSpec.pageIndex,
                    requiresText: pageSpec.requiresText,
                    projectId: project.id,
                    autoSave: true,
                    referenceImage: sessionReferenceImage || undefined,
                    // [CRITICAL FIX] Pass Character DNA for hero consistency
                    heroDNA: project.characterDNA,
                    // [CRITICAL FIX] Pass Style DNA (if applicable)
                    // styleDNA: project.styleDNA, // Assuming SavedProject has styleDNA property, if not comment out
                    // Pass style reference images for multimodal generation
                    styleReferenceImages: request.styleReferenceImages,
                    signal,
                },
                {
                    mode: config.mode,
                    enableLogging: config.enableLogging,
                    onProgress: config.onPageProgress
                        ? (p) => config.onPageProgress!(pageSpec.pageIndex, p)
                        : undefined
                }
            );

            pageResults.set(pageSpec.pageIndex, result);

            if (result.success && result.page) {
                generatedPages.push(result.page);
                successCount++;
            } else {
                failureCount++;
            }

            // [SMART CONSISTENCY] Quality Gate for Style Reference
            // Only use a previous image as a reference if it got a High QA Score and no bad tags
            const qaTags = result.page?.qa?.tags || [];
            const isReferenceWorthy =
                result.qualityScore >= 85 && // High Score threshold
                !qaTags.includes('mockup_style') && // Not a mockup
                !qaTags.includes('colored_artifacts'); // No color leaks

            if (autoConsistency && !sessionReferenceImage && result.success && isReferenceWorthy && result.imageUrl) {
                try {
                    const matches = result.imageUrl.match(/^data:(.+);base64,(.+)$/);
                    if (matches) {
                        sessionReferenceImage = { mimeType: matches[1], base64: matches[2] };
                        Logger.info('AI', `✅ Using Page ${pageSpec.pageIndex} as Style Reference (QA Score: ${result.qualityScore}).`);
                    }
                } catch (e) {
                    // ignore
                }
            } else if (autoConsistency && !sessionReferenceImage && result.success && !isReferenceWorthy) {
                Logger.info('AI', `⚠️ Page ${pageSpec.pageIndex} was low quality (Score: ${result.qualityScore}). SKIPPING consistency to avoid pollution.`);
            }

            totalCost += result.estimatedCost;
            config.onPageComplete?.(pageSpec.pageIndex, result);

            // Delay between pages
            if (i < pages.length - 1 && delayBetweenPages > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
            }
        }
    } else {
        // Concurrent processing (with limited concurrency)
        const chunks = chunkArray(pages, concurrency);
        let completedCount = 0;

        for (const chunk of chunks) {
            if (signal?.aborted) {
                throw new Error('Aborted');
            }

            const chunkResults = await Promise.all(
                chunk.map(async (pageSpec) => {
                    const result = await generatePage(
                        {
                            prompt: pageSpec.prompt,
                            style: project.visualStyle as StyleId,
                            complexity: project.complexity as ComplexityId,
                            audience: project.targetAudienceId as AudienceId,
                            aspectRatio: getAspectRatioFromPageSize(project.pageSizeId),
                            pageIndex: pageSpec.pageIndex,
                            requiresText: pageSpec.requiresText,
                            projectId: project.id,
                            autoSave: true,
                            referenceImage: sessionReferenceImage || undefined,
                            // [CRITICAL FIX] Pass Character DNA for hero consistency
                            heroDNA: project.characterDNA,
                            // Pass style reference images for multimodal generation
                            styleReferenceImages: request.styleReferenceImages,
                            signal,
                        },
                        {
                            mode: config.mode,
                            enableLogging: config.enableLogging,
                            onProgress: config.onPageProgress
                                ? (p) => config.onPageProgress!(pageSpec.pageIndex, p)
                                : undefined
                        }
                    );

                    return { pageIndex: pageSpec.pageIndex, result };
                })
            );

            for (const { pageIndex, result } of chunkResults) {
                pageResults.set(pageIndex, result);

                if (result.success && result.page) {
                    generatedPages.push(result.page);
                    successCount++;
                } else {
                    failureCount++;
                }

                totalCost += result.estimatedCost;
                completedCount++;
                config.onBatchProgress?.(completedCount, pages.length, pageIndex);
                config.onPageComplete?.(pageIndex, result);
            }

            // Delay between chunks
            if (delayBetweenPages > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
            }
        }
    }

    // Sort generated pages by index
    generatedPages.sort((a, b) => (a.pageIndex ?? 0) - (b.pageIndex ?? 0));

    // Final progress
    config.onBatchProgress?.(pages.length, pages.length, -1);

    return {
        pages: generatedPages,
        successCount,
        failureCount,
        totalDurationMs: Date.now() - startTime,
        totalEstimatedCost: totalCost,
        pageResults,
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENCE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Save a generated page to a project
 */
const savePageToProject = async (
    projectId: string,
    page: ColoringPage,
    imageUrl: string
): Promise<void> => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }

    // Get project's internal ID
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('public_id', projectId)
        .single();

    if (projectError || !project) {
        throw new Error('Project not found');
    }

    // Upload image to R2
    const imageUuid = page.id;
    const uploadResult = await uploadProjectImage(project.id, imageUuid, imageUrl);

    // Save to images table
    const { error: dbError } = await supabase.from('images').insert({
        id: imageUuid,
        project_id: project.id,
        storage_path: uploadResult.key,
        type: 'page',
        mime_type: 'image/png',
        user_id: user.id,
        generation_prompt: page.prompt,
        metadata: {
            pageIndex: page.pageIndex,
            status: page.status,
            isCover: page.isCover || false,
            qa: page.qa as unknown as any, // Cast to any for Supabase Json compatibility
        },
    });

    if (dbError) {
        throw dbError;
    }

    // Update project's updated_at
    await supabase
        .from('projects')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', project.id);
};

/**
 * Regenerate a specific page in a project
 */
export const regeneratePage = async (
    projectId: string,
    pageIndex: number,
    newPrompt?: string,
    config?: GeneratePageConfig
): Promise<GeneratePageResult> => {
    // Fetch project to get settings
    const project = await fetchProject(projectId);
    if (!project) {
        return {
            success: false,
            page: null,
            imageUrl: null,
            qualityScore: 0,
            isPublishable: false,
            attempts: 0,
            durationMs: 0,
            estimatedCost: 0,
            error: 'Project not found',
        };
    }

    // Find existing page
    const existingPage = project.pages?.find(p => p.pageIndex === pageIndex);
    const prompt = newPrompt || existingPage?.prompt || 'A coloring page';

    return generatePage(
        {
            prompt,
            style: project.visualStyle as StyleId,
            complexity: project.complexity as ComplexityId,
            audience: project.targetAudienceId as AudienceId,
            aspectRatio: getAspectRatioFromPageSize(project.pageSizeId),
            pageIndex,
            projectId,
            autoSave: true,
        },
        config || { mode: 'standard' }
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

// In-memory usage tracking (could be moved to persistent storage)
let usageStats: UsageStats = {
    totalGenerations: 0,
    totalCost: 0,
    successRate: 0,
    averageDurationMs: 0,
    averageAttempts: 0,
    byStyle: {},
    byComplexity: {},
};

const successfulGenerations: number[] = [];
const allDurations: number[] = [];
const allAttempts: number[] = [];

/**
 * Track a generation result for statistics
 */
export const trackGeneration = (
    result: GeneratePageResult,
    style: string,
    complexity: string
): void => {
    usageStats.totalGenerations++;
    usageStats.totalCost += result.estimatedCost;

    if (result.success) {
        successfulGenerations.push(1);
    } else {
        successfulGenerations.push(0);
    }

    allDurations.push(result.durationMs);
    allAttempts.push(result.attempts);

    // Update running averages
    usageStats.successRate =
        successfulGenerations.reduce((a, b) => a + b, 0) / successfulGenerations.length;
    usageStats.averageDurationMs =
        allDurations.reduce((a, b) => a + b, 0) / allDurations.length;
    usageStats.averageAttempts =
        allAttempts.reduce((a, b) => a + b, 0) / allAttempts.length;

    // Track by style/complexity
    usageStats.byStyle[style] = (usageStats.byStyle[style] || 0) + 1;
    usageStats.byComplexity[complexity] = (usageStats.byComplexity[complexity] || 0) + 1;
};

/**
 * Get current usage statistics
 */
export const getUsageStats = (): UsageStats => ({ ...usageStats });

/**
 * Reset usage statistics
 */
export const resetUsageStats = (): void => {
    usageStats = {
        totalGenerations: 0,
        totalCost: 0,
        successRate: 0,
        averageDurationMs: 0,
        averageAttempts: 0,
        byStyle: {},
        byComplexity: {},
    };
    successfulGenerations.length = 0;
    allDurations.length = 0;
    allAttempts.length = 0;
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get aspect ratio string from page size ID
 */
const getAspectRatioFromPageSize = (pageSizeId: string): string => {
    const aspectRatios: Record<string, string> = {
        'square': '1:1',
        'portrait': '17:22', // Precise 8.5" x 11" ratio (Gemini client handles fallback to 3:4)
        'landscape': '4:3',
        'letter': '17:22',
        'a4': '210:297',
    };
    return aspectRatios[pageSizeId] || '1:1';
};

/**
 * Chunk array into smaller arrays
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

/**
 * Estimate total cost for a batch generation
 */
export const estimateBatchCost = (
    pageCount: number,
    complexity: string,
    expectedAttempts: number = 1.5
): number => {
    return estimateCost(complexity, expectedAttempts) * pageCount;
};

/**
 * Check if API key is configured
 */
export const isApiKeyConfigured = async (): Promise<boolean> => {
    const key = await getApiKey();
    return !!key;
};

/**
 * Preload an image into cache from a signed URL
 */
export const preloadImageToCache = async (
    imageId: string,
    signedUrl: string,
    storagePath: string
): Promise<void> => {
    // Check if already cached
    const cached = await getCachedImage(imageId);
    if (cached) return;

    // Cache from URL
    await cacheFromUrl(imageId, signedUrl, storagePath);
};

/**
 * Get image from cache or fetch from storage
 */
export const getImageWithCache = async (
    imageId: string,
    storagePath: string
): Promise<string | null> => {
    // Try cache first
    const cached = await getCachedImage(imageId);
    if (cached) return cached;

    // Fetch from storage
    const signedUrl = await getSignedUrl(storagePath);
    if (!signedUrl) return null;

    // Cache for next time
    await cacheFromUrl(imageId, signedUrl, storagePath);

    return signedUrl;
};
