/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REPLICATE CLIENT — Flux Coloring Book LoRA Integration
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Generate coloring book pages using Flux Dev + Coloring Book LoRA via Replicate.
 * Used for the Swift tier (faster, purpose-built for coloring pages).
 *
 * MODEL: black-forest-labs/flux-dev-lora + prithivMLmods/Coloring-Book-Flux-LoRA
 * COST: ~$0.025/image
 *
 * OPTIMIZATION NOTES:
 * - lora_scale 0.9: Strong coloring book style enforcement
 * - guidance_scale 4.0: High prompt adherence for clean lines
 * - go_fast: true: Replicate's fp8 quantization for 2x speed
 * - Trigger word "c0l0ringb00k" activates the LoRA style
 * - Explicit "white background" prevents grey artifacts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Logger } from '../../lib/logger';
import { GoogleGenAI } from '@google/genai';
import type { 
    StyleId, 
    ComplexityId, 
    AudienceId, 
    ImageSize,
    GenerateImageRequest,
    GenerateImageResult,
    EnhancePromptRequest,
    EnhancePromptResult,
} from './gemini-client';

// Re-export types for convenience
export type { StyleId, ComplexityId, AudienceId, ImageSize, GenerateImageRequest, GenerateImageResult };

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ReplicatePrediction {
    id: string;
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    output?: string | string[];
    error?: string;
    urls: {
        get: string;
        cancel: string;
    };
}

interface ReplicateErrorResponse {
    detail?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const REPLICATE_MODEL = 'black-forest-labs/flux-dev-lora';
export const COLORING_BOOK_LORA = 'prithivMLmods/Coloring-Book-Flux-LoRA';

// Gemini Flash model for enhancement
const GEMINI_FLASH_MODEL = 'gemini-2.0-flash';

// ═══════════════════════════════════════════════════════════════════════════════
// FLUX-OPTIMIZED PROMPT ENHANCER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * System prompt for Flux LoRA enhancement
 * 
 * KEY DIFFERENCES from Gemini enhancer:
 * - MAX 30 words (LoRA prefers concise)
 * - Subject-focused only (LoRA handles style)
 * - No color words (coloring book)
 * - No style descriptors (LoRA is already trained)
 */
const FLUX_ENHANCER_SYSTEM_PROMPT = `You expand simple ideas into brief visual descriptions for a coloring book image generator.

RULES:
1. Output ONLY 20-30 words maximum
2. Describe the SUBJECT and COMPOSITION only
3. NO colors, NO shading words, NO style descriptors
4. Focus on: pose, expression, setting, objects, spatial arrangement
5. Keep it simple and specific

Example:
Input: "cat"
Output: "fluffy cat sitting on a cushion, looking curious, tail curled, whiskers prominent, cozy living room background with window"

Input: "dragon"
Output: "fierce dragon with spread wings perched on mountain peak, long tail wrapped around rocks, clouds below"`;

/**
 * Enhance a prompt specifically for Flux Coloring Book LoRA
 * 
 * Lightweight enhancement that expands subject detail without
 * adding style verbosity that conflicts with the LoRA training.
 */
export const enhancePromptForFlux = async (
    request: EnhancePromptRequest
): Promise<EnhancePromptResult> => {
    const { userPrompt, apiKey, signal } = request;

    if (signal?.aborted) {
        throw new Error('Aborted');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: GEMINI_FLASH_MODEL,
            contents: `Expand this into a brief visual description (20-30 words max): "${userPrompt}"`,
            config: {
                systemInstruction: FLUX_ENHANCER_SYSTEM_PROMPT,
                temperature: 0.7,
                maxOutputTokens: 100, // Keep it short
            } as any,
        });

        if (signal?.aborted) {
            throw new Error('Aborted');
        }

        let enhancedPrompt = response.text?.trim() || userPrompt;

        // Strip any color words that slipped through
        const colorBlocklist = /\b(red|blue|green|yellow|purple|orange|pink|brown|colored|colorful|shading|shaded|gradient|vibrant|bright|dark|light)\b/gi;
        enhancedPrompt = enhancedPrompt.replace(colorBlocklist, '').replace(/\s+/g, ' ').trim();

        // Enforce max length (~40 words as safety)
        const words = enhancedPrompt.split(/\s+/);
        if (words.length > 40) {
            enhancedPrompt = words.slice(0, 40).join(' ');
        }

        return {
            success: true,
            enhancedPrompt,
        };

    } catch (error: any) {
        if (error.message === 'Aborted') {
            throw error;
        }

        return {
            success: false,
            enhancedPrompt: userPrompt, // Fallback to original
            error: error.message,
        };
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE MAPPING (Natural language for Flux - matches subject matter)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Style keywords describe the SUBJECT'S artistic treatment, not "coloring book style"
 * (the LoRA handles that). These add character/mood to the drawing.
 */
const STYLE_DESCRIPTORS: Record<StyleId, string> = {
    'Cozy': 'cozy and warm with soft rounded shapes',
    'Kawaii': 'cute Japanese kawaii style with large expressive eyes and small body',
    'Whimsical': 'whimsical fairy tale illustration style',
    'Cartoon': 'classic cartoon style with exaggerated features',
    'Botanical': 'precise botanical scientific illustration',
    'Realistic': 'realistic proportions with fine engraving-style linework',
    'Geometric': 'geometric low-poly faceted design',
    'Fantasy': 'epic fantasy style with heroic dramatic pose',
    'Gothic': 'ornate gothic style with architectural flourishes',
    'StainedGlass': 'stained glass design with bold dividing lines',
    'Mandala': 'symmetrical mandala pattern with sacred geometry',
    'Zentangle': 'zentangle pattern-filled silhouette',
};

/**
 * Complexity controls the LINE ART STYLE - this is what the LoRA responds to
 * Based on official HuggingFace examples:
 * - "simple line art" for simple
 * - "detailed pencil sketch" for complex
 */
const COMPLEXITY_ART_STYLE: Record<ComplexityId, string> = {
    'Very Simple': 'very simple line art, bold thick outlines, minimal details, large shapes',
    'Simple': 'simple clean line art, clear outlines, easy to color',
    'Moderate': 'line art with moderate detail, balanced composition',
    'Intricate': 'detailed pencil sketch, intricate linework, many small sections',
    'Extreme Detail': 'highly detailed pencil sketch, intricate textures, fine detailed linework, expert level',
};

/**
 * Audience adds age-appropriate subject treatment
 */
const AUDIENCE_TREATMENT: Record<AudienceId, string> = {
    'toddlers': 'friendly and approachable, extra simple shapes',
    'preschool': 'cute and friendly, chunky shapes',
    'kids': 'fun and engaging, playful details',
    'teens': 'cool and stylish, dynamic composition',
    'adults': 'sophisticated and refined, intricate patterns',
    'seniors': 'nostalgic and calming, clear distinct sections',
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER (Research-Optimized for Flux + Coloring Book LoRA)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a prompt following official HuggingFace examples:
 * 
 * Official format: "Coloring Book, A [descriptor] [art style] of [subject], [details]."
 * 
 * Examples from HuggingFace:
 * - "Coloring Book, A black and white drawing of a truck, simple line art, high contrast."
 * - "Coloring Book, A black and white pencil sketch of a fox, detailed textures."
 * 
 * Key insights from research:
 * 1. Trigger word "Coloring Book" (proper case, two words)
 * 2. Natural language full sentences work best
 * 3. "simple line art" vs "detailed pencil sketch" controls complexity
 * 4. Order: Subject → Action → Style → Complexity → Details
 * 5. 30-80 words is optimal length
 */
const buildPrompt = (
    userPrompt: string,
    styleId: StyleId,
    complexityId: ComplexityId,
    audienceId: AudienceId,
): string => {
    const styleDescriptor = STYLE_DESCRIPTORS[styleId] || '';
    const complexityArtStyle = COMPLEXITY_ART_STYLE[complexityId];
    const audienceTreatment = AUDIENCE_TREATMENT[audienceId];

    // Build natural language sentence following official examples
    // Format: "Coloring Book, A black and white [art style] of [subject], [style], [audience], [technical]."
    return `Coloring Book, A black and white ${complexityArtStyle} of ${userPrompt}, ${styleDescriptor}, ${audienceTreatment}, high contrast, white background, no shading, no grey tones, clean closed outlines ready for coloring.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a coloring book page using Flux + Coloring Book LoRA via Replicate
 */
export const generateColoringPage = async (
    request: GenerateImageRequest,
    replicateApiToken: string
): Promise<GenerateImageResult> => {
    const startTime = Date.now();
    const requestId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const {
        userPrompt,
        styleId,
        complexityId,
        audienceId,
        aspectRatio = '1:1',
        imageSize = '1K',
        signal,
        enableLogging = false,
    } = request;

    if (signal?.aborted) {
        throw new Error('Aborted');
    }

    // Build prompt with trigger word
    const prompt = buildPrompt(userPrompt, styleId, complexityId, audienceId);

    if (enableLogging) {
        Logger.info('AI', `[${requestId}] Replicate: Generating with Flux Coloring Book LoRA`);
        Logger.debug('AI', `[${requestId}] Prompt (${prompt.length} chars)`, { styleId, complexityId });
    }

    try {
        // Map aspect ratio to Replicate format
        let replicateAspectRatio = aspectRatio;
        if (aspectRatio === '17:22' || aspectRatio === '210:297') {
            replicateAspectRatio = '3:4';
        }

        // Create prediction via Replicate API (Flux Dev LoRA)
        const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${replicateApiToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'wait', // Wait for result instead of polling
            },
            body: JSON.stringify({
                model: REPLICATE_MODEL,
                input: {
                    prompt,
                    hf_lora: COLORING_BOOK_LORA,       // Load coloring book LoRA from HuggingFace
                    lora_scale: 0.9,                    // Strong style enforcement
                    aspect_ratio: replicateAspectRatio,
                    output_format: 'png',
                    num_outputs: 1,
                    guidance_scale: 4.0,                // High prompt adherence for clean lines
                    num_inference_steps: 28,            // Quality/speed balance
                    go_fast: true,                      // Replicate's fp8 optimization (2x speed)
                },
            }),
            signal,
        });

        if (!createResponse.ok) {
            const errorData: ReplicateErrorResponse = await createResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || `Replicate API error: ${createResponse.status}`);
        }

        let prediction: ReplicatePrediction = await createResponse.json();

        // If prediction is still processing, poll for completion
        while (prediction.status === 'starting' || prediction.status === 'processing') {
            if (signal?.aborted) {
                throw new Error('Aborted');
            }

            // Wait before polling
            await new Promise(resolve => setTimeout(resolve, 1000));

            const pollResponse = await fetch(prediction.urls.get, {
                headers: {
                    'Authorization': `Bearer ${replicateApiToken}`,
                },
                signal,
            });

            if (!pollResponse.ok) {
                throw new Error(`Polling failed: ${pollResponse.status}`);
            }

            prediction = await pollResponse.json() as ReplicatePrediction;
        }

        if (prediction.status === 'failed') {
            throw new Error(prediction.error || 'Generation failed');
        }

        if (prediction.status === 'canceled') {
            throw new Error('Generation was canceled');
        }

        // Extract image URL from output
        const outputUrl = Array.isArray(prediction.output) 
            ? prediction.output[0] 
            : prediction.output;

        if (!outputUrl) {
            return {
                success: false,
                imageUrl: null,
                error: 'No image in response',
                promptUsed: prompt,
                durationMs: Date.now() - startTime,
                metadata: { requestId, model: REPLICATE_MODEL, imageSize, aspectRatio },
            };
        }

        // Fetch the image and convert to data URL
        const imageResponse = await fetch(outputUrl, { signal });
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
        }

        const imageBlob = await imageResponse.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        const imageUrl = `data:image/png;base64,${base64}`;

        if (enableLogging) {
            Logger.info('AI', `[${requestId}] Replicate: Generated in ${Date.now() - startTime}ms`);
        }

        return {
            success: true,
            imageUrl,
            promptUsed: prompt,
            durationMs: Date.now() - startTime,
            metadata: { requestId, model: REPLICATE_MODEL, imageSize, aspectRatio },
        };

    } catch (error: any) {
        if (error.message === 'Aborted') {
            throw error;
        }

        const errorMessage = error.message || 'Unknown error';

        if (enableLogging) {
            Logger.error('AI', `[${requestId}] Replicate: Failed`, { error: errorMessage });
        }

        return {
            success: false,
            imageUrl: null,
            error: errorMessage,
            promptUsed: prompt,
            durationMs: Date.now() - startTime,
            metadata: { requestId, model: REPLICATE_MODEL, imageSize, aspectRatio },
        };
    }
};
