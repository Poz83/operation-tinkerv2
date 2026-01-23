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
  | 'HandDrawn'
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
  /** Style reference images (multimodal input for style transfer) - max 5 */
  styleReferenceImages?: Array<{ base64: string; mimeType: string }>;
  /** Fixed seed for visual consistency (not used by current models) */
  seed?: number;
  /** Character DNA for consistent character rendering */
  characterDNA?: {
    name: string;
    face: string;
    eyes: string;
    hair: string;
    body: string;
    outfitCanon: string;
  };
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
    /** Seed used for generation (legacy, for future use) */
    seed?: number;
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
    styleKeyword: 'Bold and Easy coloring book page, thick uniform black marker outlines, cute simple illustration',
    positiveDescription: 'Simple rounded forms with EXTREMELY THICK uniform black outlines (2-3mm marker weight). Cute blob-like characters with dot eyes and tiny smiles. LOW complexity with LARGE open coloring areas.',
    lineWeight: 'EXTREMELY THICK uniform monoline (2-3mm), same weight throughout, NO line variation',
    visualRequirements: [
      'Role: Bold and Easy coloring book illustrator',
      'Lines: EXTREMELY THICK uniform black outlines like a fat chisel-tip marker. ALL lines exact same weight (2-3mm).',
      'Complexity: LOW - minimal details. Lots of blank white space.',
      'Coloring Areas: LARGE open spaces only. No tiny crevices or intricate details.',
      'Characters: SIMPLE blob-shaped bodies, dot eyes (two dots), tiny curved smile, stubby rounded limbs',
      'Details: MINIMAL - use simple dots, hearts, or short lines instead of textures. NO fur texture, NO wood grain, NO knit patterns.',
      'Shapes: Soft rounded forms only, NO sharp angles, every corner is curved',
      'Background: Keep it SIMPLE. Significant blank white space.',
      'Negative: NO thin lines, NO line weight variation, NO intricate patterns, NO shading, NO textures',
      'CRITICAL: Draw EXACTLY what the user describes. Do NOT substitute subjects.',
    ],
  },
  'HandDrawn': {
    styleKeyword: 'Hand-drawn hygge coloring book, extra-thick felt-tip marker lines, cozy domestic lifestyle illustration',
    positiveDescription: 'Hand-drawn cozy lifestyle illustration with ULTRA-THICK uniform black marker outlines (2-3mm). Warm domestic scenes featuring empowering characters in peaceful settings. Hygge aesthetic with organic hand-drawn charm.',
    lineWeight: 'ULTRA-THICK felt-tip marker lines (2-3mm), uniform weight with slight hand-drawn organic wobble, NOT sterile vectors',
    visualRequirements: [
      'Role: Hygge lifestyle illustrator creating warmth and comfort',
      'Lines: ULTRA-THICK uniform felt-tip marker outlines (2-3mm). Hand-drawn organic quality with natural wobble, NOT sterile perfect vectors.',
      'Complexity: LOW - minimal details. Large open coloring areas. Significant white space.',
      'Characters: Gentle blob-like forms, dot eyes (two small dots), subtle curved smile, warm approachable poses',
      'Themes: Cozy domestic moments - reading nooks, warm drinks, pets, peaceful indoor/outdoor scenes. Empowering women in calm settings.',
      'Objects: Rounded everyday items - teacups, books, comfy chairs, plants, simple food. NO sharp or threatening elements.',
      'Details: MINIMAL - use simple shapes (hearts, dots, small flowers) for accents. NO detailed textures.',
      'Mood: Warm, calm, nurturing. "Moments of calm" aesthetic.',
      'Background: Keep SIMPLE with lots of white space. No busy patterns.',
      'Negative: NO thin lines, NO sharp angles, NO scary elements, NO complex patterns, NO shading, NO textures',
      'CRITICAL: Draw EXACTLY what the user describes. Do NOT substitute subjects.',
    ],
  },
  'Kawaii': {
    styleKeyword: 'Super Deformed Kawaii coloring page, cute Japanese mascot style, chibi proportions',
    positiveDescription: 'Japanese mascot style (Yuru-chara) with Kindchenschema proportions. 2-head ratio. Thick marker-style lines.',
    lineWeight: 'uniform thick monoline weight (felt-tip marker style)',
    visualRequirements: [
      'Proportions: Chibi 2-head ratio (Head = 50% of height), stubby limbs',
      'Faces: NO noses. Tiny mouth. Large shimmering eyes with catchlights on bottom 1/3',
      'Limbs: Stubby nubs (NO elbows, NO knees, NO detailed fingers)',
      'Geometry: Soft "Squircle" forms (all corners rounded, no sharp angles)',
      'Shapes: Every visible area must be enclosed and colorable',
      'Accents: Small decorative elements (sparkles, hearts) only if scene-appropriate, NOT random filler',
      'Negative: NO shading, NO grayscale, NO thin lines, NO solid black fills',
      'CRITICAL: Do NOT add random floating objects. Only draw what the user describes.',
    ],
  },
  'Whimsical': {
    styleKeyword: 'Whimsical storybook illustration coloring page, Arthur Rackham style, fairy tale aesthetic',
    positiveDescription: 'Narrative storybook style with curvilinear organic geometry, gentle scale distortion, and hand-drawn flowing lines.',
    lineWeight: 'variable flowing lines (Art Nouveau influence, felt-tip quality)',
    visualRequirements: [
      'Composition: Curvilinear organic flow, no sharp angles, gentle curves',
      'Framing: Wide shot / Full body visible (NO cropping of heads/feet)',
      'Shapes: Every visible area must be enclosed and colorable',
      'Background: White background with optional subtle decorative framing at edges only',
      'Aesthetic: Gentle scale distortion permitted (small things slightly larger) for narrative charm',
      'Negative: NO shading, NO grayscale, NO gray bleed, NO solid black fills',
      'CRITICAL: Do NOT add random props (floating books, keys, lanterns) unless user requests them. Only draw what is described.',
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
 * v3.0: Strengthened constraints for single-pass generation (no QA loop)
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

  // Specific framing guidance based on aspect ratio
  let framingGuidance = 'Full-bleed composition filling the entire canvas.';
  if (aspectRatio === '17:22' || aspectRatio === 'letter') {
    framingGuidance = 'Vertical portrait composition (8.5" x 11"). Tall aspect ratio (17:22). Fit full height.';
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
    roleDefinition = 'You are a professional fantasy concept artist for a high-end RPG rulebook.';
  } else if (styleId === 'Cozy') {
    roleDefinition = 'You are a Scandinavian lifestyle illustrator creating warmth and comfort.';
  } else if (styleId === 'Geometric') {
    roleDefinition = 'You are a professional vector illustrator obsessed with Euclidean geometry.';
  } else if (styleId === 'Realistic') {
    roleDefinition = 'Act as a scientific illustrator creating a museum-quality steel engraving.';
  }

  const prompt = `
ROLE: ${roleDefinition}
TASK: Generate a high-quality ${styleSpec.styleKeyword}, ${styleSpec.positiveDescription}. Designed for ${audienceId} audience.

═══════════════════════════════════════════════════════════════════════════════
SUBJECT (MANDATORY - You MUST draw exactly this, nothing else):
═══════════════════════════════════════════════════════════════════════════════
${userPrompt}

WARNING: Do NOT substitute the subject. If the prompt says "sloths", draw SLOTHS, not cats or other animals. Draw EXACTLY what is described above.

AUDIENCE: ${audienceSpec.contentGuidance}

STYLE: ${styleSpec.lineWeight}. ${styleSpec.visualRequirements.join('. ')}.

COMPOSITION: ${complexitySpec.regionRange}. ${complexitySpec.backgroundRule}. ${complexitySpec.detailLevel}. 
LAYOUT: ${framingGuidance} No borders. No frames. Direct 2D flat view.
SUBJECT PLACEMENT: Keep all main characters within the center 85% safe zone. Do NOT cut off heads, feet, or important elements.

OUTPUT: A PRINTABLE BLACK-AND-WHITE COLORING BOOK PAGE for crayons and markers.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: The following rules MUST be followed EXACTLY. No exceptions.
═══════════════════════════════════════════════════════════════════════════════

BINARY OUTPUT ONLY:
- Pure black lines (#000000) on pure white background (#FFFFFF)
- TWO VALUES ONLY: black or white. Nothing else.
- If in doubt, use WHITE (empty space), not gray

ABSOLUTELY FORBIDDEN (instant rejection if present):
- NO gray, grey, silver, charcoal, or any shade between black and white
- NO shading, shadows, gradients, tints, tones, or fills
- NO pencil strokes, smudges, sketchy marks, or soft edges
- NO textures, noise, grain, or paper texture
- NO 3D rendering, photorealism, or cinematic lighting
- NO cross-hatching, stippling, or halftone dots
- NO colors whatsoever
- NO objects or props not explicitly requested in the scene description

LINE QUALITY:
- Clean, continuous, closed-loop vector lines
- Every shape must be fully enclosed (no gaps)
- Sharp crisp edges suitable for coloring

SELF-CHECK (before outputting, verify each item):
□ Every pixel is pure #000000 or #FFFFFF - no exceptions
□ All shapes are fully enclosed with no gaps
□ No gray zones, gradient fills, or shaded areas
□ Only elements from the SCENE description are included
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
    styleReferenceImages,
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

    // Build multimodal contents when style references exist
    // Reference images go FIRST so the model sees them before the prompt
    let contents: any;
    if (styleReferenceImages && styleReferenceImages.length > 0) {
      const parts: any[] = [];

      // Add reference images first
      for (const refImg of styleReferenceImages) {
        parts.push({
          inlineData: {
            mimeType: refImg.mimeType,
            data: refImg.base64
          }
        });
      }

      // Add text prompt with style matching instruction
      const styleMatchingPrompt = prompt + `

STYLE REFERENCE: Study the uploaded reference image(s) carefully. Match their exact line weight, artistic style, density, and overall aesthetic while creating the new scene.`;

      parts.push({ text: styleMatchingPrompt });
      contents = parts;

      if (enableLogging) {
        Logger.info('AI', `[${requestId}] Using ${styleReferenceImages.length} style reference image(s)`);
      }
    } else {
      contents = prompt;
    }

    // Call Gemini 3 Pro Image
    // NOTE: No negative_prompt - it's deprecated in Imagen 3+
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents,
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
// PROMPT ENHANCEMENT (Using Gemini 2.0 Flash)
// ═══════════════════════════════════════════════════════════════════════════════

const ENHANCER_SYSTEM_PROMPT = `
You are an expert coloring book prompt engineer with deep knowledge of animal anatomy, scene composition, and character design.

═══════════════════════════════════════════════════════════════════════════════
THINK BEFORE YOU WRITE
═══════════════════════════════════════════════════════════════════════════════

Before generating the prompt, mentally work through these steps:

1. SUBJECT ANALYSIS
   - What animals/characters are present?
   - What are their REAL proportions? (e.g., sloths have long limbs ~60cm, lanky bodies)
   - Avoid mascot/chibi proportions unless explicitly requested

2. SCENE CONTEXT
   - What is the setting? (indoor/outdoor)
   - What objects BELONG in this setting?
   - Do NOT add objects that don't fit (no indoor props on beaches)

3. CHARACTER DIFFERENTIATION
   - If multiple characters of the same type, how will each be UNIQUE?
   - Give distinct features: size differences, markings, expressions, poses, accessories

4. COMPOSITION
   - Where is the focal point?
   - What's in foreground vs background?
   - How much detail for the complexity level?

═══════════════════════════════════════════════════════════════════════════════
OUTPUT RULES
═══════════════════════════════════════════════════════════════════════════════

1. Keep output under 100 words
2. Focus on VISUAL elements (shapes, objects, composition)
3. Include anatomically accurate proportions for animals
4. Differentiate multiple characters with distinct visual traits
5. Match objects to the scene context (beach = beach items, not indoor props)
6. Add composition guidance (foreground, background, focal point)
7. Do NOT mention colors, shading, textures, or technical instructions
8. Write as a single flowing description

═══════════════════════════════════════════════════════════════════════════════
INTENT GUARDIAN (FINAL GATE - READ LAST)
═══════════════════════════════════════════════════════════════════════════════

Before you output ANYTHING, apply this final filter:

Your enhancement must be ADDITIVE, never SUBTRACTIVE.

INTENT PRESERVATION:
- The user's original SUBJECT, ACTION, and TONE are SACRED. Do not alter them.
- ADD visual detail. ADD composition. ADD context. ADD specificity.
- NEVER remove, soften, redirect, censor, or moralize the user's core concept.

COHERENCE CHECK:
- Every detail you ADD must be internally consistent with the scene.
- Objects must match the setting. Actions must be physically possible (unless user asked for surreal).
- If the user's idea is intentionally absurd, PRESERVE it—do not "fix" it.

FINAL SELF-CHECK: "Would the user recognize their idea? Does every detail make sense?"

OUTPUT: Just the enhanced scene description, nothing else.
`;

/**
 * Enhance a user's basic prompt using Gemini 2.0 Flash
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