/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ============================================================================
// 1. Type Definitions & Interfaces
// ============================================================================

export interface StyleRule {
  id: string;
  label: string;
  positivePrompt: string;
  negativePrompt: string;
  technicalDirectives: string;
  isFloodFillFriendly: boolean;
}

export interface ComplexityRule {
  id: string;
  label: string;
  targetAudience: string;
  objectDensityInstruction: string;
  lineWeightInstruction: string;
  backgroundInstruction: string;
  negativePrompt: string;
}

// ============================================================================
// 2. The Ultimate Configuration Matrix (All 13 Styles)
// ============================================================================

export const STYLE_RULES: Record<string, StyleRule> = {
  // --- 1. Bold & Easy ---
  'Bold & Easy': {
    id: 'kawaii_bold',
    label: 'Bold & Easy',
    positivePrompt: `kawaii aesthetic, cute rounded vector illustration, thick uniform black outlines, simple geometric shapes, bold line art, mascot style, sticker art, clean white background, minimal detail, joyous expression, rounded corners, soft edges, children's book illustration style, Adobe Illustrator vector, no shading, flat 2D.`,
    negativePrompt: `shading, gradients, greyscale, hatching, cross-hatching, stippling, sharp angles, scary, horror, intricate detail, thin lines, scratchy lines, distorted anatomy, noise, dithering, realism, sketch, rough sketch, texture, fur texture, dirty lines, solid black fills.`,
    technicalDirectives: `Render with a simulated stroke width of 4px to 6px (Bold). Ensure all shapes are convex or simple concave. Maintain a minimum gap size of 5mm between lines. Enforce closed paths for all major shapes (Watertight). Add a white offset border around the main subject (Sticker cutline).`,
    isFloodFillFriendly: true,
  },

  // --- 2. Kawaii ---
  'Kawaii': {
    id: 'kawaii_classic',
    label: 'Kawaii',
    positivePrompt: `Japanese Kawaii mascot style, chibi proportions (1:1 head body), shimmering anime eyes, floating sparkles and bubbles, soft rounded vector shapes, marshmallow aesthetic, extremely cute, innocent expression, thick smooth ink lines.`,
    negativePrompt: `realistic anatomy, scary, sharp edges, rough sketch, hatching, shading, grime, dirty, serious, aggressive, solid black eyes.`,
    technicalDirectives: `Use uniform rounded line caps. No sharp points. Eyes must be large and distinct.`,
    isFloodFillFriendly: true,
  },

  // --- 3. Whimsical ---
  'Whimsical': {
    id: 'whimsical_storybook',
    label: 'Whimsical',
    positivePrompt: `whimsical storybook illustration, hand-drawn dip pen style, playful distortion, floating elements, magical atmosphere, curling vines, swirling wind lines, soft organic shapes, fairy tale aesthetic, charming and gentle.`,
    negativePrompt: `rigid geometry, mechanical lines, scary, horror, stiff, corporate vector, technical drawing, heavy black fills.`,
    technicalDirectives: `Use variable line width (thick swells and thin tapers) to mimic a nib pen. Allow slight physics-defying placement of objects.`,
    isFloodFillFriendly: true,
  },

  // --- 4. Cartoon ---
  'Cartoon': {
    id: 'cartoon_action',
    label: 'Cartoon',
    positivePrompt: `classic Saturday morning cartoon style, dynamic action lines, squash and stretch deformation, exaggerated facial expressions, distinct character silhouettes, energetic pose, clear vector outlines, western animation style.`,
    negativePrompt: `static, stiff, realistic proportions, anime style, sketchy, rough, dirty lines, excessive detail, cross-hatching.`,
    technicalDirectives: `Prioritize silhouette readability. Use 'Speed Lines' for motion. Lines should be uniform thickness vector strokes.`,
    isFloodFillFriendly: true,
  },

  // --- 5. Botanical ---
  'Botanical': {
    id: 'botanical_scientific',
    label: 'Botanical',
    positivePrompt: `vintage scientific botanical illustration, lithograph style, detailed leaf veins, elegant floral composition, organic line art, accurate plant anatomy, fine ink pen style, nature study, contour drawing.`,
    negativePrompt: `cartoon, heavy outlines, sticker border, messy roots, dirt, dead leaves, low resolution, pixelated, marker style.`,
    technicalDirectives: `Use 'Contour Hatching' (fine parallel lines) to show petal curvature. Lines should be very fine (0.5mm).`,
    isFloodFillFriendly: false, // Hatching breaks flood fills
  },

  // --- 6. Mandala ---
  'Mandala': {
    id: 'mandala_sacred',
    label: 'Mandala',
    positivePrompt: `complex mandala design, radial symmetry, sacred geometry, kaleidoscope pattern, zentangle style, precise vector geometry, mathematical patterns, tessellation, perfectly centered, circular composition, crisp architectural lines, meditative pattern.`,
    negativePrompt: `asymmetry, organic chaos, broken lines, sketching, shading, grey fill, humans, faces, animals, text, signature, blurry lines, solid black fills.`,
    technicalDirectives: `Enforce strict 8-fold or 12-fold radial symmetry. Lines must be mechanically consistent weight. No solid black fills > 5%.`,
    isFloodFillFriendly: true,
  },

  // --- 7. Fantasy ---
  'Fantasy': {
    id: 'fantasy_rpg',
    label: 'Fantasy',
    positivePrompt: `epic fantasy RPG bestiary art, Dungeons and Dragons manual style, woodcut influence, dramatic lighting rendered in ink, stippling texture for scales/armor, magical smoke swirls, runes, ancient artifacts, legendary atmosphere.`,
    negativePrompt: `cute, kawaii, modern, sci-fi, smooth vector, flat, minimal, blurry, low detail, sketch.`,
    technicalDirectives: `Use 'Stippling' (dots) for shading. Use broken lines for battle damage/wear. High detail density.`,
    isFloodFillFriendly: false, // Stippling breaks fills
  },

  // --- 8. Gothic ---
  'Gothic': {
    id: 'gothic_stained_glass',
    label: 'Gothic',
    positivePrompt: `stained glass window design, thick bold leadlines, gothic arch frame, mosaic style, strong separation of regions, ecclesiastical art style, high contrast black ironwork lines, interconnected geometry, rose window aesthetics.`,
    negativePrompt: `thin lines, open paths, floating elements, soft shading, watercolor style, gradient, transparency, photorealism.`,
    technicalDirectives: `Simulate 'leading' with very thick lines (min 3px). Every region must be a closed polygon. Connect foreground to frame.`,
    isFloodFillFriendly: true,
  },

  // --- 9. Cozy ---
  'Cozy': {
    id: 'cozy_hygge',
    label: 'Cozy',
    positivePrompt: `hygge aesthetic line art, warm and inviting, soft textures, heaped composition (books, blankets, tea), rounded organic shapes, relaxing atmosphere, home comfort, knitwear patterns, steam swirls.`,
    negativePrompt: `cold, sharp, industrial, scary, aggressive, high energy, dynamic action, empty space.`,
    technicalDirectives: `Use short curved strokes to suggest soft textures (wool, fur). Perspective should be intimate and close-up.`,
    isFloodFillFriendly: true,
  },

  // --- 10. Geometric ---
  'Geometric': {
    id: 'geometric_poly',
    label: 'Geometric',
    positivePrompt: `low poly vector art, wireframe style, sacred geometry, crystalline structures, straight lines only, sharp angles, polygonal mesh, mathematical aesthetic, abstract facets, digital constructivism, hollow shapes.`,
    negativePrompt: `curves, organic shapes, circles, messy sketch, hand-drawn, soft, blurry, realistic, solid faces, filled triangles, black polygons.`,
    technicalDirectives: `STRICTLY NO CURVES. Use straight ruler lines only. Suggest depth via subdivision of triangles. DO NOT FILL FACETS.`,
    isFloodFillFriendly: true,
  },

  // --- 11. Wildlife ---
  'Wildlife': {
    id: 'wildlife_naturalist',
    label: 'Wildlife',
    positivePrompt: `naturalist field sketch, realistic animal anatomy, detailed fur texture rendering, natural habitat background, respectful representation, wildlife conservation art, fine ink details.`,
    negativePrompt: `cartoon, caricature, big head, anthropomorphic, clothes on animals, sticker style, simple outlines.`,
    technicalDirectives: `Use directional strokes to mimic fur/feather flow. Proportions must be biologically accurate.`,
    isFloodFillFriendly: false, // Fur texture usually breaks fills
  },

  // --- 12. Floral ---
  'Floral': {
    id: 'floral_pattern',
    label: 'Floral',
    positivePrompt: `floral pattern design, horror vacui composition, Art Nouveau influence, intertwining stems, lush garden density, decorative motif, elegant sworls, wallpaper aesthetic, all-over print style.`,
    negativePrompt: `single flower, empty background, geometric, mechanical, stiff, dead space.`,
    technicalDirectives: `Maximize coverage (minimize white space). Stems must flow elegantly into one another.`,
    isFloodFillFriendly: true,
  },

  // --- 13. Abstract ---
  'Abstract': {
    id: 'abstract_flow',
    label: 'Abstract',
    positivePrompt: `abstract line art, fluid doodle style, zentangle patterns, non-representational, organic flow, repetitive textures (scales, dots, stripes), hypnotic curves, stream of consciousness drawing.`,
    negativePrompt: `identifiable objects, faces, animals, buildings, rigid grid, straight lines.`,
    technicalDirectives: `Focus on line quality and rhythm. Create distinct 'zones' for coloring with varied internal patterns.`,
    isFloodFillFriendly: true,
  },

  // --- Fallback ---
  'default': {
    id: 'standard',
    label: 'Standard',
    positivePrompt: 'clean black and white line art, coloring book page, high contrast, vector style, white background',
    negativePrompt: 'shading, grayscale, gradients, noise, text, watermark, color',
    technicalDirectives: 'Standard line weight, distinct shapes, closed paths where possible.',
    isFloodFillFriendly: true
  }
};

// ============================================================================
// 3. Complexity Rules (Cognitive Load)
// ============================================================================

export const COMPLEXITY_RULES: Record<string, ComplexityRule> = {
  'Very Simple': {
    id: 'level_1',
    label: 'Level 1: Minimalist (Bold)', 
    targetAudience: 'Early Childhood',
    objectDensityInstruction: `Generate EXACTLY ONE central object. It must occupy 60-80% of the canvas. NO background elements; pure white void. Ensure high white-space ratio. No solid black fills.`,
    lineWeightInstruction: `Bold, clear outlines (1.5mm - 2mm). ALL shapes must be hollow.`,
    backgroundInstruction: 'White void. No patterns.',
    negativePrompt: `background, texture, tiny details, complex patterns, multiple objects, text, hatching, solid black fills, filled shapes, heavy shadows, silhouette.`,
  },
  'Simple': {
    id: 'level_2',
    label: 'Level 2: Simple (Clear)', 
    targetAudience: 'Elementary',
    objectDensityInstruction: `Simple scene, 1-3 primary subjects. Basic background hints only. Clear separation.`,
    lineWeightInstruction: `Standard Bold outlines (1mm - 1.5mm).`,
    backgroundInstruction: `Simple contextual background. No pattern fills.`,
    negativePrompt: `intricate, hatching, tiny stars, excessive foliage, abstract noise, grayscale shading, solid black areas, filled regions.`,
  },
  'Moderate': {
    id: 'level_3',
    label: 'Level 3: Moderate (Standard)', 
    targetAudience: 'Young Adult',
    objectDensityInstruction: `Full scene. Balance detailed focal points with resting space.`,
    lineWeightInstruction: `Standard line weight (0.8mm - 1mm). Min gap: 2mm.`,
    backgroundInstruction: `Complete scene. Background can be stylized.`,
    negativePrompt: `vast empty spaces, messy sketch, blurry lines.`,
  },
  'Intricate': {
    id: 'level_4',
    label: 'Level 4: Intricate (Detailed)', 
    targetAudience: 'Adult',
    objectDensityInstruction: `High density. "Horror Vacui" style. Every part of canvas offers a coloring opportunity.`,
    lineWeightInstruction: `Fine line work (0.3mm - 0.5mm). Min gap: 1mm.`,
    backgroundInstruction: `Detailed background. Use patterns/flora to occupy negative space.`,
    negativePrompt: `large empty areas, simple shapes, thick lines, blurry details.`,
  },
  'Extreme Detail': {
    id: 'level_5',
    label: 'Level 5: Masterwork (Micro)', 
    targetAudience: 'Master',
    objectDensityInstruction: `Maximum density. Hidden object style. Microscopic details.`,
    lineWeightInstruction: `Micro-fine lines (0.1mm - 0.2mm).`,
    backgroundInstruction: `Fractal density. No white space larger than 1cm.`,
    negativePrompt: `simple, easy, empty space, thick lines.`,
  }
};

// ============================================================================
// 4. System Prompt & Construction Helpers
// ============================================================================

export const SYSTEM_INSTRUCTION = `
You are a professional Coloring Book Illustrator and Vector Artist.
Your goal is to generate high-quality, black-and-white line art suitable for printing or digital coloring.

STRICT RULES:
1. OUTPUT MUST BE PURE BLACK AND WHITE. No gray, no shading, no gradients. (1-Bit Logic).
2. LINES MUST BE CRISP AND CONTINUOUS. Emulate vector art.
3. COMPOSITION MUST FIT THE CANVAS. Do not crop the main subject.
4. RESPECT THE COMPLEXITY LEVEL.
5. NO TEXT OR WATERMARKS (unless explicitly requested).
6. TOPOLOGY: Ensure paths are closed loops (watertight) for digital flood fill where possible.
7. COLORABILITY: Do not fill areas with black. All distinct regions must be white to allow user coloring.
`;

export const buildPrompt = (
  userSubject: string,
  styleKey: string,
  complexityKey: string,
  includeText: boolean = false
): { fullPrompt: string; fullNegativePrompt: string } => {
  const style = STYLE_RULES[styleKey] || STYLE_RULES['default'];
  const complexity = COMPLEXITY_RULES[complexityKey] || COMPLEXITY_RULES['Moderate'];

  const typographyInstruction = includeText 
      ? `[TYPOGRAPHY RULES]: Include the text "${userSubject}" or related words styled as HOLLOW OUTLINES (bubble letters). Never fill with black.`
      : ``;

  // Filter out text-related negative prompts if text is requested
  let negativePrompts = `
    ${style.negativePrompt},
    ${complexity.negativePrompt},
    color, coloured, colorful, photography, photorealistic, 3d render,
    gradient, shadow, ambient occlusion, greyscale, gray,
    watermark, signature, logo, copyright,
    blurry, low resolution, jpeg artifacts, pixelated,
    cropped, out of frame, cut off,
    distorted hands, bad anatomy, extra fingers, missing limbs, mutated,
    messy, smudge, dirt, noise,
    double lines, loose sketch, rough draft.
  `;

  if (!includeText) {
      // Explicitly ban all forms of text and numbers if not requested
      negativePrompts += ", text, words, alphabet, kanji, signage, signboards, branding, numbers, numerals, digits, alphanumeric";
  }

  // Construct the narrative prompt using 'Chain of Thought' logic
  const fullPrompt = `
   [ROLE]: Professional Vector Illustrator.
   [SUBJECT]: ${userSubject}
   [STYLE]: ${style.label} - ${style.positivePrompt}
   [COMPLEXITY]: ${complexity.label} - ${complexity.objectDensityInstruction}
   [TECHNICAL_SPECS]: 
      - Line Weight: ${complexity.lineWeightInstruction}
      - Rendering: ${style.technicalDirectives}
      - Background: ${complexity.backgroundInstruction}
      - Topology: ${style.isFloodFillFriendly ? 'Closed Paths (Watertight)' : 'Open/Hatched Paths allowed'}
   ${typographyInstruction}
   [OUTPUT_FORMAT]: High-resolution line art, 300 DPI, Vector style, Black Ink on White Paper.
  `.trim().replace(/\s+/g, ' ');

  // Clean up negative prompt
  const fullNegativePrompt = negativePrompts.trim().replace(/\s+/g, ' ');

  return { fullPrompt, fullNegativePrompt };
};