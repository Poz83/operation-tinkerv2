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

  | 'Cozy'
  | 'Kawaii'
  | 'Whimsical'
  | 'Cartoon'
  | 'Botanical'
  | 'Realistic'
  | 'Geometric'
  | 'Fantasy'
  | 'Gothic'
  | 'StainedGlass'
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

  'Cozy': {
    styleKeyword: 'Hygge cottagecore coloring page, Scandinavian sanctuary, cozy reading nook',
    positiveDescription: 'Warm organic style with chunky cable-knit textures, overstuffed armchairs, and steaming mugs. Variable line weight ink illustration.',
    lineWeight: 'variable organic lines (0.8-2mm) mimicking hand-drawn ink',
    visualRequirements: [
      'Role: Scandinavian lifestyle illustrator',
      'Geometry: Organic curves only, NO straight lines, soft rounded shapes',
      'Textures: Stylized cable-knit loops, flowing wood grain, botanical accents',
      'Subjects: Armchairs, blankets, candles, hot drinks, sleeping cats, plants',
      'Negative: NO shading, NO grayscale, NO minimalist, NO industrial, NO cold',
      'Light: Use negative space (white) to imply candlelight glow',
    ],
  },
  'Kawaii': {
    styleKeyword: 'Super Deformed Kawaii vector line art',
    positiveDescription: 'Japanese mascot style (Yuru-chara) with Kindchenschema proportions. 2-head ratio (large head, small body). Low set features',
    lineWeight: 'uniform monoline weight (thick marker style)',
    visualRequirements: [
      'Chibi 2-head proportions (Head = 50% of height)',
      'Low T-zone facial features (eyes/mouth on bottom 1/3)',
      'NO NOSES. Tiny mouth. Large shimmering eyes with catchlights',
      'Stubby nubs for limbs (NO elbows, NO knees, NO fingers)',
      'Soft "Squircle" geometry (all corners rounded)',
      'Floating filler elements (sparkles, hearts, stars)',
    ],
  },
  'Whimsical': {
    styleKeyword: 'Whimsical storybook illustration, style of Arthur Rackham and Alphonse Mucha',
    positiveDescription: 'Narrative surrealism with curvilinear organic geometry and scale distortion',
    lineWeight: 'variable flowing lines (Art Nouveau influence)',
    visualRequirements: [
      'Anthropomorphism (animals in clothes, active props)',
      'Scale distortion (tiny subjects made large)',
      'Curvilinear organic composition (no sharp angles)',
      'Narrative density (floating books, keys, lanterns)',
      'High contrast (pure black/white, no gray bleed)',
      'Wide shot / Full body (NO cropping of heads/feet)',
      'White background with subtle decorative framing',
    ],
  },
  'Cartoon': {
    styleKeyword: 'Western cartoon style, Saturday morning cartoon, Hanna-Barbera style',
    positiveDescription: 'classic Western animation style with squash and stretch dynamics, clear silhouettes, and rubber hose influence',
    lineWeight: 'thick uniform outlines (vector art style)',
    visualRequirements: [
      'Clear silhouettes (squint test)',
      'Rubbery "noodle" limbs (squash and stretch)',
      '4 fingers per hand, simple bean-shaped heads',
      'NO anime eyes, NO shading, NO realism',
    ],
  },
  'Botanical': {
    styleKeyword: 'Antique botanical illustration, scientific plate, Maria Sibylla Merian style',
    positiveDescription: 'Scientifically accurate line art with Ligne Claire aesthetic. Isolated on white.',
    lineWeight: 'fine 0.3mm technical pen lines',
    visualRequirements: [
      'Morphological accuracy (roots, seeds, leaves)',
      'Ligne Claire (clean unbroken lines)',
      'No cross-hatching or shading',
      'White space layout (no horror vacui)',
    ],
  },
  'Realistic': {
    styleKeyword: 'Scientific Illustration, 19th-century steel engraving, intaglio fine art',
    positiveDescription: 'museum-quality academic drawing with precise cross-hatching texture (Dürer style). High-contrast black ink on white.',
    lineWeight: 'variable width ink lines with crisp sharp edges',
    visualRequirements: [
      'Technique: Woodcut or Copperplate Engraving',
      'Anatomy: Biologically accurate proportions (Scientific Illustration standards)',
      'Texture: Defined by precise cross-hatching, NOT shading',
      'Anti-Grayscale: NO gray washes, NO pencil smudges, NO smooth gradients',
      'High-contrast binary black/white only',
    ],
  },
  'Geometric': {
    styleKeyword: 'geometric abstraction coloring page',
    positiveDescription: 'geometric faceted style using ONLY straight lines with sacred geometry influence',
    lineWeight: 'uniform straight lines (0.8mm)',
    visualRequirements: [
      'ONLY straight lines with absolutely no curves',
      'All shapes are polygons',
      'Faceted crystalline aesthetic',
      'Low-poly tessellated construction',
    ],
  },
  'Fantasy': {
    styleKeyword: 'Fantasy RPG Concept Art, Dungeons & Dragons Style, Vector Line Art',
    positiveDescription: 'Heroic proportions, dynamic action, clear silhouette. 70/30 Rule (30% focal detail, 70% open space).',
    lineWeight: 'Variable line weight (bold outer contours, fine inner details)',
    visualRequirements: [
      'Role: Professional Concept Artist',
      'Anatomy: Heroic scaling (8-9 heads tall), dynamic poses',
      'Detailing: 70/30 Rule - Intricate focal points (armor/faces), clean rest areas',
      'Negative: NO shading, NO cinematic lighting, NO ambient occlusion, NO greyscale',
      'Features: Distinct silhouette, knolling for inventory items',
    ],
  },
  'Gothic': {
    styleKeyword: 'gothic horror style line art',
    positiveDescription: 'elegant gothic style with stained glass motifs and macabre elegance',
    lineWeight: 'fine to medium varied lines',
    visualRequirements: [
      'Ornate decorative details',
      'Stained glass window outlines',
      'Dramatic atmospheric composition',
      'Intricate pattern work as outlined shapes',
    ],
  },
  'StainedGlass': {
    styleKeyword: 'Tiffany style stained glass coloring page',
    positiveDescription: 'thick leaded lines separating clear geometric and organic sections. bold segmented composition.',
    lineWeight: 'thick bold uniform lines (simulating lead cames)',
    visualRequirements: [
      'Thick outlines (lead lines) for all shapes',
      'Segmented composition (no gradients)',
      'Closed shapes (no open lines)',
      'High contrast black and white',
    ],
  },
  'Mandala': {
    styleKeyword: 'Sacred Geometry Mandala, Kaleidoscopic Fractal Pattern, Stained Glass style',
    positiveDescription: 'Mathematically perfect symmetry with closed-loop tessellation. Radial for patterns, Bilateral for animal totems.',
    lineWeight: 'precise vector lines (Adobe Illustrator style)',
    visualRequirements: [
      'Perfect Symmetry (Radial for patterns, Bilateral for subjects)',
      'Closed-loop topology (no open shapes)',
      'Fractal tessellation (self-similar geometry)',
      'Center-focused composition with white margins',
      'Stained glass style outlines (uncolored, black/white only)',
      'Vector definition (no pixelation or sketch artifacts)',
      'NO paper texture, NO noise, NO grunge',
      'NO humans, NO faces (prevent pareidolia)',
    ],
  },
  'Zentangle': {
    styleKeyword: 'Zentangle Inspired Art (ZIA), Certified Zentangle Teacher style, Micron 05 pen',
    positiveDescription: 'Pattern-filled silhouette technique. Subject acts as a container divided into segmented strings. Each segment filled with a unique tangle pattern (Flux, Paradox, Tipple).',
    lineWeight: 'Uniform monoline (Micron 05 style)',
    visualRequirements: [
      'Subject = Container for patterns',
      'Internal segmentation using "strings"',
      'Horror Vacui (fear of empty space)',
      'Specific Patterns: Teardrop leaves (Flux), Spiraling triangles (Paradox), Interlocking orbs (Tipple)',
      'No shading, No graphite smudge, No gradients',
    ],
  },
};

interface ComplexitySpec {
  regionRange: string;
  backgroundRule: string;
  restAreaRule: string;
  detailLevel: string;
}

const COMPLEXITY_SPECS: Record<ComplexityId, ComplexitySpec> = {
  'Very Simple': {
    regionRange: '3-8 large colorable regions',
    backgroundRule: 'Pure white background with ZERO background elements (isolated subject)',
    restAreaRule: 'Entire background is white space',
    detailLevel: 'Single iconic subject. Minimum region size 10mm+. No tiny details. High semantic clarity.',
  },
  'Simple': {
    regionRange: '15-30 large colorable regions',
    backgroundRule: 'Clear background with essential context only',
    restAreaRule: 'Balanced white space for visual clarity',
    detailLevel: 'Focus on main subject. Minimum region size 5mm. Strong clear outlines.',
  },
  'Moderate': {
    regionRange: '40-80 colorable regions',
    backgroundRule: 'Full scene with foreground midground and background',
    restAreaRule: 'Include 4-6 clear white space rest areas covering minimum 15% of image',
    detailLevel: 'Complete scene. Minimum region size 3mm. Balanced detail distribution.',
  },
  'Intricate': {
    regionRange: '80-120 colorable regions',
    backgroundRule: 'Detailed environment throughout',
    restAreaRule: 'Include 2-4 rest areas covering minimum 10% of image',
    detailLevel: 'Rich detailed scene. Minimum region size 2mm. Patterns as shapes.',
  },
  'Extreme Detail': {
    regionRange: '120-150+ colorable regions',
    backgroundRule: 'Maximum detail throughout',
    restAreaRule: 'Include 2-3 small rest areas for visual relief',
    detailLevel: 'Expert-level complexity. Minimum region size 1mm. Shapes within shapes.',
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
    contentGuidance: 'Single friendly recognizable object, high semantic clarity, zero background distraction, no scary elements',
  },
  'preschool': {
    maxComplexity: 'Simple',
    contentGuidance: 'Friendly characters, simple scenes, clear definition, educational themes welcome',
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
    contentGuidance: 'High clarity, distinct sections, nostalgic themes (vintage, classic), avoid tiny details for dexterity',
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
  audienceId: AudienceId,
  aspectRatio: string = '1:1'
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
  // FIX: Inject Audience Guidance, Aspect Ratio Layout, and specific framing

  // Specific framing guidance based on aspect ratio
  let framingGuidance = 'Full-bleed composition filling the entire canvas.';
  if (aspectRatio === '17:22' || aspectRatio === 'letter') {
    framingGuidance = 'Vertical portrait composition (8.5" x 11"). Tall aspect ratio (17:22). Fit full height. 8.5x11 inches.';
  } else if (aspectRatio === '210:297' || aspectRatio === 'a4') {
    framingGuidance = 'Vertical portrait composition (A4). Tall aspect ratio. Fit full height.';
  } else if (aspectRatio === '3:4' || aspectRatio === 'portrait') {
    framingGuidance = 'Vertical portrait composition (3:4). Tall aspect ratio. Fit full height.';
  } else if (aspectRatio === '4:3' || aspectRatio === 'landscape') {
    framingGuidance = 'Horizontal landscape composition. Wide aspect ratio.';
  } else if (aspectRatio === '1:1' || aspectRatio === 'square') {
    framingGuidance = 'Square composition (1:1). Balanced height and width.';
  }

  // Determine ROLE based on style
  let roleDefinition = 'You are an expert digital illustrator.';
  if (styleId === 'StainedGlass') {
    roleDefinition = 'You are an expert stained glass artist designing a template for a leaded glass window.';
  } else if (styleId === 'Gothic') {
    roleDefinition = 'You are a master woodcut engraver from the Victorian era.';
  } else if (styleId === 'Mandala') {
    roleDefinition = 'You are a sacred geometry architect.';
  } else if (styleId === 'Fantasy') {
    roleDefinition = 'You are a professional fantasy concept artist and illustrator for a high-end RPG rulebook.';
  } else if (styleId === 'Cozy') {
    roleDefinition = 'You are a Scandinavian lifestyle illustrator creating a sanctuary of warmth and comfort.';
  } else if (styleId === 'Geometric') {
    roleDefinition = 'You are a professional vector illustrator obsessed with Euclidean geometry.';
  } else if (styleId === 'Realistic') {
    roleDefinition = 'Act as a scientific illustrator creating a museum-quality steel engraving.';
  }

  const prompt = `
ROLE: ${roleDefinition}
TASK: Generate a high-quality ${styleSpec.styleKeyword}, ${styleSpec.positiveDescription}. designed for ${audienceId} audience.

SCENE: ${userPrompt}

AUDIENCE GUIDANCE: ${audienceSpec.contentGuidance}

STYLE: ${styleSpec.lineWeight}. ${styleSpec.visualRequirements.join('. ')}.

COMPOSITION: ${complexitySpec.regionRange}. ${complexitySpec.backgroundRule}. ${complexitySpec.detailLevel}. 
LAYOUT: ${framingGuidance} No borders. No frames. Direct 2D flat view.
SUBJECT PLACEMENT: Keep all main characters and key details within the center 85% safe zone. Do NOT cut off heads, feet, or important elements at the edges.

OUTPUT: A single high-contrast black and white coloring book page. Pure black lines on pure white background.

CRITICAL REQUIREMENTS - PROFESSIONAL DIGITAL VECTOR ART:

1. DIGITAL INK: Pure black (#000000) lines on pure white (#FFFFFF) background. Vector quality. Sharp edges. No pixelation.

2. NO GREYSCALE: Zero shading. Zero gradients. Zero tints. Zero grey areas. This is strictly line art.

3. CLEAN LINES: Solid continuous lines. No sketching. No disconnects. No "hairline" gaps.
   NEGATIVE CONSTRAINTS: No cross-hatching. No stippling. No dithering. No 3D renders. No photorealism. No gradients.

4. CLOSED SHAPES: Every element must be a closed loop for coloring.
   NEGATIVE CONSTRAINTS: No gray shading. No gradients. No shadows. No ambient occlusion. No 3D renders. No photorealism. No noise. No dithering. No sketchiness. No cross-hatching. No hairline gaps. No complex backgrounds (unless specified). No paper texture.

6. SINGLE MAIN IMAGE: One unified illustration.
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

  // Normalize aspect ratio for API (Imagen 3 supports specific ratios)
  // We map non-standard print ratios to closest API-supported ratio
  let apiAspectRatio = aspectRatio;
  if (aspectRatio === '17:22' || aspectRatio === '210:297') {
    apiAspectRatio = '3:4'; // Fallback for Letter and A4
  }

  // Build prompt (now with aspect ratio for layout context)
  const { prompt, effectiveComplexity } = buildPrompt(userPrompt, styleId, complexityId, audienceId, aspectRatio);

  if (enableLogging) {
    Logger.info('AI', `[${requestId}] Generating with prompt (${prompt.length} chars)`);
    Logger.debug('AI', `[${requestId}] Params`, { styleId, effectiveComplexity, imageSize, aspectRatio: apiAspectRatio, originalRatio: aspectRatio });
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
        // Image generation config - must include IMAGE modality
        responseModalities: ['IMAGE', 'TEXT'],
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
        // CRITICAL: Per Gemini API docs, aspectRatio and imageSize MUST be nested in imageConfig
        imageConfig: {
          ...(apiAspectRatio && { aspectRatio: apiAspectRatio }),
          ...(imageSize && { imageSize }),
        },
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
  audienceId: AudienceId,
  aspectRatio: string = '1:1'
): string => {
  const { prompt } = buildPrompt(userPrompt, styleId, complexityId, audienceId, aspectRatio);
  return prompt;
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { STYLE_SPECS, COMPLEXITY_SPECS, AUDIENCE_SPECS };