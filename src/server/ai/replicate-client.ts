/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REPLICATE CLIENT — GPT Image 1.5 Integration
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Generate coloring book pages using OpenAI GPT Image 1.5 via Replicate.
 * Used for the Swift tier (superior instruction-following for coloring pages).
 *
 * MODEL: openai/gpt-image-1 (via Replicate pass-through)
 * COST: ~$0.02-0.07/image (billed to OpenAI account)
 *
 * KEY ADVANTAGES OF GPT IMAGE 1.5:
 * - Exceptional instruction following (treats REQUIREMENTS as hard constraints)
 * - Native text rendering accuracy
 * - No trigger words needed - responds to clear directives
 * - Multimodal input support for style references
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Logger } from '../../lib/logger';
import type { 
    StyleId, 
    ComplexityId, 
    AudienceId, 
    ImageSize,
    GenerateImageRequest,
    GenerateImageResult,
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

export const REPLICATE_MODEL = 'openai/gpt-image-1';

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE MAPPINGS (Instruction-Optimized for GPT Image 1.5)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Style descriptors optimized for GPT's instruction-following capability.
 * These are embedded as clear artistic direction, not trigger keywords.
 */
const STYLE_DESCRIPTORS: Record<StyleId, string> = {
    'Cozy': 'Bold and Easy style with EXTREMELY THICK uniform black marker outlines (2-3mm), simple blob-like cute rounded characters with dot eyes, LOW complexity, LARGE open coloring areas, minimal details, NO textures',
    'HandDrawn': 'Hand-drawn hygge style with ULTRA-THICK organic felt-tip marker outlines (2-3mm), cozy domestic lifestyle scenes featuring warm empowering characters in peaceful settings, organic hand-drawn wobble NOT sterile vectors, minimal details, LARGE colorable areas',
    'Intricate': 'Secret Garden style adult coloring art. ULTRA-FINE pen lines (0.1-0.5mm). Extremely detailed botanical patterns with individual leaf veins and flower stamens. VIGNETTE composition: concentrate dense detail in CENTER, fade to white edges. Pattern-within-pattern: recursive subdivision of forms. Include hidden seek-and-find elements (tiny keys, bees, butterflies). Minimum 150 enclosed colorable regions. Hand-drawn organic quality, NOT sterile vectors.',
    'Kawaii': 'Japanese kawaii style with chibi proportions (2-head ratio), large expressive eyes, stubby limbs, and soft "squircle" forms',
    'Whimsical': 'Fairy tale storybook illustration with curvilinear organic geometry and gentle flowing lines',
    'Cartoon': 'Classic Western animation style with squash-and-stretch dynamics, clear silhouettes, and rubber-hose limbs',
    'Botanical': 'Scientific botanical illustration with precise morphological accuracy and fine technical pen lines',
    'Realistic': 'Museum-quality steel engraving style with precise cross-hatching textures and anatomically accurate proportions',
    'Geometric': 'Low-poly geometric abstraction using ONLY straight lines, faceted crystalline forms, and polygon shapes',
    'Fantasy': 'Epic fantasy RPG concept art with heroic proportions (8-9 heads tall), dynamic poses, and 70/30 detail distribution',
    'Gothic': 'Ornate gothic style with stained glass motifs, architectural flourishes, and macabre elegance',
    'StainedGlass': 'Tiffany-style stained glass design with thick bold lead lines separating segmented colorable sections',
    'Mandala': 'Sacred geometry mandala with mathematically perfect radial symmetry and fractal tessellation patterns',
    'Zentangle': 'Zentangle-inspired art where the subject is a container filled with intricate tangle patterns (Flux, Paradox, Tipple)',
};

/**
 * Complexity maps to quality setting AND detail instructions.
 * GPT Image 1.5 respects these as hard constraints.
 */
const COMPLEXITY_SPECS: Record<ComplexityId, { quality: 'low' | 'medium' | 'high'; instruction: string }> = {
    'Very Simple': {
        quality: 'low',
        instruction: '3-8 large colorable regions only. Single iconic subject with minimum 10mm region sizes. Zero background elements. Maximum semantic clarity.',
    },
    'Simple': {
        quality: 'medium',
        instruction: '15-30 large colorable regions. Clear main subject focus with minimum 5mm region sizes. Essential context only in background.',
    },
    'Moderate': {
        quality: 'medium',
        instruction: '40-80 colorable regions. Complete scene with foreground, midground, and background. Minimum 3mm region sizes. Include 4-6 white space rest areas.',
    },
    'Intricate': {
        quality: 'high',
        instruction: '80-120 colorable regions. Rich detailed environment throughout. Minimum 2mm region sizes. Patterns rendered as distinct shapes.',
    },
    'Extreme Detail': {
        quality: 'high',
        instruction: '120-150+ colorable regions. Expert-level complexity with shapes-within-shapes. Minimum 1mm region sizes. 2-3 small rest areas for visual relief.',
    },
};

/**
 * Audience-appropriate content guidance.
 */
const AUDIENCE_SPECS: Record<AudienceId, string> = {
    'toddlers': 'Friendly, recognizable single object with zero background distractions. Extra simple shapes. No scary elements.',
    'preschool': 'Cute and friendly characters with chunky shapes. Simple scenes with clear definition.',
    'kids': 'Fun and engaging scenes with playful details. Adventure themes appropriate for ages 6-12.',
    'teens': 'Cool and stylish with dynamic composition. Appropriate for ages 13-17.',
    'adults': 'Sophisticated and refined with intricate patterns. Relaxation-focused designs.',
    'seniors': 'High clarity with distinct sections. Nostalgic themes. Avoid tiny details for dexterity.',
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHARACTER DNA INJECTION (for cross-page visual consistency)
// ═══════════════════════════════════════════════════════════════════════════════

interface CharacterDNAFragment {
    name: string;
    face: string;
    eyes: string;
    hair: string;
    body: string;
    outfitCanon: string;
}

/**
 * Convert CharacterDNA to a clear character description.
 */
const buildCharacterFragment = (dna: CharacterDNAFragment): string => {
    const parts = [];
    if (dna.name) parts.push(`Character "${dna.name}"`);
    if (dna.face) parts.push(`with ${dna.face}`);
    if (dna.eyes) parts.push(`${dna.eyes} eyes`);
    if (dna.hair) parts.push(`${dna.hair} hair`);
    if (dna.body) parts.push(`${dna.body} build`);
    if (dna.outfitCanon) parts.push(`wearing ${dna.outfitCanon}`);
    return parts.join(', ');
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER (Instruction-First Pattern for GPT Image 1.5)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a prompt optimized for GPT Image 1.5's instruction-following capability.
 * 
 * KEY INSIGHT: GPT Image 1.5 treats structured instructions as HARD CONSTRAINTS,
 * unlike diffusion models that "weigh" keywords. This allows for precise control.
 * 
 * STRUCTURE:
 * 1. TASK - Clear directive of what to create
 * 2. SUBJECT - The scene description (enhanced prompt) with explicit adherence guard
 * 3. STYLE - Artistic direction with optional style-specific boosts
 * 4. REQUIREMENTS - Hard constraints (treated as mandatory by GPT)
 * 5. FORBIDDEN - Explicit prohibitions (GPT respects these strongly)
 */
const buildPrompt = (
    userPrompt: string,
    styleId: StyleId,
    complexityId: ComplexityId,
    audienceId: AudienceId,
    characterDNA?: CharacterDNAFragment,
): string => {
    const styleDescriptor = STYLE_DESCRIPTORS[styleId];
    const complexitySpec = COMPLEXITY_SPECS[complexityId];
    const audienceSpec = AUDIENCE_SPECS[audienceId];

    // Inject character DNA if provided
    let subjectDescription = userPrompt;
    if (characterDNA && characterDNA.name) {
        const characterFragment = buildCharacterFragment(characterDNA);
        subjectDescription = `${characterFragment}. Scene: ${userPrompt}`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STYLE-SPECIFIC BOOSTS (Intricate style needs special detail instructions)
    // ═══════════════════════════════════════════════════════════════════════════
    const intricateBoost = styleId === 'Intricate' ? `

INTRICATE STYLE DIRECTIVES (FOLLOW PRECISELY):
• VIGNETTE COMPOSITION: Concentrate highest detail density in the CENTER of the canvas. Gradually simplify and fade details toward the EDGES, leaving white space margins.
• PATTERN-WITHIN-PATTERN: Every large shape (flowers, leaves, animals) must contain internal subdivision patterns. Do NOT leave large empty interior regions.
• HIDDEN DETAILS: Include 3-5 tiny "seek-and-find" elements scattered throughout (small keys, bees, butterflies, birds, ladybugs).
• RECURSIVE DETAIL: Render individual leaf veins, flower stamens, feather barbs, and petal textures. Each element should have interior linework.
• SYMMETRY: Use radial or bilateral symmetry for wreath and mandala arrangements where appropriate.
• LINE DENSITY: Lines should be as close as 0.5mm apart in the densest areas.` : '';

    // Style-specific requirements additions
    const intricateRequirements = styleId === 'Intricate' ? `
• ULTRA-FINE line weight (equivalent to 0.1-0.5mm technical pen)
• Minimum 150 enclosed colorable regions throughout the composition
• Vignette fade: Highest density in center, simplifying toward edges with white margin
• Every large shape must contain internal pattern subdivision` : '';

    // Build instruction-first prompt structure with enhanced adherence
    return `TASK: Create a printable black-and-white coloring book page.

═══════════════════════════════════════════════════════════════════════════════
SUBJECT (CRITICAL - Draw EXACTLY this, do NOT substitute):
═══════════════════════════════════════════════════════════════════════════════
${subjectDescription}

⚠️ SUBJECT ADHERENCE WARNING: You MUST draw the EXACT subject described above.
- If the subject says "sloths" → Draw SLOTHS, not cats or dogs
- If the subject says "forest" → Draw a FOREST, not a room
- If the subject says "beach" → Draw a BEACH, not an indoor scene
Do NOT replace, substitute, or "improve" the subject. Draw EXACTLY what is requested.
═══════════════════════════════════════════════════════════════════════════════

ARTISTIC STYLE: ${styleDescriptor}

TARGET AUDIENCE: ${audienceSpec}

COMPOSITION: ${complexitySpec.instruction}${intricateBoost}

═══════════════════════════════════════════════════════════════════════════════
REQUIREMENTS (MANDATORY - Follow these exactly):
═══════════════════════════════════════════════════════════════════════════════
• Pure black lines (#000000) on pure white background (#FFFFFF)
• Clean, continuous, closed-loop vector-quality lines
• Every shape must be fully enclosed and ready for coloring
• Sharp crisp edges with consistent line weight
• Centered composition with all main elements in the safe 85% zone
• Do NOT crop heads, feet, or important elements at the edges${intricateRequirements}

═══════════════════════════════════════════════════════════════════════════════
FORBIDDEN (Do NOT include any of the following):
═══════════════════════════════════════════════════════════════════════════════
• NO shading, shadows, gradients, or gray tones of any kind
• NO colors, tints, or fills
• NO pencil textures, smudges, or soft edges
• NO 3D rendering, photorealism, or ambient occlusion
• NO halftone dots, stippling, or cross-hatching fills
• NO incomplete, broken, or open line segments
• NO decorative props or objects not explicitly requested in the subject

FINAL OUTPUT: A clean black-and-white line art illustration suitable for printing and coloring with crayons or markers.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIZE MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Map aspect ratio to GPT Image 1.5 supported sizes.
 * Supported: 1024x1024, 1024x1536, 1536x1024
 */
const getGPTImageSize = (aspectRatio: string): string => {
    switch (aspectRatio) {
        case '3:4':
        case '17:22':
        case '210:297':
        case 'portrait':
        case 'letter':
        case 'a4':
            return '1024x1536'; // Portrait/tall
        case '4:3':
        case 'landscape':
            return '1536x1024'; // Landscape/wide
        case '1:1':
        case 'square':
        default:
            return '1024x1024'; // Square default
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a coloring book page using GPT Image 1.5 via Replicate.
 * 
 * NOTE: This is a "bring-your-own-token" model. The openaiApiKey parameter
 * is passed to Replicate, which forwards requests to OpenAI. Billing goes
 * directly to your OpenAI account.
 */
export const generateColoringPage = async (
    request: GenerateImageRequest,
    openaiApiKey: string
): Promise<GenerateImageResult> => {
    const startTime = Date.now();
    const requestId = `gpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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

    // Build instruction-first prompt
    const prompt = buildPrompt(userPrompt, styleId, complexityId, audienceId, request.characterDNA);

    // Map complexity to quality setting
    const complexitySpec = COMPLEXITY_SPECS[complexityId];
    const gptSize = getGPTImageSize(aspectRatio);

    // ALWAYS log prompt for debugging
    Logger.info('AI', `[${requestId}] 🎯 GPT IMAGE PROMPT (${prompt.length} chars): "${prompt.substring(0, 150)}..."`);
    
    if (enableLogging) {
        Logger.debug('AI', `[${requestId}] Full prompt`, { prompt, styleId, complexityId, gptSize, quality: complexitySpec.quality });
    }

    try {
        // Get Replicate API token from environment
        const replicateToken = (globalThis as any).process?.env?.REPLICATE_API_TOKEN || 
                               (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_REPLICATE_API_TOKEN : undefined);

        if (!replicateToken) {
            throw new Error('REPLICATE_API_TOKEN not configured');
        }

        // Create prediction via Replicate API
        const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${replicateToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'wait', // Wait for result instead of polling
                'X-Request-ID': requestId,
            },
            body: JSON.stringify({
                model: REPLICATE_MODEL,
                input: {
                    prompt,
                    size: gptSize,
                    quality: complexitySpec.quality,
                    background: 'opaque', // Always white background for coloring
                    moderation: 'auto', // Standard safety filtering
                    openai_api_key: openaiApiKey, // Required for GPT Image 1.5
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
                    'Authorization': `Bearer ${replicateToken}`,
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
            Logger.info('AI', `[${requestId}] GPT Image 1.5: Generated in ${Date.now() - startTime}ms`);
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
            Logger.error('AI', `[${requestId}] GPT Image 1.5: Failed`, { error: errorMessage });
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
