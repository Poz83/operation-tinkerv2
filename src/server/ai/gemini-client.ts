/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GEMINI CLIENT v2.0 — Production-Grade Image Generation
 * Paint-by-Numbers SaaS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Style-aware temperature selection
 * - Complexity-aware resolution mapping
 * - Pre-flight compatibility validation
 * - Exponential backoff retry for transient errors
 * - Structured request/response logging
 * - Unified orchestration function
 * - Cost estimation tracking
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { GoogleGenAI, Part } from '@google/genai';
import {
  buildPrompt,
  BuildPromptResult,
  validateCombination,
  STYLE_RULES,
  SYSTEM_INSTRUCTION
} from './prompts';
import { getStoredApiKey } from '../../lib/crypto';
import { CharacterDNA, StyleDNA } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const GEMINI_TEXT_MODEL = 'gemini-2.0-flash-001'; // Updated to latest flash
export const GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation'; // Use preview for image gen

/** Retry configuration for transient errors */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatusCodes: [429, 503, 500],
};

/** Resolution tiers mapped to complexity */
const COMPLEXITY_RESOLUTION_MAP: Record<string, '1K' | '2K' | '4K'> = {
  'Very Simple': '1K',
  'Simple': '1K',
  'Moderate': '2K',
  'Intricate': '2K',
  'Extreme Detail': '4K',
};

/** Estimated cost per generation (for tracking/budgeting) */
const ESTIMATED_COST_PER_GENERATION: Record<string, number> = {
  '1K': 0.02,
  '2K': 0.04,
  '4K': 0.08,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  referenceImage?: { base64: string; mimeType: string };
  aspectRatio: string;
  resolution?: '1K' | '2K' | '4K';
  width?: number;
  height?: number;
  temperature?: number;
  signal?: AbortSignal;
  apiKey?: string;
  /** Enable detailed logging for debugging */
  enableLogging?: boolean;
  /** Request ID for correlation */
  requestId?: string;
}

export interface GenerateImageResult {
  imageUrl: string | null;
  error?: string;
  /** Metadata about the generation */
  metadata?: GenerationMetadata;
}

export interface GenerationMetadata {
  requestId: string;
  model: string;
  resolution: '1K' | '2K' | '4K';
  temperature: number;
  estimatedCost: number;
  durationMs: number;
  retryCount: number;
  promptTokenEstimate: number;
  timestamp: string;
}

/** Unified input for the orchestrated generation function */
export interface ColoringPageRequest {
  /** User's natural language description */
  userPrompt: string;
  /** Visual style ID (e.g., 'Bold & Easy', 'Botanical') */
  styleId: string;
  /** Complexity level */
  complexityId: string;
  /** Target audience ID */
  audienceId: string;
  /** Aspect ratio for output */
  aspectRatio: string;
  /** Whether the prompt contains text to render */
  requiresText?: boolean;
  /** Optional hero character DNA for consistency */
  heroDNA?: CharacterDNA;
  /** Optional style DNA from reference image */
  styleDNA?: StyleDNA | null;
  /** Optional reference image for style transfer */
  referenceImage?: { base64: string; mimeType: string };
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Direct API key (bypasses stored key lookup) */
  apiKey?: string;
  /** Enable verbose logging */
  enableLogging?: boolean;
}

export interface ColoringPageResult {
  /** The generated image as a data URL */
  imageUrl: string | null;
  /** Error message if generation failed */
  error?: string;
  /** The full prompt that was sent to Gemini */
  fullPrompt: string;
  /** The negative prompt used */
  negativePrompt: string;
  /** Compatibility validation results */
  compatibility: BuildPromptResult['compatibility'];
  /** Hero validation results (if applicable) */
  heroValidation: BuildPromptResult['heroValidation'];
  /** Final resolved parameters after compatibility adjustments */
  resolvedParams: BuildPromptResult['resolvedParams'];
  /** Generation metadata for logging/analytics */
  metadata?: GenerationMetadata;
}

/** Structured log entry for analytics */
export interface GenerationLogEntry {
  requestId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  phase: 'validation' | 'prompt_build' | 'api_call' | 'retry' | 'complete' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGGING INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

type LogCallback = (entry: GenerationLogEntry) => void;

let globalLogCallback: LogCallback | null = null;

/**
 * Register a global log callback for analytics/monitoring
 * @example
 * setLogCallback((entry) => {
 *   analytics.track('gemini_generation', entry);
 *   if (entry.level === 'error') Sentry.captureMessage(entry.message);
 * });
 */
export const setLogCallback = (callback: LogCallback | null): void => {
  globalLogCallback = callback;
};

const log = (
  requestId: string,
  level: GenerationLogEntry['level'],
  phase: GenerationLogEntry['phase'],
  message: string,
  data?: Record<string, unknown>,
  enableLogging = false
): void => {
  const entry: GenerationLogEntry = {
    requestId,
    timestamp: new Date().toISOString(),
    level,
    phase,
    message,
    data,
  };

  // Always call global callback if registered
  if (globalLogCallback) {
    globalLogCallback(entry);
  }

  // Console logging only if explicitly enabled
  if (enableLogging) {
    const prefix = `[Gemini ${requestId}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      default:
        console.log(prefix, message, data || '');
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Generate a unique request ID */
const generateRequestId = (): string => {
  return `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/** Estimate token count from prompt text (rough approximation) */
const estimateTokens = (text: string): number => {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
};

/** Sleep for specified milliseconds */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/** Calculate exponential backoff delay */
const getBackoffDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  // Add jitter (±20%)
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelayMs);
};

/** Check if an error is retryable */
const isRetryableError = (error: Error): boolean => {
  const message = error.message || '';
  return RETRY_CONFIG.retryableStatusCodes.some(code =>
    message.includes(code.toString())
  );
};

/** Get temperature for a style, with fallback */
const getStyleTemperature = (styleId: string): number => {
  return STYLE_RULES[styleId]?.recommendedTemperature ?? STYLE_RULES['default']?.recommendedTemperature ?? 0.8;
};

/** Get resolution for a complexity level */
const getComplexityResolution = (complexityId: string): '1K' | '2K' | '4K' => {
  return COMPLEXITY_RESOLUTION_MAP[complexityId] || '2K';
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIMENSION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Map aspect ratios and resolution to API configuration
 */
const getDimensionConfig = (
  aspectRatio: string,
  resolution: '1K' | '2K' | '4K' | undefined,
  width?: number,
  height?: number
): { imageSize: string; aspectRatio: string } => {
  // Derive imageSize from explicit resolution first; otherwise infer from dimensions
  if (!resolution) {
    const maxDim = Math.max(width ?? 0, height ?? 0);
    if (maxDim >= 3000) resolution = '4K';
    else if (maxDim >= 1536) resolution = '2K';
    else resolution = '1K';
  }

  return {
    imageSize: resolution,
    aspectRatio: aspectRatio,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolve API key from multiple sources with priority:
 * 1. Directly passed key
 * 2. User's stored key
 * 3. Environment variable (server-side)
 */
const resolveApiKey = async (providedKey?: string): Promise<string | null> => {
  if (providedKey) return providedKey;

  const storedKey = await getStoredApiKey();
  if (storedKey) return storedKey;

  // Environment variable fallback (useful for server-side rendering)
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CORE IMAGE GENERATION (Low-Level)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Low-level image generation with retry logic
 * Use `generateColoringPage()` for full orchestration
 */
export const generateWithGemini = async (
  options: GenerateImageOptions
): Promise<GenerateImageResult> => {
  const requestId = options.requestId || generateRequestId();
  const startTime = Date.now();
  let retryCount = 0;

  // Resolve resolution
  const resolution = options.resolution || '2K';

  log(requestId, 'info', 'api_call', 'Starting Gemini image generation', {
    resolution,
    aspectRatio: options.aspectRatio,
    temperature: options.temperature,
    hasReference: !!options.referenceImage,
  }, options.enableLogging);

  // Check abort before starting
  if (options.signal?.aborted) {
    throw new Error('Aborted');
  }

  // Resolve API key
  const apiKey = await resolveApiKey(options.apiKey);
  if (!apiKey) {
    return {
      imageUrl: null,
      error: 'Configuration Error: Gemini API Key is missing. Please add your API key in Settings.',
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build prompt with negative prompt appended
  const promptText = options.negativePrompt
    ? `${options.prompt}\n\n---\nNEGATIVE PROMPT (avoid these): ${options.negativePrompt}`
    : options.prompt;

  // Build parts array
  const parts: Part[] = [{ text: promptText }];

  if (options.referenceImage) {
    parts.push({
      inlineData: {
        data: options.referenceImage.base64,
        mimeType: options.referenceImage.mimeType,
      },
    });
  }

  const imageConfig = getDimensionConfig(
    options.aspectRatio,
    resolution,
    options.width,
    options.height
  );

  // Retry loop
  while (retryCount <= RETRY_CONFIG.maxRetries) {
    try {
      // Check abort before each attempt
      if (options.signal?.aborted) {
        throw new Error('Aborted');
      }

      const generatePromise = ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          // @ts-ignore - imageConfig typing may vary by SDK version
          imageConfig: imageConfig,
          temperature: options.temperature ?? 0.8,
          responseModalities: ['IMAGE'],
        },
      });

      // Race with abort signal
      const abortPromise = new Promise<never>((_, reject) => {
        if (options.signal?.aborted) reject(new Error('Aborted'));
        options.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
      });

      // @ts-ignore - Promise.race types
      const response = await Promise.race([generatePromise, abortPromise]);

      // Extract image data
      const part = response.candidates?.[0]?.content?.parts?.find(
        (p: Part) => p.inlineData
      );

      if (part?.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        const base64Data = part.inlineData.data;
        const durationMs = Date.now() - startTime;

        const metadata: GenerationMetadata = {
          requestId,
          model: GEMINI_IMAGE_MODEL,
          resolution,
          temperature: options.temperature ?? 0.8,
          estimatedCost: ESTIMATED_COST_PER_GENERATION[resolution] || 0.04,
          durationMs,
          retryCount,
          promptTokenEstimate: estimateTokens(promptText),
          timestamp: new Date().toISOString(),
        };

        log(requestId, 'info', 'complete', 'Generation successful', {
          durationMs,
          retryCount,
        }, options.enableLogging);

        return {
          imageUrl: `data:${mimeType};base64,${base64Data}`,
          metadata,
        };
      }

      // No image data in response
      return {
        imageUrl: null,
        error: 'No image data returned from API. The model may have refused the prompt.',
      };

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Abort is not retryable
      if (err.message === 'Aborted' || options.signal?.aborted) {
        throw new Error('Aborted');
      }

      // Check if retryable
      if (isRetryableError(err) && retryCount < RETRY_CONFIG.maxRetries) {
        const delay = getBackoffDelay(retryCount);
        log(requestId, 'warn', 'retry', `Retryable error, attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}`, {
          error: err.message,
          delayMs: delay,
        }, options.enableLogging);

        await sleep(delay);
        retryCount++;
        continue;
      }

      // Non-retryable or max retries exceeded
      log(requestId, 'error', 'error', 'Generation failed', {
        error: err.message,
        retryCount,
      }, options.enableLogging);

      return {
        imageUrl: null,
        error: formatUserFriendlyError(err.message),
      };
    }
  }

  // Should not reach here, but safety fallback
  return {
    imageUrl: null,
    error: 'Generation failed after maximum retries.',
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert technical errors to user-friendly messages
 */
const formatUserFriendlyError = (message: string): string => {
  const errorMap: Record<string, string> = {
    '400': 'The image could not be generated. The prompt may contain content that violates usage policies, or the parameters are invalid. Try simplifying your prompt.',
    '401': 'Authentication failed. Please check your API key in Settings.',
    '403': 'Access denied. Please verify your API key has the correct permissions and billing is enabled.',
    '404': 'The Gemini model is not available. Please try again later or contact support.',
    '429': 'You\'ve hit the rate limit. Please wait a moment before generating again.',
    '500': 'Gemini encountered an internal error. Please try again.',
    '503': 'Gemini is temporarily unavailable. Please try again in a few minutes.',
  };

  for (const [code, friendlyMessage] of Object.entries(errorMap)) {
    if (message.includes(code)) {
      return friendlyMessage;
    }
  }

  // Check for specific error patterns
  if (message.toLowerCase().includes('safety')) {
    return 'The prompt was blocked by safety filters. Please modify your prompt and try again.';
  }

  if (message.toLowerCase().includes('quota')) {
    return 'API quota exceeded. Please check your Gemini API billing status.';
  }

  if (message.toLowerCase().includes('timeout')) {
    return 'The request timed out. Please try again with a simpler prompt or lower resolution.';
  }

  // Generic fallback
  return `Generation failed: ${message}`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED ORCHESTRATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a coloring page with full orchestration:
 * 1. Validate style/complexity/audience compatibility
 * 2. Build optimized prompt with all specifications
 * 3. Select appropriate temperature and resolution
 * 4. Generate image with retry logic
 *
 * This is the primary function your UI should call.
 *
 * @example
 * const result = await generateColoringPage({
 *   userPrompt: 'A cute dragon eating a taco',
 *   styleId: 'Bold & Easy',
 *   complexityId: 'Simple',
 *   audienceId: 'preschool',
 *   aspectRatio: '3:4',
 * });
 *
 * if (result.error) {
 *   showError(result.error);
 *   if (result.compatibility.warnings.length > 0) {
 *     showWarnings(result.compatibility.warnings);
 *   }
 * } else {
 *   displayImage(result.imageUrl);
 * }
 */
export const generateColoringPage = async (
  request: ColoringPageRequest
): Promise<ColoringPageResult> => {
  const requestId = generateRequestId();
  const enableLogging = request.enableLogging ?? false;

  log(requestId, 'info', 'validation', 'Starting coloring page generation', {
    userPrompt: request.userPrompt.substring(0, 100),
    styleId: request.styleId,
    complexityId: request.complexityId,
    audienceId: request.audienceId,
  }, enableLogging);

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 1: Pre-flight Compatibility Validation
  // ─────────────────────────────────────────────────────────────────────────────

  log(requestId, 'info', 'validation', 'Checking compatibility', undefined, enableLogging);

  // Use the requested audience ID for compatibility checking
  const preValidation = validateCombination(
    request.styleId,
    request.complexityId,
    request.audienceId
  );

  if (preValidation.warnings.length > 0) {
    log(requestId, 'warn', 'validation', 'Compatibility warnings', {
      warnings: preValidation.warnings,
      adjustments: preValidation.adjustments,
    }, enableLogging);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 2: Build Optimized Prompt
  // ─────────────────────────────────────────────────────────────────────────────

  log(requestId, 'info', 'prompt_build', 'Building prompt', undefined, enableLogging);

  const promptResult = buildPrompt(
    request.userPrompt,
    request.styleId,
    request.complexityId,
    request.requiresText ?? false,
    '', // audiencePrompt - deprecated, using audienceId
    request.audienceId,
    request.styleDNA,
    request.heroDNA
  );

  // Log hero validation if applicable
  if (promptResult.heroValidation && !promptResult.heroValidation.isValid) {
    log(requestId, 'warn', 'validation', 'Hero validation warnings', {
      warnings: promptResult.heroValidation.warnings,
    }, enableLogging);
  }

  log(requestId, 'info', 'prompt_build', 'Prompt built successfully', {
    resolvedStyle: promptResult.resolvedParams.style,
    resolvedComplexity: promptResult.resolvedParams.complexity,
    promptLength: promptResult.fullPrompt.length,
    negativeLength: promptResult.fullNegativePrompt.length,
  }, enableLogging);

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 3: Determine Generation Parameters
  // ─────────────────────────────────────────────────────────────────────────────

  const resolvedStyleId = promptResult.resolvedParams.style;
  const resolvedComplexityId = promptResult.resolvedParams.complexity;

  // Style-aware temperature
  const temperature = getStyleTemperature(resolvedStyleId);

  // Complexity-aware resolution
  const resolution = getComplexityResolution(resolvedComplexityId);

  log(requestId, 'info', 'api_call', 'Generation parameters resolved', {
    temperature,
    resolution,
    aspectRatio: request.aspectRatio,
  }, enableLogging);

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 4: Generate Image
  // ─────────────────────────────────────────────────────────────────────────────

  const generationResult = await generateWithGemini({
    prompt: promptResult.fullPrompt,
    negativePrompt: promptResult.fullNegativePrompt,
    referenceImage: request.referenceImage,
    aspectRatio: request.aspectRatio,
    resolution,
    temperature,
    signal: request.signal,
    apiKey: request.apiKey,
    enableLogging,
    requestId,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 5: Return Complete Result
  // ─────────────────────────────────────────────────────────────────────────────

  return {
    imageUrl: generationResult.imageUrl,
    error: generationResult.error,
    fullPrompt: promptResult.fullPrompt,
    negativePrompt: promptResult.fullNegativePrompt,
    compatibility: promptResult.compatibility,
    heroValidation: promptResult.heroValidation,
    resolvedParams: promptResult.resolvedParams,
    metadata: generationResult.metadata,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURED OUTPUT GENERATION (Text/JSON)
// ═══════════════════════════════════════════════════════════════════════════════

interface GenerateObjectOptions {
  model?: string;
  prompt: string;
  system?: string;
  image?: string;
  schema: unknown;
  apiKey?: string;
  signal?: AbortSignal;
  temperature?: number;
  enableLogging?: boolean;
}

/**
 * Generate structured JSON output from Gemini
 * Used for analysis, extraction, and other non-image tasks
 */
export const generateObject = async <T>(
  options: GenerateObjectOptions
): Promise<T> => {
  const requestId = generateRequestId();
  const enableLogging = options.enableLogging ?? false;

  try {
    if (options.signal?.aborted) throw new Error('Aborted');

    log(requestId, 'info', 'api_call', 'Starting structured generation', {
      model: options.model,
      hasImage: !!options.image,
    }, enableLogging);

    const apiKey = await resolveApiKey(options.apiKey);
    if (!apiKey) {
      throw new Error('Configuration Error: Gemini API Key is missing.');
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare content
    const parts: Part[] = [{ text: options.prompt }];

    if (options.image) {
      const match = options.image.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: { mimeType: match[1], data: match[2] },
        });
      }
    }

    // Call API
    const result = await ai.models.generateContent({
      model: options.model || GEMINI_TEXT_MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: options.system,
        responseMimeType: 'application/json',
        responseSchema: options.schema,
        temperature: options.temperature ?? 0.2,
      },
    });

    if (options.signal?.aborted) throw new Error('Aborted');

    // Parse result
    const candidate = result.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const text = part?.text;

    if (!text) {
      throw new Error('No JSON returned from Gemini');
    }

    // Clean markdown code blocks if present
    const cleanJson = text.replace(/```json\n?|```/g, '').trim();

    log(requestId, 'info', 'complete', 'Structured generation successful', undefined, enableLogging);

    return JSON.parse(cleanJson) as T;

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (err.message === 'Aborted' || options.signal?.aborted) {
      throw new Error('Aborted');
    }

    log(requestId, 'error', 'error', 'Structured generation failed', {
      error: err.message,
    }, enableLogging);

    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COST TRACKING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UsageStats {
  totalGenerations: number;
  totalCost: number;
  byResolution: Record<string, { count: number; cost: number }>;
  byStyle: Record<string, number>;
  averageDurationMs: number;
}

/**
 * Aggregate usage statistics from generation metadata
 * Useful for dashboard displays and budget tracking
 */
export const aggregateUsageStats = (
  metadataEntries: GenerationMetadata[]
): UsageStats => {
  const stats: UsageStats = {
    totalGenerations: metadataEntries.length,
    totalCost: 0,
    byResolution: {},
    byStyle: {},
    averageDurationMs: 0,
  };

  let totalDuration = 0;

  for (const entry of metadataEntries) {
    // Total cost
    stats.totalCost += entry.estimatedCost;

    // By resolution
    if (!stats.byResolution[entry.resolution]) {
      stats.byResolution[entry.resolution] = { count: 0, cost: 0 };
    }
    stats.byResolution[entry.resolution].count++;
    stats.byResolution[entry.resolution].cost += entry.estimatedCost;

    // Duration
    totalDuration += entry.durationMs;
  }

  stats.averageDurationMs = metadataEntries.length > 0
    ? totalDuration / metadataEntries.length
    : 0;

  return stats;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verify API connectivity and key validity
 * Useful for settings page validation
 */
export const checkApiHealth = async (
  apiKey?: string
): Promise<{ healthy: boolean; error?: string; latencyMs?: number }> => {
  const startTime = Date.now();

  try {
    const key = await resolveApiKey(apiKey);
    if (!key) {
      return { healthy: false, error: 'No API key configured' };
    }

    const ai = new GoogleGenAI({ apiKey: key });

    // Simple test call
    const result = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: 'Reply with "OK"' }] }],
      config: { temperature: 0, maxOutputTokens: 10 },
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const latencyMs = Date.now() - startTime;

    if (text) {
      return { healthy: true, latencyMs };
    }

    return { healthy: false, error: 'No response from API' };

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { healthy: false, error: formatUserFriendlyError(err.message) };
  }
};