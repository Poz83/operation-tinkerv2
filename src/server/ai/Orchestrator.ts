/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ORCHESTRATOR v2.0 — Pipeline Controller for Gemini 3 Pro Image
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This orchestrator coordinates the complete generation pipeline:
 * 1. Prompt enhancement (Gemini 1.5 Pro)
 * 2. Image generation (Gemini 3 Pro Image / Nano Banana Pro)
 * 3. QA validation (Gemini 1.5 Pro vision)
 * 4. Auto-repair and retry (if QA fails)
 *
 * KEY CHANGES IN v2:
 * - Integrated with gemini-client-v3 (Gemini 3 optimized prompts)
 * - Uses qaService-v2.1 (enhanced texture/format detection)
 * - Uses repairs-v2.1 (comprehensive repair strategies)
 * - Removed negative_prompt handling (deprecated)
 * - Constraints embedded in prompt per Google recommendations
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    generateColoringPage,
    enhancePrompt,
    getPromptPreview,
    GEMINI_IMAGE_MODEL,
    GEMINI_TEXT_MODEL,
    StyleId,
    ComplexityId,
    AudienceId,
    ImageSize,
    GenerateImageResult,
} from './gemini-client';

import {
    analyzeColoringPage,
    QaResult,
    QaIssue,
    QaIssueCode,
    QA_ISSUE_CODES,
} from './qaService';

import {
    generateRepairPlan,
    applyRepairPlan,
    RepairPlan,
    RepairContext,
    RepairParameters,
} from './repairs';

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
    /** API key */
    apiKey: string;
    /** Abort signal */
    signal?: AbortSignal;
    /** Pipeline configuration */
    config?: Partial<PipelineConfig>;
}

export interface PipelineConfig {
    /** Maximum generation attempts */
    maxAttempts: number;
    /** Enable QA validation */
    enableQa: boolean;
    /** Enable auto-retry on QA failure */
    enableAutoRetry: boolean;
    /** Enable prompt enhancement */
    enableEnhancement: boolean;
    /** QA mode */
    qaMode: 'preview' | 'production';
    /** Minimum score to pass */
    minimumPassScore: number;
    /** Allow automatic parameter changes */
    allowParameterEscalation: boolean;
    /** Progress callback */
    onProgress?: (progress: PipelineProgress) => void;
    /** Attempt complete callback */
    onAttemptComplete?: (attempt: AttemptResult) => void;
    /** Enable verbose logging */
    enableLogging: boolean;
}

export interface PipelineProgress {
    phase: 'initializing' | 'enhancing' | 'generating' | 'validating' | 'repairing' | 'complete' | 'failed';
    message: string;
    percentComplete: number;
    attemptNumber: number;
    maxAttempts: number;
}

export interface AttemptResult {
    attemptNumber: number;
    imageUrl: string | null;
    qaResult: QaResult | null;
    repairPlan: RepairPlan | null;
    durationMs: number;
    promptUsed: string;
    parametersUsed: {
        styleId: StyleId;
        complexityId: ComplexityId;
        audienceId: AudienceId;
    };
}

export interface GenerateAndValidateResult {
    success: boolean;
    imageUrl: string | null;
    qualityScore: number;
    isPublishable: boolean;
    totalAttempts: number;
    totalDurationMs: number;
    finalQaResult: QaResult | null;
    attemptHistory: AttemptResult[];
    error?: string;
    summary: string;
    promptUsed: string;
    enhancedPrompt?: string;
    parametersWereModified: boolean;
    parameterChanges: string[];
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
    maxAttempts: 3,
    enableQa: true,
    enableAutoRetry: true,
    enableEnhancement: true,
    qaMode: 'production',
    minimumPassScore: 70,
    allowParameterEscalation: true,
    enableLogging: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a coloring page with full QA validation and auto-repair
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
        signal,
    } = request;

    // Track state
    const attemptHistory: AttemptResult[] = [];
    let currentStyleId = styleId;
    let currentComplexityId = complexityId;
    let currentPrompt = userPrompt;
    let enhancedPrompt: string | undefined;
    let previousIssues: QaIssueCode[] = [];
    const parameterChanges: string[] = [];

    // Helper: Report progress
    const reportProgress = (
        phase: PipelineProgress['phase'],
        message: string,
        percent: number,
        attempt: number
    ) => {
        config.onProgress?.({
            phase,
            message,
            percentComplete: percent,
            attemptNumber: attempt,
            maxAttempts: config.maxAttempts,
        });
    };

    // Helper: Log if enabled
    const log = (msg: string) => {
        if (config.enableLogging) {
            console.log(`[${requestId}] ${msg}`);
        }
    };

    log(`Starting pipeline: ${styleId} / ${complexityId} / ${audienceId}`);
    reportProgress('initializing', 'Initializing generation pipeline...', 0, 0);

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 1: Enhance prompt (optional)
    // ─────────────────────────────────────────────────────────────────────────────
    if (config.enableEnhancement) {
        reportProgress('enhancing', 'Enhancing prompt...', 5, 0);

        try {
            const enhanceResult = await enhancePrompt({
                userPrompt,
                styleId: currentStyleId,
                complexityId: currentComplexityId,
                audienceId,
                apiKey,
                signal,
            });

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
    // STEP 2: Generation loop with QA and retry
    // ─────────────────────────────────────────────────────────────────────────────
    let lastImageUrl: string | null = null;
    let lastQaResult: QaResult | null = null;
    let lastPromptUsed = '';

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        if (signal?.aborted) {
            throw new Error('Aborted');
        }

        const attemptStartTime = Date.now();
        log(`Attempt ${attempt}/${config.maxAttempts}`);

        // Calculate progress percentage
        const basePercent = 10 + ((attempt - 1) / config.maxAttempts) * 70;
        reportProgress('generating', `Generating image (attempt ${attempt})...`, basePercent, attempt);

        // ─── Generate Image ─────────────────────────────────────────────────────────
        const genResult = await generateColoringPage({
            userPrompt: currentPrompt,
            styleId: currentStyleId,
            complexityId: currentComplexityId,
            audienceId,
            aspectRatio,
            imageSize,
            apiKey,
            signal,
            enableLogging: config.enableLogging,
        });

        lastPromptUsed = genResult.promptUsed;

        if (!genResult.success || !genResult.imageUrl) {
            log(`Generation failed: ${genResult.error}`);

            attemptHistory.push({
                attemptNumber: attempt,
                imageUrl: null,
                qaResult: null,
                repairPlan: null,
                durationMs: Date.now() - attemptStartTime,
                promptUsed: genResult.promptUsed,
                parametersUsed: {
                    styleId: currentStyleId,
                    complexityId: currentComplexityId,
                    audienceId,
                },
            });

            // If generation itself fails, try again
            continue;
        }

        lastImageUrl = genResult.imageUrl;
        log(`Image generated in ${genResult.durationMs}ms`);

        // ─── QA Validation ──────────────────────────────────────────────────────────
        let qaResult: QaResult | null = null;

        if (config.enableQa) {
            reportProgress('validating', `Validating quality (attempt ${attempt})...`, basePercent + 15, attempt);

            try {
                qaResult = await analyzeColoringPage(
                    {
                        imageUrl: genResult.imageUrl,
                        requestId: `qa_${requestId}_${attempt}`,
                        styleId: currentStyleId,
                        complexityId: currentComplexityId,
                        audienceId,
                        userPrompt: currentPrompt,
                        apiKey,
                        signal,
                    },
                    {
                        mode: config.qaMode,
                        minimumPassScore: config.minimumPassScore,
                        strictTextureCheck: true,
                        strictColorCheck: true,
                        checkRestAreas: true,
                        checkMockupFormat: true,
                    }
                );

                lastQaResult = qaResult;
                log(`QA: ${qaResult.passed ? 'PASSED' : 'FAILED'} (${qaResult.score}/100, ${qaResult.criticalCount} critical, ${qaResult.majorCount} major)`);

            } catch (error: any) {
                if (error.message === 'Aborted') throw error;
                log(`QA failed: ${error.message}`);
            }
        }

        // ─── Record attempt ─────────────────────────────────────────────────────────
        const attemptResult: AttemptResult = {
            attemptNumber: attempt,
            imageUrl: genResult.imageUrl,
            qaResult,
            repairPlan: null,
            durationMs: Date.now() - attemptStartTime,
            promptUsed: genResult.promptUsed,
            parametersUsed: {
                styleId: currentStyleId,
                complexityId: currentComplexityId,
                audienceId,
            },
        };

        // ─── Check if we should stop ────────────────────────────────────────────────
        const passed = !config.enableQa || (qaResult?.passed ?? true);

        if (passed) {
            log(`Attempt ${attempt} passed QA`);
            attemptHistory.push(attemptResult);
            config.onAttemptComplete?.(attemptResult);
            break;
        }

        // ─── Generate repair plan ───────────────────────────────────────────────────
        if (config.enableAutoRetry && attempt < config.maxAttempts && qaResult) {
            reportProgress('repairing', `Planning repairs (attempt ${attempt})...`, basePercent + 20, attempt);

            const repairContext: RepairContext = {
                styleId: currentStyleId,
                complexityId: currentComplexityId,
                audienceId,
                attemptNumber: attempt,
                previousIssues,
                originalPrompt: currentPrompt,
            };

            const repairPlan = generateRepairPlan(qaResult.issues, repairContext);
            attemptResult.repairPlan = repairPlan;
            log(`Repair plan: ${repairPlan.actions.length} actions, confidence ${repairPlan.overallConfidence}%`);

            // Track issues for next attempt
            previousIssues = [...previousIssues, ...qaResult.issues.map(i => i.code)];

            // Apply repairs
            if (repairPlan.canAutoRepair && repairPlan.shouldRegenerate) {
                const appliedRepairs = applyRepairPlan(
                    repairPlan,
                    currentPrompt,
                    '', // No negative prompt in Gemini 3
                    {
                        styleId: currentStyleId,
                        complexityId: currentComplexityId,
                        audienceId,
                        temperature: 1.0,
                    }
                );

                // Update prompt with repair instructions
                currentPrompt = appliedRepairs.modifiedPrompt;

                // Apply parameter changes if allowed
                if (config.allowParameterEscalation) {
                    if (appliedRepairs.modifiedParameters.styleId &&
                        appliedRepairs.modifiedParameters.styleId !== currentStyleId) {
                        parameterChanges.push(`Style: ${currentStyleId} → ${appliedRepairs.modifiedParameters.styleId}`);
                        currentStyleId = appliedRepairs.modifiedParameters.styleId as StyleId;
                    }
                    if (appliedRepairs.modifiedParameters.complexityId &&
                        appliedRepairs.modifiedParameters.complexityId !== currentComplexityId) {
                        parameterChanges.push(`Complexity: ${currentComplexityId} → ${appliedRepairs.modifiedParameters.complexityId}`);
                        currentComplexityId = appliedRepairs.modifiedParameters.complexityId as ComplexityId;
                    }
                }

                log(`Applied repairs: ${appliedRepairs.changesSummary.join(', ')}`);
            }
        }

        attemptHistory.push(attemptResult);
        config.onAttemptComplete?.(attemptResult);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 3: Build result
    // ─────────────────────────────────────────────────────────────────────────────
    const totalDurationMs = Date.now() - startTime;
    const finalQaResult = lastQaResult;
    const success = lastImageUrl !== null && (!config.enableQa || (finalQaResult?.passed ?? true));
    const qualityScore = finalQaResult?.score ?? (success ? 100 : 0);
    const isPublishable = finalQaResult?.isPublishable ?? success;

    // Build summary
    let summary: string;
    if (success) {
        summary = `Generated successfully in ${attemptHistory.length} attempt(s). Score: ${qualityScore}/100.`;
    } else if (lastImageUrl) {
        summary = `Generated but failed QA after ${attemptHistory.length} attempts. Score: ${qualityScore}/100. Issues: ${finalQaResult?.issues.map(i => i.code).join(', ')}.`;
    } else {
        summary = `Generation failed after ${attemptHistory.length} attempts.`;
    }

    reportProgress(
        success ? 'complete' : 'failed',
        summary,
        100,
        attemptHistory.length
    );

    log(summary);

    return {
        success,
        imageUrl: lastImageUrl,
        qualityScore,
        isPublishable,
        totalAttempts: attemptHistory.length,
        totalDurationMs,
        finalQaResult,
        attemptHistory,
        error: success ? undefined : (finalQaResult?.summary || 'Generation failed'),
        summary,
        promptUsed: lastPromptUsed,
        enhancedPrompt,
        parametersWereModified: parameterChanges.length > 0,
        parameterChanges,
        metadata: {
            requestId,
            model: GEMINI_IMAGE_MODEL,
            imageSize,
        },
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick generation without QA (for previews)
 */
export const quickGenerate = async (
    request: GenerateAndValidateRequest
): Promise<GenerateAndValidateResult> => {
    return generateAndValidate({
        ...request,
        config: {
            ...request.config,
            maxAttempts: 1,
            enableQa: false,
            enableAutoRetry: false,
        },
    });
};

/**
 * Strict generation with maximum QA (for final production)
 */
export const strictGenerate = async (
    request: GenerateAndValidateRequest
): Promise<GenerateAndValidateResult> => {
    return generateAndValidate({
        ...request,
        config: {
            ...request.config,
            maxAttempts: 5,
            enableQa: true,
            enableAutoRetry: true,
            qaMode: 'production',
            minimumPassScore: 80,
            allowParameterEscalation: true,
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
