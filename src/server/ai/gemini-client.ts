/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GEMINI CLIENT v3.0 — Optimized for Gemini 3 Pro Image (Nano Banana Pro)
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * KEY CHANGES FROM v2:
 * 
 * 1. REMOVED negative_prompt parameter (deprecated in Imagen 3+)
 * 2. All constraints now embedded IN the main prompt at the END
 * 3. Prompt structure follows Google's Gemini 3 recommendations
 * 4. Temperature kept at 1.0 (Google recommended for Gemini 3)
 * 5. Added support for 1K/2K/4K resolution selection
 *
 * ARCHITECTURE:
 * - Text Planning: Gemini 2.0 Flash (Dev Mode)
 * - Image Generation: Gemini 3 Pro Image (Nano Banana Pro)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { Logger } from '../../lib/logger';

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Text model for planning/enhancement */
export const GEMINI_TEXT_MODEL = 'gemini-2.0-flash-exp';

/** Image generation model */
export const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview';
export const GEMINI_FLASH_MODEL = 'gemini-2.0-flash-exp';

/** Alias for clarity */
export const NANO_BANANA_PRO = GEMINI_IMAGE_MODEL;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type StyleId =
  | 'Cozy Hand-Drawn'
  | 'Bold & Easy'
  | 'Kawaii'
  | 'Whimsical'
  | 'Cartoon'
  | 'Botanical'
  | 'Realistic'
  | 'Geometric'
  | 'Fantasy'
  | 'Gothic'
  | 'Mandala'
  | 'Zentangle';

export type ComplexityId =
  | 'Very Simple'
  | 'Simple'
  | 'Moderate'
  | 'Intricate'
  | 'Extreme Detail';

export type AudienceId =
  | 'toddlers'
  | 'preschool'
  | 'kids'
  | 'teens'
  | 'adults'
  | 'seniors';

export type ImageSize = '1K' | '2K' | '4K';

export interface GenerateImageRequest {
  /** User's scene description */
  userPrompt: string;
  /** Visual style */
  styleId: StyleId;
  /** Complexity level */
  complexityId: ComplexityId;
  /** Target audience */
  audienceId: AudienceId;
  /** Aspect ratio (e.g., '1:1', '3:4', '4:3', '9:16', '16:9') */
  aspectRatio?: string;
  /** Output resolution */
  imageSize?: ImageSize;
  /** API key */
  apiKey: string;
  /** Abort signal */
  signal?: AbortSignal;
  /** Enable verbose logging */
  enableLogging?: boolean;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl: string | null;
  error?: string;
  promptUsed: string;
  durationMs: number;
  metadata: {
    requestId: string;
    model: string;
    imageSize: ImageSize;
    aspectRatio: string;
  };
}

export interface EnhancePromptRequest {
  /** User's basic prompt */
  userPrompt: string;
  /** Visual style for context */
  styleId: StyleId;
  /** Complexity for detail guidance */
  complexityId: ComplexityId;
  /** Audience for tone */
  audienceId: AudienceId;
  /** API key */
  apiKey: string;
  /** Abort signal */
  signal?: AbortSignal;
}

export interface EnhancePromptResult {
  success: boolean;
  enhancedPrompt: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface StyleSpec {
  styleKeyword: string;
  positiveDescription: string;
  lineWeight: string;
  visualRequirements: string[];
}

const STYLE_SPECS: Record<StyleId, StyleSpec> = {
  'Cozy Hand-Drawn': {
    styleKeyword: 'hand-drawn coloring book illustration',
    positiveDescription: 'warm inviting hand-drawn style with organic slightly wobbly lines suggesting handmade charm',
    lineWeight: 'medium weight lines (0.5-1mm) consistent throughout',
    visualRequirements: [
      'Clean outlined shapes only',
      'Rounded corners on all objects',
      'Every shape is a closed colorable region',
      'Texture shown through shape variety not line patterns',
    ],
  },
  'Bold & Easy': {
    styleKeyword: 'simple bold outline coloring page',
    positiveDescription: 'extremely simple bold-line coloring page with sticker-like aesthetic',
    lineWeight: 'very thick uniform lines (4mm minimum)',
    visualRequirements: [
      'Maximum 30 large colorable regions',
      'Thick bold outlines only',
      'Large simple shapes',
      'Absolutely no fine details',
    ],
  },
  'Kawaii': {
    styleKeyword: 'kawaii cute coloring page',
    positiveDescription: 'adorable kawaii style with chibi proportions and soft rounded shapes',
    lineWeight: 'thick smooth lines (3mm)',
    visualRequirements: [
      'All corners rounded with no sharp angles',
      'Large heads small bodies (chibi proportions)',
      'Friendly smiling expressions',
      'Soft bubble-like shapes',
    ],
  },
  'Whimsical': {
    styleKeyword: 'whimsical fairy tale coloring book illustration',
    positiveDescription: 'dreamy whimsical style with flowing graceful lines and fairy-tale proportions',
    lineWeight: 'variable flowing lines (0.5-1.5mm)',
    visualRequirements: [
      'Flowing curved lines',
      'Elongated elegant proportions',
      'Magical fairy-tale atmosphere',
      'Sparkles as outlined star shapes not dots',
    ],
  },
  'Cartoon': {
    styleKeyword: 'cartoon coloring book page',
    positiveDescription: 'clean dynamic cartoon style with bold outlines and expressive poses',
    lineWeight: 'bold outlines (1.5-2mm) with thinner internal lines (0.5mm)',
    visualRequirements: [
      'Clear silhouettes',
      'Expressive character poses',
      'Strong line hierarchy',
      'Clean professional outlines',
    ],
  },
  'Botanical': {
    styleKeyword: 'botanical illustration coloring page',
    positiveDescription: 'scientific botanical illustration style with precise fine linework',
    lineWeight: 'fine precise lines (0.3-0.5mm)',
    visualRequirements: [
      'Accurate plant anatomy',
      'Fine detailed linework',
      'Each petal and leaf is a closed shape',
      'Clean scientific illustration style',
    ],
  },
  'Realistic': {
    styleKeyword: 'realistic line art coloring page Ligne Claire style',
    positiveDescription: 'realistic proportions in clean uniform line art',
    lineWeight: 'uniform lines throughout (0.6mm)',
    visualRequirements: [
      'Accurate realistic proportions',
      'Uniform line weight with no variation',
      'Clean contour lines only',
      'No sketchy or loose lines',
    ],
  },
  'Geometric': {
    styleKeyword: 'geometric low-poly coloring page',
    positiveDescription: 'geometric faceted style using ONLY straight lines with polygonal construction',
    lineWeight: 'uniform straight lines (0.8mm)',
    visualRequirements: [
      'ONLY straight lines with absolutely no curves',
      'All shapes are polygons',
      'Faceted crystalline aesthetic',
      'Low-poly tessellated construction',
    ],
  },
  'Fantasy': {
    styleKeyword: 'fantasy coloring book illustration',
    positiveDescription: 'epic fantasy illustration style with dramatic compositions',
    lineWeight: 'varied dramatic lines (0.5-2mm)',
    visualRequirements: [
      'Epic dramatic compositions',
      'Detailed fantasy elements',
      'Clear outlined regions',
      'Rich imaginative details',
    ],
  },
  'Gothic': {
    styleKeyword: 'gothic dark art coloring page',
    positiveDescription: 'elegant gothic style with ornate details and dramatic atmosphere',
    lineWeight: 'fine to medium varied lines',
    visualRequirements: [
      'Ornate decorative details',
      'Gothic architectural elements',
      'Dramatic atmospheric composition',
      'Intricate pattern work as outlined shapes',
    ],
  },
  'Mandala': {
    styleKeyword: 'mandala coloring page',
    positiveDescription: 'circular symmetrical mandala with repeating geometric patterns',
    lineWeight: 'fine uniform lines (0.5mm)',
    visualRequirements: [
      'Perfect circular symmetry',
      'Repeating radial patterns',
      'Geometric precision',
      'Meditative balanced design',
    ],
  },
  'Zentangle': {
    styleKeyword: 'zentangle pattern coloring page',
    positiveDescription: 'zentangle-inspired art with structured repetitive patterns',
    lineWeight: 'fine uniform lines (0.5mm)',
    visualRequirements: [
      'Structured repeating patterns',
      'Defined pattern boundaries',
      'Meditative repetitive elements',
      'Clean precise linework',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLEXITY SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface ComplexitySpec {
  regionRange: string;
  backgroundRule: string;
  restAreaRule: string;
  detailLevel: string;
}

const COMPLEXITY_SPECS: Record<ComplexityId, ComplexitySpec> = {
  'Very Simple': {
    regionRange: '3-8 large colorable regions',
    backgroundRule: 'Pure white background with no background elements',
    restAreaRule: 'Entire background is white space',
    detailLevel: 'Single iconic subject with minimal internal detail',
  },
  'Simple': {
    regionRange: '10-25 colorable regions',
    backgroundRule: 'Minimal background with simple ground line or basic element',
    restAreaRule: 'At least 50% white space',
    detailLevel: 'Main subject with 1-2 supporting elements',
  },
  'Moderate': {
    regionRange: '40-80 colorable regions',
    backgroundRule: 'Full scene with foreground midground and background',
    restAreaRule: 'Include 4-6 clear white space rest areas covering minimum 15% of image',
    detailLevel: 'Complete scene with balanced detail distribution',
  },
  'Intricate': {
    regionRange: '80-120 colorable regions',
    backgroundRule: 'Detailed environment throughout',
    restAreaRule: 'Include 2-4 rest areas covering minimum 10% of image',
    detailLevel: 'Rich detailed scene with patterns as shapes',
  },
  'Extreme Detail': {
    regionRange: '120-150+ colorable regions',
    backgroundRule: 'Maximum detail throughout',
    restAreaRule: 'Include 2-3 small rest areas for visual relief',
    detailLevel: 'Expert-level complexity with shapes within shapes',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIENCE SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface AudienceSpec {
  maxComplexity: ComplexityId;
  contentGuidance: string;
}

const AUDIENCE_SPECS: Record<AudienceId, AudienceSpec> = {
  'toddlers': {
    maxComplexity: 'Very Simple',
    contentGuidance: 'Single friendly recognizable object, extremely simple, no scary elements',
  },
  'preschool': {
    maxComplexity: 'Simple',
    contentGuidance: 'Friendly characters and simple scenes, educational themes welcome',
  },
  'kids': {
    maxComplexity: 'Moderate',
    contentGuidance: 'Fun engaging scenes, adventure themes, appropriate for ages 6-12',
  },
  'teens': {
    maxComplexity: 'Intricate',
    contentGuidance: 'Stylish dynamic scenes for ages 13-17',
  },
  'adults': {
    maxComplexity: 'Extreme Detail',
    contentGuidance: 'Sophisticated artistic designs for relaxation',
  },
  'seniors': {
    maxComplexity: 'Moderate',
    contentGuidance: 'Clear visible designs, nostalgic themes, avoid tiny details',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a prompt optimized for Gemini 3 Pro Image
 * 
 * STRUCTURE (per Google's Gemini 3 recommendations):
 * 1. Style keyword + positive description (what we want)
 * 2. Scene description (user content)
 * 3. Technical specifications
 * 4. CRITICAL CONSTRAINTS AT THE END (most important!)
 */
const buildPrompt = (
  userPrompt: string,
  styleId: StyleId,
  complexityId: ComplexityId,
  audienceId: AudienceId
): { prompt: string; effectiveComplexity: ComplexityId } => {

  const styleSpec = STYLE_SPECS[styleId];
  const audienceSpec = AUDIENCE_SPECS[audienceId];

  // Check complexity against audience max
  const complexityOrder: ComplexityId[] = ['Very Simple', 'Simple', 'Moderate', 'Intricate', 'Extreme Detail'];
  const requestedIdx = complexityOrder.indexOf(complexityId);
  const maxIdx = complexityOrder.indexOf(audienceSpec.maxComplexity);

  const effectiveComplexity = requestedIdx > maxIdx ? audienceSpec.maxComplexity : complexityId;
  const complexitySpec = COMPLEXITY_SPECS[effectiveComplexity];

  // Build the prompt with constraints at END (Gemini 3 requirement)
  const prompt = `
A high-quality ${styleSpec.styleKeyword}, ${styleSpec.positiveDescription}.

SCENE: ${userPrompt}

STYLE: ${styleSpec.lineWeight}. ${styleSpec.visualRequirements.join('. ')}.

COMPOSITION: ${complexitySpec.regionRange}. ${complexitySpec.backgroundRule}. ${complexitySpec.restAreaRule}. ${complexitySpec.detailLevel}. PRINT MARGINS: Keep main subjects within the CENTER 85% of the canvas, leaving at least 7% margin on all edges for print safety.

OUTPUT: A single high-contrast black and white coloring book page. Pure black lines on pure white background. Every area is a closed shape that can be colored in.

CRITICAL REQUIREMENTS - COLORING BOOK PAGE:

1. COLORS: Pure black lines on pure white ONLY. Zero grey. Zero gradients. Zero shading. Zero tints.

2. LINES: Clean outlines only. Zero stippling (no dots). Zero hatching (no parallel shading lines). Zero cross-hatching. Zero sketchy lines. Zero decorative texture strokes.

3. TEXTURE AS SHAPES: Fur and hair as enclosed sections not strands. Fabric as outlined shapes not texture lines. Water as enclosed wave shapes not wavy lines. Wood as outlined planks not grain lines.

4. CLOSED REGIONS: Every area is a closed shape. All lines connect. No gaps. No open paths.

5. NO FILLS: Zero solid black areas. Pupils are outlined circles. Dark areas are empty regions.

6. SINGLE IMAGE: One illustration filling canvas. Not a mockup. Not multiple images. Not a photo of paper.
`.trim();

  return { prompt, effectiveComplexity };
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a coloring book page using Gemini 3 Pro Image
 */
export const generateColoringPage = async (
  request: GenerateImageRequest
): Promise<GenerateImageResult> => {
  const startTime = Date.now();
  const requestId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const {
    userPrompt,
    styleId,
    complexityId,
    audienceId,
    aspectRatio = '1:1',
    imageSize = '2K',
    apiKey,
    signal,
    enableLogging = false,
  } = request;

  // Check abort
  if (signal?.aborted) {
    throw new Error('Aborted');
  }

  // Build prompt
  const { prompt, effectiveComplexity } = buildPrompt(userPrompt, styleId, complexityId, audienceId);

  if (enableLogging) {
    Logger.info('AI', `[${requestId}] Generating with prompt (${prompt.length} chars)`);
    Logger.debug('AI', `[${requestId}] Params`, { styleId, effectiveComplexity, imageSize });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Call Gemini 3 Pro Image
    // NOTE: No negative_prompt - it's deprecated in Imagen 3+
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: prompt,
      config: {
        // Google recommends temperature 1.0 for Gemini 3
        temperature: 1.0,
        // Image generation config
        responseModalities: ['image', 'text'],
        // Safety: Prevent false positives on line art
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
        // Image size (must be uppercase K)
        ...(imageSize && { imageSize }),
      },
    });

    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    // Extract image from response
    let imageUrl: string | null = null;

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      return {
        success: false,
        imageUrl: null,
        error: 'No image generated in response',
        promptUsed: prompt,
        durationMs: Date.now() - startTime,
        metadata: { requestId, model: GEMINI_IMAGE_MODEL, imageSize, aspectRatio },
      };
    }

    if (enableLogging) {
      Logger.info('AI', `[${requestId}] Generated successfully in ${Date.now() - startTime}ms`);
    }

    return {
      success: true,
      imageUrl,
      promptUsed: prompt,
      durationMs: Date.now() - startTime,
      metadata: { requestId, model: GEMINI_IMAGE_MODEL, imageSize, aspectRatio },
    };

  } catch (error: any) {
    if (error.message === 'Aborted') {
      throw error;
    }

    const errorMessage = error.message || 'Unknown error';

    if (enableLogging) {
      Logger.error('AI', `[${requestId}] Generation failed`, { error: errorMessage });
    }

    return {
      success: false,
      imageUrl: null,
      error: errorMessage,
      promptUsed: prompt,
      durationMs: Date.now() - startTime,
      metadata: { requestId, model: GEMINI_IMAGE_MODEL, imageSize, aspectRatio },
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT ENHANCEMENT (Using Gemini 1.5 Pro)
// ═══════════════════════════════════════════════════════════════════════════════

const ENHANCER_SYSTEM_PROMPT = `
You are a coloring book prompt engineer. Expand the user's basic idea into a detailed scene description for AI image generation.

RULES:
1. Keep output under 80 words
2. Focus on VISUAL elements (shapes, objects, composition)
3. Describe what IS there, not what isn't
4. Include composition guidance (foreground, background, focal point)
5. Add details that create interesting colorable regions
6. Do NOT mention colors, shading, textures, or technical instructions
7. Write as a single flowing description

OUTPUT: Just the enhanced scene description, nothing else.
`;

/**
 * Enhance a user's basic prompt using Gemini 1.5 Pro
 */
export const enhancePrompt = async (
  request: EnhancePromptRequest
): Promise<EnhancePromptResult> => {
  const { userPrompt, styleId, complexityId, audienceId, apiKey, signal } = request;

  if (signal?.aborted) {
    throw new Error('Aborted');
  }

  const styleSpec = STYLE_SPECS[styleId];
  const complexitySpec = COMPLEXITY_SPECS[complexityId];
  const audienceSpec = AUDIENCE_SPECS[audienceId];

  const userMessage = `
Style: ${styleSpec.styleKeyword}
Complexity: ${complexitySpec.detailLevel}
Audience: ${audienceSpec.contentGuidance}

User's idea: ${userPrompt}

Enhance this into a detailed scene description:
`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: GEMINI_FLASH_MODEL,
      contents: userMessage,
      config: {
        systemInstruction: ENHANCER_SYSTEM_PROMPT,
        temperature: 0.8,
        maxOutputTokens: 200,
      } as any,
    });

    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    let enhancedPrompt = response.text?.trim() || userPrompt;

    // ═══════════════════════════════════════════════════════════════════════════════
    // OPTIMIZATION: Color Safety Net (Gemini 2.0 Flash specific)
    // The new model is smarter but hallucinates colors. We strictly scrub them here.
    // ═══════════════════════════════════════════════════════════════════════════════
    const colorBlocklist = /\b(red|blue|green|yellow|purple|orange|pink|brown|colored|colorful|shading|shaded|gradient|tinted|hued)\b/gi;
    enhancedPrompt = enhancedPrompt.replace(colorBlocklist, '').replace(/\s+/g, ' ').trim();

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
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate with automatic prompt enhancement
 */
export const generateWithEnhancement = async (
  request: GenerateImageRequest
): Promise<GenerateImageResult> => {
  // First, enhance the prompt
  const enhanceResult = await enhancePrompt({
    userPrompt: request.userPrompt,
    styleId: request.styleId,
    complexityId: request.complexityId,
    audienceId: request.audienceId,
    apiKey: request.apiKey,
    signal: request.signal,
  });

  // Then generate with enhanced prompt
  return generateColoringPage({
    ...request,
    userPrompt: enhanceResult.enhancedPrompt,
  });
};

/**
 * Get the raw prompt that would be sent (for debugging)
 */
export const getPromptPreview = (
  userPrompt: string,
  styleId: StyleId,
  complexityId: ComplexityId,
  audienceId: AudienceId
): string => {
  const { prompt } = buildPrompt(userPrompt, styleId, complexityId, audienceId);
  return prompt;
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { STYLE_SPECS, COMPLEXITY_SPECS, AUDIENCE_SPECS };