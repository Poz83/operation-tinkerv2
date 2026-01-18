/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GENERATION ORCHESTRATOR v1.0 — Unified Pipeline Controller
 * Paint-by-Numbers SaaS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This module provides the single entry point for the complete generation pipeline:
 *
 *   generateAndValidate()
 *       │
 *       ├─► buildPrompt()         [prompts.ts]
 *       │
 *       ├─► generateColoringPage() [gemini-client.ts]
 *       │
 *       ├─► analyzeColoringPage()  [qaService.ts]
 *       │
 *       └─► generateRepairPlan()   [repairs.ts]
 *             │
 *             └─► applyRepairPlan() ──► Loop back to generate
 *
 * Features:
 * - Automatic retry with intelligent repairs
 * - Progressive parameter escalation
 * - Comprehensive result tracking
 * - Configurable retry behaviour
 * - Full audit trail for debugging
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    generateColoringPage,
    ColoringPageRequest,
    ColoringPageResult,
    GenerationMetadata,
    setLogCallback,
    GenerationLogEntry,
} from './gemini-client';

import {
    analyzeColoringPage,
    QaResult,
    QaContext,
    QaConfig,
} from './qaService';

import {
    generateRepairPlan,
    applyRepairPlan,
    RepairPlan,
    RepairContext,
    AppliedRepairs,
} from './repairs';

import { CharacterDNA, StyleDNA } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Request for the unified generation pipeline
 */
export interface GenerateAndValidateRequest {
    /** User's natural language description */
    userPrompt: string;
    /** Visual style ID */
    styleId: string;
    /** Complexity level */
    complexityId: string;
    /** Target audience ID */
    audienceId: string;
    /** Aspect ratio for output */
    aspectRatio: string;
    /** Whether the prompt contains text to render */
    requiresText?: boolean;
    /** Optional hero character DNA */
    heroDNA?: CharacterDNA;
    /** Optional style DNA from reference */
    styleDNA?: StyleDNA | null;
    /** Optional reference image */
    referenceImage?: { base64: string; mimeType: string };
    /** Abort signal for cancellation */
    signal?: AbortSignal;
    /** Direct API key */
    apiKey?: string;
    /** Pipeline configuration */
    config?: Partial<PipelineConfig>;
}

/**
 * Pipeline configuration options
 */
export interface PipelineConfig {
    /** Maximum generation attempts (default: 3) */
    maxAttempts: number;
    /** Whether to run QA validation (default: true) */
    enableQa: boolean;
    /** Whether to auto-retry on QA failure (default: true) */
    enableAutoRetry: boolean;
    /** QA mode: 'production' (strict) or 'preview' (lenient) */
    qaMode: 'production' | 'preview';
    /** Minimum QA score to pass (default: 70) */
    minimumPassScore: number;
    /** Whether to allow parameter changes during repair (default: true) */
    allowParameterEscalation: boolean;
    /** Enable verbose logging (default: false) */
    enableLogging: boolean;
    /** Callback for progress updates */
    onProgress?: (progress: PipelineProgress) => void;
    /** Callback for each attempt completion */
    onAttemptComplete?: (attempt: AttemptResult) => void;
}

const DEFAULT_CONFIG: PipelineConfig = {
    maxAttempts: 3,
    enableQa: true,
    enableAutoRetry: true,
    qaMode: 'production',
    minimumPassScore: 70,
    allowParameterEscalation: true,
    enableLogging: false,
};

/**
 * Progress update during pipeline execution
 */
export interface PipelineProgress {
    /** Current phase */
    phase: 'initializing' | 'generating' | 'validating' | 'repairing' | 'complete' | 'failed';
    /** Current attempt number */
    attemptNumber: number;
    /** Maximum attempts */
    maxAttempts: number;
    /** Human-readable status message */
    message: string;
    /** Percentage complete (0-100) */
    percentComplete: number;
    /** Timestamp */
    timestamp: string;
}

/**
 * Result of a single generation attempt
 */
export interface AttemptResult {
    /** Attempt number (1-based) */
    attemptNumber: number;
    /** Whether this attempt succeeded */
    success: boolean;
    /** Generation result */
    generationResult: ColoringPageResult | null;
    /** QA result (if QA was run) */
    qaResult: QaResult | null;
    /** Repair plan (if repairs were generated) */
    repairPlan: RepairPlan | null;
    /** Applied repairs (if repairs were applied) */
    appliedRepairs: AppliedRepairs | null;
    /** Parameters used for this attempt */
    parameters: {
        styleId: string;
        complexityId: string;
        audienceId: string;
        temperature?: number;
    };
    /** Duration of this attempt in ms */
    durationMs: number;
    /** Error message if failed */
    error?: string;
}

/**
 * Complete result from the unified pipeline
 */
export interface GenerateAndValidateResult {
    /** Whether the pipeline succeeded */
    success: boolean;
    /** The final image URL (if successful) */
    imageUrl: string | null;
    /** Final QA result */
    finalQaResult: QaResult | null;
    /** Whether the image is publishable */
    isPublishable: boolean;
    /** Overall quality score (0-100) */
    qualityScore: number;
    /** Total attempts made */
    totalAttempts: number;
    /** Results from each attempt */
    attempts: AttemptResult[];
    /** Final parameters used (may differ from request if escalated) */
    finalParameters: {
        styleId: string;
        complexityId: string;
        audienceId: string;
    };
    /** Whether parameters were modified during repair */
    parametersWereModified: boolean;
    /** All parameter changes made */
    parameterChanges: string[];
    /** Total pipeline duration in ms */
    totalDurationMs: number;
    /** Generation metadata from final successful attempt */
    metadata: GenerationMetadata | null;
    /** Summary for display */
    summary: string;
    /** Detailed audit trail */
    auditTrail: AuditEntry[];
    /** Error message if pipeline failed */
    error?: string;
}

/**
 * Audit trail entry for debugging
 */
export interface AuditEntry {
    timestamp: string;
    phase: string;
    action: string;
    details?: Record<string, unknown>;
    durationMs?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS HELPER
// ═══════════════════════════════════════════════════════════════════════════════

const emitProgress = (
    config: PipelineConfig,
    phase: PipelineProgress['phase'],
    attemptNumber: number,
    message: string,
    percentComplete: number
): void => {
    if (config.onProgress) {
        config.onProgress({
            phase,
            attemptNumber,
            maxAttempts: config.maxAttempts,
            message,
            percentComplete,
            timestamp: new Date().toISOString(),
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT TRAIL HELPER
// ═══════════════════════════════════════════════════════════════════════════════

const addAuditEntry = (
    auditTrail: AuditEntry[],
    phase: string,
    action: string,
    details?: Record<string, unknown>,
    startTime?: number
): void => {
    auditTrail.push({
        timestamp: new Date().toISOString(),
        phase,
        action,
        details,
        durationMs: startTime ? Date.now() - startTime : undefined,
    });
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Unified generation pipeline with automatic QA and retry
 *
 * This is the PRIMARY function your UI should call for generating coloring pages.
 * It handles the complete workflow:
 * 1. Generate image
 * 2. Run QA validation
 * 3. If QA fails, generate repair plan
 * 4. Apply repairs and retry (up to maxAttempts)
 * 5. Return comprehensive result
 *
 * @example
 * // Basic usage
 * const result = await generateAndValidate({
 *   userPrompt: 'A cute dragon eating a taco',
 *   styleId: 'Bold & Easy',
 *   complexityId: 'Simple',
 *   audienceId: 'preschool',
 *   aspectRatio: '3:4',
 * });
 *
 * if (result.success) {
 *   displayImage(result.imageUrl);
 *   showScore(result.qualityScore);
 * } else {
 *   showError(result.error);
 *   showAttempts(result.attempts);
 * }
 *
 * @example
 * // With progress updates
 * const result = await generateAndValidate({
 *   userPrompt: 'A magical forest',
 *   styleId: 'Whimsical',
 *   complexityId: 'Moderate',
 *   audienceId: 'kids',
 *   aspectRatio: '1:1',
 *   config: {
 *     maxAttempts: 3,
 *     onProgress: (progress) => {
 *       updateProgressBar(progress.percentComplete);
 *       updateStatusText(progress.message);
 *     },
 *     onAttemptComplete: (attempt) => {
 *       if (!attempt.success) {
 *         showWarning(`Attempt ${attempt.attemptNumber} failed, retrying...`);
 *       }
 *     },
 *   },
 * });
 */
export const generateAndValidate = async (
    request: GenerateAndValidateRequest
): Promise<GenerateAndValidateResult> => {
    const pipelineStartTime = Date.now();
    const config: PipelineConfig = { ...DEFAULT_CONFIG, ...request.config };
    const auditTrail: AuditEntry[] = [];
    const attempts: AttemptResult[] = [];
    const parameterChanges: string[] = [];

    // Current parameters (may be modified during repair)
    let currentParams = {
        styleId: request.styleId,
        complexityId: request.complexityId,
        audienceId: request.audienceId,
        temperature: undefined as number | undefined,
    };

    // Track original parameters
    const originalParams = { ...currentParams };

    // Track previous repair plans for escalation
    const previousRepairs: RepairPlan[] = [];

    // Current prompt (may be modified with repair instructions)
    let currentPrompt = request.userPrompt;
    let currentNegativePrompt = ''; // Will be populated from first generation

    addAuditEntry(auditTrail, 'initialization', 'Pipeline started', {
        userPrompt: request.userPrompt.substring(0, 100),
        styleId: request.styleId,
        complexityId: request.complexityId,
        audienceId: request.audienceId,
        maxAttempts: config.maxAttempts,
    });

    emitProgress(config, 'initializing', 0, 'Starting generation pipeline...', 0);

    // ─────────────────────────────────────────────────────────────────────────────
    // Main Retry Loop
    // ─────────────────────────────────────────────────────────────────────────────

    let lastSuccessfulGeneration: ColoringPageResult | null = null;
    let lastQaResult: QaResult | null = null;
    let finalSuccess = false;

    for (let attemptNumber = 1; attemptNumber <= config.maxAttempts; attemptNumber++) {
        const attemptStartTime = Date.now();

        // Check abort
        if (request.signal?.aborted) {
            addAuditEntry(auditTrail, 'abort', 'Pipeline aborted by user');
            return buildFailureResult(
                'Generation cancelled',
                attempts,
                auditTrail,
                currentParams,
                originalParams,
                parameterChanges,
                pipelineStartTime
            );
        }

        addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'Attempt started', {
            params: currentParams,
            promptLength: currentPrompt.length,
        });

        const progressBase = ((attemptNumber - 1) / config.maxAttempts) * 100;

        // ─────────────────────────────────────────────────────────────────────────
        // Phase 1: Generate
        // ─────────────────────────────────────────────────────────────────────────

        emitProgress(
            config,
            'generating',
            attemptNumber,
            `Generating image (attempt ${attemptNumber}/${config.maxAttempts})...`,
            progressBase + 10
        );

        const generateStartTime = Date.now();

        let generationResult: ColoringPageResult;
        try {
            generationResult = await generateColoringPage({
                userPrompt: currentPrompt,
                styleId: currentParams.styleId,
                complexityId: currentParams.complexityId,
                audienceId: currentParams.audienceId,
                aspectRatio: request.aspectRatio,
                requiresText: request.requiresText,
                heroDNA: request.heroDNA,
                styleDNA: request.styleDNA,
                referenceImage: request.referenceImage,
                signal: request.signal,
                apiKey: request.apiKey,
                enableLogging: config.enableLogging,
            });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));

            if (err.message === 'Aborted') {
                addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'Aborted during generation');
                return buildFailureResult(
                    'Generation cancelled',
                    attempts,
                    auditTrail,
                    currentParams,
                    originalParams,
                    parameterChanges,
                    pipelineStartTime
                );
            }

            addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'Generation threw error', {
                error: err.message,
            });

            attempts.push({
                attemptNumber,
                success: false,
                generationResult: null,
                qaResult: null,
                repairPlan: null,
                appliedRepairs: null,
                parameters: { ...currentParams },
                durationMs: Date.now() - attemptStartTime,
                error: err.message,
            });

            // Continue to next attempt
            continue;
        }

        addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'Generation complete', {
            hasImage: !!generationResult.imageUrl,
            error: generationResult.error,
            durationMs: Date.now() - generateStartTime,
        }, generateStartTime);

        // Store negative prompt from first successful generation
        if (attemptNumber === 1) {
            currentNegativePrompt = generationResult.negativePrompt;
        }

        // Check for generation failure
        if (!generationResult.imageUrl) {
            attempts.push({
                attemptNumber,
                success: false,
                generationResult,
                qaResult: null,
                repairPlan: null,
                appliedRepairs: null,
                parameters: { ...currentParams },
                durationMs: Date.now() - attemptStartTime,
                error: generationResult.error || 'No image generated',
            });

            config.onAttemptComplete?.({
                attemptNumber,
                success: false,
                generationResult,
                qaResult: null,
                repairPlan: null,
                appliedRepairs: null,
                parameters: { ...currentParams },
                durationMs: Date.now() - attemptStartTime,
                error: generationResult.error,
            });

            // Continue to next attempt
            continue;
        }

        lastSuccessfulGeneration = generationResult;

        // ─────────────────────────────────────────────────────────────────────────
        // Phase 2: QA Validation
        // ─────────────────────────────────────────────────────────────────────────

        if (!config.enableQa) {
            // QA disabled - accept the generation
            addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'QA skipped (disabled)');

            attempts.push({
                attemptNumber,
                success: true,
                generationResult,
                qaResult: null,
                repairPlan: null,
                appliedRepairs: null,
                parameters: { ...currentParams },
                durationMs: Date.now() - attemptStartTime,
            });

            finalSuccess = true;
            break;
        }

        emitProgress(
            config,
            'validating',
            attemptNumber,
            `Validating quality (attempt ${attemptNumber}/${config.maxAttempts})...`,
            progressBase + 50
        );

        const qaStartTime = Date.now();

        let qaResult: QaResult;
        try {
            qaResult = await analyzeColoringPage(
                {
                    imageUrl: generationResult.imageUrl,
                    requestId: generationResult.metadata?.requestId || `attempt_${attemptNumber}`,
                    styleId: currentParams.styleId,
                    complexityId: currentParams.complexityId,
                    audienceId: currentParams.audienceId,
                    userPrompt: request.userPrompt,
                    apiKey: request.apiKey,
                    signal: request.signal,
                    enableLogging: config.enableLogging,
                },
                {
                    mode: config.qaMode,
                    minimumPassScore: config.minimumPassScore,
                    includeRawAnalysis: config.enableLogging,
                }
            );
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));

            if (err.message === 'Aborted') {
                addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'Aborted during QA');
                return buildFailureResult(
                    'Generation cancelled',
                    attempts,
                    auditTrail,
                    currentParams,
                    originalParams,
                    parameterChanges,
                    pipelineStartTime
                );
            }

            addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'QA threw error', {
                error: err.message,
            });

            // QA error in production mode = fail the attempt
            if (config.qaMode === 'production') {
                attempts.push({
                    attemptNumber,
                    success: false,
                    generationResult,
                    qaResult: null,
                    repairPlan: null,
                    appliedRepairs: null,
                    parameters: { ...currentParams },
                    durationMs: Date.now() - attemptStartTime,
                    error: `QA failed: ${err.message}`,
                });
                continue;
            }

            // Preview mode - accept despite QA error
            attempts.push({
                attemptNumber,
                success: true,
                generationResult,
                qaResult: null,
                repairPlan: null,
                appliedRepairs: null,
                parameters: { ...currentParams },
                durationMs: Date.now() - attemptStartTime,
            });

            finalSuccess = true;
            break;
        }

        lastQaResult = qaResult;

        addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'QA complete', {
            passed: qaResult.passed,
            score: qaResult.overallScore,
            criticalIssues: qaResult.criticalIssues.length,
            majorIssues: qaResult.majorIssues.length,
            minorIssues: qaResult.minorIssues.length,
            durationMs: Date.now() - qaStartTime,
        }, qaStartTime);

        // ─────────────────────────────────────────────────────────────────────────
        // Phase 3: Check QA Result
        // ─────────────────────────────────────────────────────────────────────────

        if (qaResult.passed || qaResult.isPublishable) {
            // Success!
            addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'QA passed');

            attempts.push({
                attemptNumber,
                success: true,
                generationResult,
                qaResult,
                repairPlan: null,
                appliedRepairs: null,
                parameters: { ...currentParams },
                durationMs: Date.now() - attemptStartTime,
            });

            config.onAttemptComplete?.({
                attemptNumber,
                success: true,
                generationResult,
                qaResult,
                repairPlan: null,
                appliedRepairs: null,
                parameters: { ...currentParams },
                durationMs: Date.now() - attemptStartTime,
            });

            finalSuccess = true;
            break;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Phase 4: Generate Repair Plan
        // ─────────────────────────────────────────────────────────────────────────

        addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'QA failed, generating repair plan', {
            issues: qaResult.issues.map(i => i.code),
        });

        emitProgress(
            config,
            'repairing',
            attemptNumber,
            `Analyzing issues and preparing retry...`,
            progressBase + 75
        );

        const repairPlan = generateRepairPlan({
            qaResult,
            styleId: currentParams.styleId,
            complexityId: currentParams.complexityId,
            audienceId: currentParams.audienceId,
            userPrompt: request.userPrompt,
            attemptNumber,
            maxAttempts: config.maxAttempts,
            previousRepairs,
        });

        previousRepairs.push(repairPlan);

        addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'Repair plan generated', {
            canAutoRepair: repairPlan.canAutoRepair,
            shouldRegenerate: repairPlan.shouldRegenerate,
            overallConfidence: repairPlan.overallConfidence,
            actionsCount: repairPlan.actions.length,
            parameterSuggestions: repairPlan.parameterSuggestions,
        });

        // ─────────────────────────────────────────────────────────────────────────
        // Phase 5: Check if Retry is Possible
        // ─────────────────────────────────────────────────────────────────────────

        const isLastAttempt = attemptNumber >= config.maxAttempts;
        const canRetry = !isLastAttempt && config.enableAutoRetry && repairPlan.canAutoRepair;

        if (!canRetry) {
            // Cannot retry - record this attempt and exit
            attempts.push({
                attemptNumber,
                success: false,
                generationResult,
                qaResult,
                repairPlan,
                appliedRepairs: null,
                parameters: { ...currentParams },
                durationMs: Date.now() - attemptStartTime,
                error: isLastAttempt
                    ? 'Maximum attempts reached'
                    : repairPlan.canAutoRepair
                        ? 'Auto-retry disabled'
                        : 'Issues cannot be auto-repaired',
            });

            config.onAttemptComplete?.({
                attemptNumber,
                success: false,
                generationResult,
                qaResult,
                repairPlan,
                appliedRepairs: null,
                parameters: { ...currentParams },
                durationMs: Date.now() - attemptStartTime,
                error: isLastAttempt ? 'Maximum attempts reached' : 'Cannot auto-repair',
            });

            break;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Phase 6: Apply Repairs
        // ─────────────────────────────────────────────────────────────────────────

        const appliedRepairs = applyRepairPlan(
            repairPlan,
            request.userPrompt, // Always start from original prompt
            currentNegativePrompt,
            {
                styleId: currentParams.styleId,
                complexityId: currentParams.complexityId,
                audienceId: currentParams.audienceId,
            }
        );

        addAuditEntry(auditTrail, `attempt_${attemptNumber}`, 'Repairs applied', {
            changes: appliedRepairs.changesSummary,
            parametersModified: appliedRepairs.parametersModified,
        });

        // Update current state for next attempt
        currentPrompt = appliedRepairs.repairedPrompt;
        currentNegativePrompt = appliedRepairs.enhancedNegativePrompt;

        // Apply parameter changes if allowed
        if (config.allowParameterEscalation && appliedRepairs.parametersModified) {
            if (appliedRepairs.modifiedParams.styleId !== currentParams.styleId) {
                parameterChanges.push(
                    `Style: ${currentParams.styleId} → ${appliedRepairs.modifiedParams.styleId}`
                );
                currentParams.styleId = appliedRepairs.modifiedParams.styleId;
            }
            if (appliedRepairs.modifiedParams.complexityId !== currentParams.complexityId) {
                parameterChanges.push(
                    `Complexity: ${currentParams.complexityId} → ${appliedRepairs.modifiedParams.complexityId}`
                );
                currentParams.complexityId = appliedRepairs.modifiedParams.complexityId;
            }
            if (appliedRepairs.modifiedParams.audienceId !== currentParams.audienceId) {
                parameterChanges.push(
                    `Audience: ${currentParams.audienceId} → ${appliedRepairs.modifiedParams.audienceId}`
                );
                currentParams.audienceId = appliedRepairs.modifiedParams.audienceId;
            }
            if ((appliedRepairs.modifiedParams as any).temperature) {
                currentParams.temperature = (appliedRepairs.modifiedParams as any).temperature;
                parameterChanges.push(`Temperature: → ${currentParams.temperature}`);
            }
        }

        // Record this attempt
        attempts.push({
            attemptNumber,
            success: false,
            generationResult,
            qaResult,
            repairPlan,
            appliedRepairs,
            parameters: { ...currentParams },
            durationMs: Date.now() - attemptStartTime,
            error: `QA failed: ${qaResult.criticalIssues.length} critical, ${qaResult.majorIssues.length} major issues`,
        });

        config.onAttemptComplete?.({
            attemptNumber,
            success: false,
            generationResult,
            qaResult,
            repairPlan,
            appliedRepairs,
            parameters: { ...currentParams },
            durationMs: Date.now() - attemptStartTime,
        });

        // Continue to next attempt...
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Build Final Result
    // ─────────────────────────────────────────────────────────────────────────────

    const totalDurationMs = Date.now() - pipelineStartTime;

    addAuditEntry(auditTrail, 'completion', finalSuccess ? 'Pipeline succeeded' : 'Pipeline failed', {
        totalAttempts: attempts.length,
        finalSuccess,
        totalDurationMs,
    });

    emitProgress(
        config,
        finalSuccess ? 'complete' : 'failed',
        attempts.length,
        finalSuccess
            ? `Generation complete (${attempts.length} attempt${attempts.length > 1 ? 's' : ''})`
            : `Generation failed after ${attempts.length} attempts`,
        100
    );

    // Find the best result
    const successfulAttempt = attempts.find(a => a.success);
    const lastAttempt = attempts[attempts.length - 1];

    const finalGeneration = successfulAttempt?.generationResult || lastSuccessfulGeneration;
    const finalQa = successfulAttempt?.qaResult || lastQaResult;

    const parametersWereModified =
        currentParams.styleId !== originalParams.styleId ||
        currentParams.complexityId !== originalParams.complexityId ||
        currentParams.audienceId !== originalParams.audienceId;

    // Generate summary
    let summary: string;
    if (finalSuccess) {
        if (attempts.length === 1) {
            summary = `Generated successfully on first attempt. Quality score: ${finalQa?.overallScore || 'N/A'}.`;
        } else {
            summary = `Generated successfully after ${attempts.length} attempts. Quality score: ${finalQa?.overallScore || 'N/A'}.`;
            if (parametersWereModified) {
                summary += ` Parameters were adjusted: ${parameterChanges.join(', ')}.`;
            }
        }
    } else {
        const lastError = lastAttempt?.error || 'Unknown error';
        summary = `Generation failed after ${attempts.length} attempt${attempts.length > 1 ? 's' : ''}. ${lastError}`;
        if (lastQaResult) {
            summary += ` Final QA score: ${lastQaResult.overallScore}. Issues: ${lastQaResult.criticalIssues.length} critical, ${lastQaResult.majorIssues.length} major.`;
        }
    }

    return {
        success: finalSuccess,
        imageUrl: finalGeneration?.imageUrl || null,
        finalQaResult: finalQa,
        isPublishable: finalQa?.isPublishable ?? finalSuccess,
        qualityScore: finalQa?.overallScore ?? 0,
        totalAttempts: attempts.length,
        attempts,
        finalParameters: {
            styleId: currentParams.styleId,
            complexityId: currentParams.complexityId,
            audienceId: currentParams.audienceId,
        },
        parametersWereModified,
        parameterChanges,
        totalDurationMs,
        metadata: finalGeneration?.metadata || null,
        summary,
        auditTrail,
        error: finalSuccess ? undefined : lastAttempt?.error,
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Build Failure Result
// ═══════════════════════════════════════════════════════════════════════════════

const buildFailureResult = (
    error: string,
    attempts: AttemptResult[],
    auditTrail: AuditEntry[],
    currentParams: { styleId: string; complexityId: string; audienceId: string },
    originalParams: { styleId: string; complexityId: string; audienceId: string },
    parameterChanges: string[],
    startTime: number
): GenerateAndValidateResult => {
    return {
        success: false,
        imageUrl: null,
        finalQaResult: null,
        isPublishable: false,
        qualityScore: 0,
        totalAttempts: attempts.length,
        attempts,
        finalParameters: currentParams,
        parametersWereModified:
            currentParams.styleId !== originalParams.styleId ||
            currentParams.complexityId !== originalParams.complexityId ||
            currentParams.audienceId !== originalParams.audienceId,
        parameterChanges,
        totalDurationMs: Date.now() - startTime,
        metadata: null,
        summary: error,
        auditTrail,
        error,
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE: Quick Generate (No QA)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick generation without QA validation
 * Useful for previews or when speed is more important than quality assurance
 */
export const quickGenerate = async (
    request: Omit<GenerateAndValidateRequest, 'config'>
): Promise<GenerateAndValidateResult> => {
    return generateAndValidate({
        ...request,
        config: {
            maxAttempts: 1,
            enableQa: false,
            enableAutoRetry: false,
            qaMode: 'preview',
            minimumPassScore: 0,
            allowParameterEscalation: false,
            enableLogging: false,
        },
    });
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE: Strict Generate (Maximum Quality)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Strict generation with maximum QA enforcement
 * Useful for final publication-ready images
 */
export const strictGenerate = async (
    request: Omit<GenerateAndValidateRequest, 'config'> & {
        config?: Partial<PipelineConfig>;
    }
): Promise<GenerateAndValidateResult> => {
    return generateAndValidate({
        ...request,
        config: {
            maxAttempts: 5,
            enableQa: true,
            enableAutoRetry: true,
            qaMode: 'production',
            minimumPassScore: 80,
            allowParameterEscalation: true,
            enableLogging: true,
            ...request.config,
        },
    });
};

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS FOR CONVENIENCE
// ═══════════════════════════════════════════════════════════════════════════════

export { setLogCallback, GenerationLogEntry };
export type { ColoringPageResult, QaResult, RepairPlan };
