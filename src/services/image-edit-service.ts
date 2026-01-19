/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IMAGE EDIT SERVICE v2.0
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Handles image editing operations using Gemini's image generation capabilities:
 * - editImage(): Basic masked/unmasked editing
 * - editAndValidate(): Editing with QA validation
 * - batchEdit(): Multiple edits with consistency
 *
 * v2.0 Changes:
 * - Uses correct model constants from gemini-client.ts
 * - Optional QA validation for edited images
 * - Style preservation enforcement from prompts v5.0
 * - Improved error handling and retry logic
 * - Aligned with v5.0 style specifications
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { GoogleGenAI, Part } from '@google/genai';
import { GEMINI_IMAGE_MODEL } from '../server/ai/gemini-client';
import { getStoredApiKey } from '../lib/crypto';
import { analyzeColoringPage, QaResult, QaConfig } from '../server/ai/qaService';
import { VALID_STYLE_IDS, type StyleId } from './ColoringStudioService';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EditImageOptions {
    /** Source image as base64 with data URL prefix or raw base64 */
    sourceImage: { base64: string; mimeType: string };
    /** Optional mask image (white = edit area, black = preserve) */
    maskImage?: { base64: string; mimeType: string };
    /** Natural language description of the edit */
    editPrompt: string;
    /** Brief description of what the source image contains */
    sourceSubject?: string;
    /** Style to maintain (from valid style IDs) */
    style?: StyleId;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
    /** Direct API key override */
    apiKey?: string;
}

export interface EditImageResult {
    /** Edited image as data URL, or null if failed */
    imageUrl: string | null;
    /** Error message if failed */
    error?: string;
    /** Request ID for tracking */
    requestId: string;
    /** Duration in ms */
    durationMs: number;
}

export interface EditAndValidateOptions extends EditImageOptions {
    /** Complexity for QA validation */
    complexity?: string;
    /** Audience for QA validation */
    audience?: string;
    /** QA configuration */
    qaConfig?: Partial<QaConfig>;
}

export interface EditAndValidateResult extends EditImageResult {
    /** QA result (if validation was run) */
    qaResult?: QaResult;
    /** Whether the edit passed QA */
    passedQa?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base system instruction for all image edits
 * Emphasizes style preservation and coloring book format
 */
const BASE_EDIT_SYSTEM_INSTRUCTION = `
You are an expert image editor specializing in coloring book line art.
Your task is to edit images while PRESERVING their original style and line art quality.

═══════════════════════════════════════════════════════════════════════════════
ABSOLUTE RULES (Non-Negotiable)
═══════════════════════════════════════════════════════════════════════════════

1. OUTPUT FORMAT:
   - Pure black lines (#000000) on pure white background (#FFFFFF) ONLY
   - NO colors, NO grey tones, NO gradients, NO shading
   - NO solid black filled areas - everything is outlined

2. STYLE PRESERVATION:
   - Match the EXACT line weight of the original image
   - Maintain the same artistic style throughout
   - Edited areas must blend seamlessly with original

3. EDIT SCOPE:
   - ONLY modify what the user specifically requests
   - Preserve ALL unmasked regions exactly
   - Maintain composition and layout unless explicitly asked to change

4. QUALITY CONSISTENCY:
   - The result must look like ONE cohesive drawing
   - No visible seams or style mismatches between edited and original areas
   - All shapes must remain CLOSED (colourable)
`.trim();

/**
 * Generate style-specific instructions (aligned with prompts v5.0)
 */
const getStyleInstructions = (style?: StyleId): string => {
    if (!style) return '';

    const styleInstructions: Partial<Record<StyleId, string>> = {
        'Cozy Hand-Drawn': `
STYLE: Cozy Hand-Drawn
- Use organic 0.5-1mm lines with hand-drawn charm
- Allow slight wobble in lines
- Maintain warm, inviting aesthetic
    `,
        'Bold & Easy': `
STYLE: Bold & Easy
- Use THICK 4mm+ uniform lines
- NO fine details or thin lines
- Simple, bold shapes only
    `,
        'Kawaii': `
STYLE: Kawaii
- Use thick 3mm smooth curves
- ALL corners must be ROUNDED
- Maintain cute, friendly aesthetic with chibi proportions
    `,
        'Whimsical': `
STYLE: Whimsical
- Use flowing variable-width lines (0.5-1.5mm)
- Elongated fairy-tale proportions
- Maintain dreamy, magical atmosphere
    `,
        'Cartoon': `
STYLE: Cartoon
- Use bold outlines (1.5-2mm) with thinner internal lines (0.5mm)
- Clear silhouettes and expressive poses
- Maintain dynamic cartoon aesthetic
    `,
        'Botanical': `
STYLE: Botanical
- Use fine 0.3-0.5mm precise lines
- Scientific illustration accuracy
- Each petal/leaf is a closed shape
    `,
        'Realistic': `
STYLE: Realistic (Ligne Claire)
- Use uniform 0.6mm line weight throughout
- NO line weight variation
- Maintain clean, precise contours
    `,
        'Geometric': `
STYLE: Geometric
- Use ONLY straight lines (0.8mm uniform)
- NO curves permitted
- Maintain low-poly/faceted aesthetic
    `,
        'Fantasy': `
STYLE: Fantasy
- Use varied dramatic lines (0.5-2mm)
- Epic compositions with detailed world-building
- Maintain heroic proportions
    `,
        'Gothic': `
STYLE: Gothic
- Use fine to medium varied lines
- Ornate decorative details
- Dramatic atmospheric composition
    `,
        'Mandala': `
STYLE: Mandala
- Use fine uniform 0.5mm lines
- Perfect circular symmetry
- Repeating radial patterns
    `,
        'Zentangle': `
STYLE: Zentangle
- Use fine uniform 0.5mm lines
- Structured repetitive patterns
- Defined pattern boundaries
    `,
    };

    return styleInstructions[style] || '';
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate unique request ID
 */
const generateRequestId = (): string => {
    return `edit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Resolve API key from multiple sources
 */
const resolveApiKey = async (providedKey?: string): Promise<string | null> => {
    if (providedKey) return providedKey;
    return await getStoredApiKey();
};

/**
 * Format user-friendly error messages
 */
const formatError = (message: string): string => {
    const errorMap: Record<string, string> = {
        '400': 'The edit could not be completed. The model may have rejected the edit request.',
        '403': 'Access denied. Please check your API key.',
        '429': 'Rate limited. Please wait a moment before trying again.',
        '503': 'Service temporarily unavailable. Please try again.',
    };

    for (const [code, friendlyMessage] of Object.entries(errorMap)) {
        if (message.includes(code)) {
            return friendlyMessage;
        }
    }

    if (message.toLowerCase().includes('safety')) {
        return 'The edit was blocked by safety filters. Please modify your edit request.';
    }

    return `Edit failed: ${message}`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CORE EDIT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Edit an image using Gemini's image generation capabilities
 * 
 * @example
 * // Simple edit
 * const result = await editImage({
 *   sourceImage: { base64: imageData, mimeType: 'image/png' },
 *   editPrompt: 'Add a flower to the character\'s hair',
 *   style: 'Kawaii',
 * });
 * 
 * @example
 * // Masked edit
 * const result = await editImage({
 *   sourceImage: { base64: imageData, mimeType: 'image/png' },
 *   maskImage: { base64: maskData, mimeType: 'image/png' },
 *   editPrompt: 'Replace this area with a tree',
 *   sourceSubject: 'a garden scene',
 * });
 */
export async function editImage(options: EditImageOptions): Promise<EditImageResult> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
        // Check abort
        if (options.signal?.aborted) {
            throw new Error('Aborted');
        }

        // Resolve API key
        const apiKey = await resolveApiKey(options.apiKey);
        if (!apiKey) {
            return {
                imageUrl: null,
                error: 'API Key not found. Please add your key in Settings.',
                requestId,
                durationMs: Date.now() - startTime,
            };
        }

        const ai = new GoogleGenAI({ apiKey });

        // Build system instruction with style
        const styleInstructions = getStyleInstructions(options.style);
        const systemInstruction = styleInstructions
            ? `${BASE_EDIT_SYSTEM_INSTRUCTION}\n\n${styleInstructions}`
            : BASE_EDIT_SYSTEM_INSTRUCTION;

        // Build prompt using Google's recommended template
        const subject = options.sourceSubject || 'a coloring book image';
        let promptText: string;

        if (options.maskImage) {
            promptText = `Using the provided image of ${subject}, perform this edit on the masked (white) region: ${options.editPrompt}

MASK RULES:
- White areas in the mask = areas to edit
- Black areas in the mask = preserve exactly as-is
- Blend edited areas seamlessly with preserved areas

STYLE ENFORCEMENT:
- Match the exact line weight and style of the original image
- Ensure edited content is pure black lines on white, no fills, no shading
- All shapes must be closed for colouring`;
        } else {
            promptText = `Using the provided image of ${subject}, perform this edit: ${options.editPrompt}

EDIT RULES:
- Make ONLY the requested change
- Preserve all other elements exactly
- Maintain the original line art style throughout

STYLE ENFORCEMENT:
- Match the exact line weight and style of the original
- Keep output as pure black lines on white, no fills, no shading
- All shapes must remain closed for colouring`;
        }

        // Build parts array
        const parts: Part[] = [
            { text: promptText },
            {
                inlineData: {
                    data: options.sourceImage.base64.replace(/^data:image\/\w+;base64,/, ''),
                    mimeType: options.sourceImage.mimeType,
                },
            },
        ];

        if (options.maskImage) {
            parts.push({
                inlineData: {
                    data: options.maskImage.base64.replace(/^data:image\/\w+;base64,/, ''),
                    mimeType: options.maskImage.mimeType,
                },
            });
        }

        // Check abort before API call
        if (options.signal?.aborted) {
            throw new Error('Aborted');
        }

        // Make API call
        const response = await ai.models.generateContent({
            model: GEMINI_IMAGE_MODEL,
            contents: { parts },
            config: {
                systemInstruction,
                temperature: 0.7, // Lower temperature for more consistent edits
                responseModalities: ['IMAGE'],
            },
        });

        // Extract image from response
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (part?.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const durationMs = Date.now() - startTime;

            return {
                imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
                requestId,
                durationMs,
            };
        }

        return {
            imageUrl: null,
            error: 'No image data returned from API. The model may have rejected the edit.',
            requestId,
            durationMs: Date.now() - startTime,
        };

    } catch (error: any) {
        // Handle abort
        if (error.name === 'AbortError' || error.message === 'Aborted' || options.signal?.aborted) {
            throw new Error('Aborted');
        }

        console.error('Image Edit API Error:', error);

        return {
            imageUrl: null,
            error: formatError(error.message || 'Unknown error'),
            requestId,
            durationMs: Date.now() - startTime,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT WITH QA VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Edit an image and validate the result with QA
 * 
 * @example
 * const result = await editAndValidate({
 *   sourceImage: { base64: imageData, mimeType: 'image/png' },
 *   editPrompt: 'Add a butterfly',
 *   style: 'Botanical',
 *   complexity: 'Moderate',
 *   audience: 'kids',
 * });
 * 
 * if (result.passedQa) {
 *   displayImage(result.imageUrl);
 * } else {
 *   showWarning('Edit may have quality issues', result.qaResult?.issues);
 * }
 */
export async function editAndValidate(
    options: EditAndValidateOptions
): Promise<EditAndValidateResult> {
    // First, perform the edit
    const editResult = await editImage(options);

    // If edit failed, return immediately
    if (!editResult.imageUrl) {
        return {
            ...editResult,
            passedQa: false,
        };
    }

    // Run QA validation
    try {
        const qaResult = await analyzeColoringPage(
            {
                imageUrl: editResult.imageUrl,
                requestId: editResult.requestId,
                styleId: options.style || 'Cozy Hand-Drawn',
                complexityId: options.complexity || 'Moderate',
                audienceId: options.audience || 'kids',
                userPrompt: `Edit: ${options.editPrompt}`,
                apiKey: options.apiKey,
                signal: options.signal,
            },
            {
                mode: options.qaConfig?.mode || 'preview',
                minimumPassScore: options.qaConfig?.minimumPassScore || 60,
                strictTextureCheck: options.qaConfig?.strictTextureCheck ?? true,
                strictColorCheck: options.qaConfig?.strictColorCheck ?? true,
                checkRestAreas: options.qaConfig?.checkRestAreas ?? true,
                checkMockupFormat: options.qaConfig?.checkMockupFormat ?? true,
            }
        );

        return {
            ...editResult,
            qaResult,
            passedQa: qaResult.passed || qaResult.isPublishable,
        };

    } catch (error: any) {
        // If QA fails but edit succeeded, return edit result with warning
        if (error.message === 'Aborted') {
            throw error;
        }

        console.warn('QA validation failed for edit:', error);

        return {
            ...editResult,
            passedQa: undefined, // Unknown - QA failed
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH EDITING
// ═══════════════════════════════════════════════════════════════════════════════

export interface BatchEditItem {
    id: string;
    sourceImage: { base64: string; mimeType: string };
    editPrompt: string;
    maskImage?: { base64: string; mimeType: string };
}

export interface BatchEditOptions {
    items: BatchEditItem[];
    /** Common style for all edits */
    style?: StyleId;
    /** Common subject description */
    sourceSubject?: string;
    /** Run QA on results */
    runQa?: boolean;
    /** QA options */
    qaConfig?: Partial<QaConfig>;
    /** Abort signal */
    signal?: AbortSignal;
    /** API key */
    apiKey?: string;
    /** Progress callback */
    onProgress?: (completed: number, total: number, currentId: string) => void;
}

export interface BatchEditResult {
    results: Map<string, EditAndValidateResult>;
    successCount: number;
    failureCount: number;
    totalDurationMs: number;
}

/**
 * Edit multiple images with consistent style
 * Processes sequentially to avoid rate limiting
 */
export async function batchEdit(options: BatchEditOptions): Promise<BatchEditResult> {
    const startTime = Date.now();
    const results = new Map<string, EditAndValidateResult>();
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < options.items.length; i++) {
        const item = options.items[i];

        // Check abort
        if (options.signal?.aborted) {
            throw new Error('Aborted');
        }

        // Report progress
        options.onProgress?.(i, options.items.length, item.id);

        try {
            let result: EditAndValidateResult;

            if (options.runQa) {
                result = await editAndValidate({
                    sourceImage: item.sourceImage,
                    maskImage: item.maskImage,
                    editPrompt: item.editPrompt,
                    sourceSubject: options.sourceSubject,
                    style: options.style,
                    qaConfig: options.qaConfig,
                    signal: options.signal,
                    apiKey: options.apiKey,
                });
            } else {
                const editResult = await editImage({
                    sourceImage: item.sourceImage,
                    maskImage: item.maskImage,
                    editPrompt: item.editPrompt,
                    sourceSubject: options.sourceSubject,
                    style: options.style,
                    signal: options.signal,
                    apiKey: options.apiKey,
                });
                result = { ...editResult, passedQa: undefined };
            }

            results.set(item.id, result);

            if (result.imageUrl) {
                successCount++;
            } else {
                failureCount++;
            }

        } catch (error: any) {
            if (error.message === 'Aborted') {
                throw error;
            }

            results.set(item.id, {
                imageUrl: null,
                error: error.message || 'Unknown error',
                requestId: `batch_${item.id}`,
                durationMs: 0,
                passedQa: false,
            });
            failureCount++;
        }

        // Small delay between items to avoid rate limiting
        if (i < options.items.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Final progress report
    options.onProgress?.(options.items.length, options.items.length, 'complete');

    return {
        results,
        successCount,
        failureCount,
        totalDurationMs: Date.now() - startTime,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED EDIT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Add an element to an image
 */
export async function addElement(
    sourceImage: { base64: string; mimeType: string },
    element: string,
    location: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'background',
    options?: Partial<EditImageOptions>
): Promise<EditImageResult> {
    const locationDescriptions: Record<string, string> = {
        center: 'in the center of the image',
        top: 'at the top of the image',
        bottom: 'at the bottom of the image',
        left: 'on the left side of the image',
        right: 'on the right side of the image',
        background: 'in the background of the image',
    };

    return editImage({
        sourceImage,
        editPrompt: `Add ${element} ${locationDescriptions[location]}. Ensure it blends with the existing art style.`,
        ...options,
    });
}

/**
 * Remove an element from an image
 */
export async function removeElement(
    sourceImage: { base64: string; mimeType: string },
    element: string,
    options?: Partial<EditImageOptions>
): Promise<EditImageResult> {
    return editImage({
        sourceImage,
        editPrompt: `Remove ${element} from the image. Fill the space naturally to match the surrounding area.`,
        ...options,
    });
}

/**
 * Modify an existing element
 */
export async function modifyElement(
    sourceImage: { base64: string; mimeType: string },
    element: string,
    modification: string,
    options?: Partial<EditImageOptions>
): Promise<EditImageResult> {
    return editImage({
        sourceImage,
        editPrompt: `Modify ${element} to ${modification}. Preserve the overall style and surrounding elements.`,
        ...options,
    });
}

/**
 * Simplify an image (reduce complexity)
 */
export async function simplifyImage(
    sourceImage: { base64: string; mimeType: string },
    targetLevel: 'slightly' | 'moderately' | 'significantly',
    options?: Partial<EditImageOptions>
): Promise<EditImageResult> {
    const simplificationDescriptions: Record<string, string> = {
        slightly: 'Remove minor details and small decorative elements. Keep main subjects intact.',
        moderately: 'Simplify complex areas, merge small regions, remove background clutter.',
        significantly: 'Reduce to essential shapes only. Remove most details, keeping only the core subject recognizable.',
    };

    return editImage({
        sourceImage,
        editPrompt: `Simplify this image: ${simplificationDescriptions[targetLevel]} Maintain line art quality.`,
        ...options,
    });
}

/**
 * Fix common issues in a coloring page
 */
export async function fixColoringPageIssues(
    sourceImage: { base64: string; mimeType: string },
    issues: ('open_paths' | 'grey_areas' | 'too_detailed' | 'unbalanced')[],
    options?: Partial<EditImageOptions>
): Promise<EditImageResult> {
    const issueInstructions: Record<string, string> = {
        open_paths: 'Close all open paths and gaps in outlines.',
        grey_areas: 'Convert any grey areas to pure black lines or remove them entirely.',
        too_detailed: 'Simplify overly detailed areas by merging small regions.',
        unbalanced: 'Improve composition balance by adjusting element placement.',
    };

    const instructions = issues.map(issue => issueInstructions[issue]).join(' ');

    return editImage({
        sourceImage,
        editPrompt: `Fix these issues in the coloring page: ${instructions}`,
        ...options,
    });
}
