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
  objectDensityInstruction: string;
  lineWeightInstruction: string;
  backgroundInstruction: string;
  negativePrompt: string;
}

// ============================================================================
// 2. The Ultimate Configuration Matrix (All 13 Styles)
// ============================================================================

export const STYLE_RULES: Record<string, StyleRule> = {
  // --- 1. Bold & Easy (Flagship Marker-Safe Style) ---
  'Bold & Easy': {
    id: 'kawaii_bold',
    label: 'Bold & Easy',
    // STREAMLINED: Clear priorities - cozy scenes, proper scale, thick borders, clean backgrounds
    positivePrompt: `bold and easy coloring page, cozy whimsical scene, friendly anthropomorphic animals OR cute cartoon characters, chibi proportions with simple dot eyes, rounded chunky forms, soft curved edges, simplified perspective, thick rounded decorative border frame, heavy vector outlines (4px stroke), high-contrast line art, simple hollow shapes, clean white background in empty areas, alcohol marker friendly, minimal detail, joyous composition, thick uniform line weight. IMPORTANT: Decorative accents (small hearts, stars, flowers) used SPARINGLY as tiny corner flourishes only - NOT filling background space.`,
    negativePrompt: `shading, gradients, greyscale, hatching, cross-hatching, stippling, sharp angles, scary, horror, intricate detail, thin lines, thin borders, angular borders, scratchy lines, distorted anatomy, noise, dithering, realism, photorealistic, sketch, texture, fur texture, dirty lines, solid black fills, tiny gaps, microscopic details, fine detail, background filled with decorative elements, cluttered background, busy background.`,
    technicalDirectives: `Stroke width: 4px (Very Bold). All shapes convex or simple concave. Gap size: 5mm minimum (Marker Safe). Closed paths only (Watertight). Thick rounded border frame with 5-8% internal padding.`,
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

  // --- 9. Cozy (The Nostalgia Factor) ---
  'Cozy': {
    id: 'cozy_hygge',
    label: 'Cozy',
    // UPDATED: Added "Nostalgia" and "Safe Regression" keywords from research
    positivePrompt: `hygge aesthetic line art, warm and inviting, nostalgia-inducing, vintage comfort, soft textures, heaped composition (books, blankets, tea), rounded organic shapes, relaxing atmosphere, home comfort, slow living aesthetic, gentle distinct lines.`,
    negativePrompt: `cold, sharp, industrial, scary, aggressive, high energy, dynamic action, empty space, modern tech, jagged lines.`,
    technicalDirectives: `Use short curved strokes to suggest soft textures (wool, fur) but keep them sparse to allow coloring. Perspective should be intimate and close-up.`,
    isFloodFillFriendly: true,
  },

  // --- 10. Geometric (Updated for Functional Realism) ---
  'Geometric': {
    id: 'geometric_poly',
    label: 'Geometric',
    // CHANGED: From "Low Poly" to "Art Deco/Vector"
    positivePrompt: `clean vector line art, geometric composition, art deco influence, symmetry, distinct shapes, architectural precision, drafting style, technical illustration, blueprint aesthetic (black on white), precise angles.`,
    negativePrompt: `organic chaos, messy sketch, blurry, hand-drawn, low poly, wireframe, mesh, confusing topology, impossible geometry.`,
    technicalDirectives: `Use ruler-straight lines for man-made objects. Maintain perfect symmetry where appropriate. Ensure functional parts (gears, wheels) are clearly defined circles, not polygons.`,
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
    objectDensityInstruction: `Generate EXACTLY ONE central object. It must occupy 60-80% of the canvas. NO background elements; pure white void. Ensure high white-space ratio. No solid black fills.`,
    lineWeightInstruction: `Bold, clear outlines (1.5mm - 2mm). ALL shapes must be hollow.`,
    backgroundInstruction: 'White void. No patterns.',
    negativePrompt: `background, texture, tiny details, complex patterns, multiple objects, text, hatching, solid black fills, filled shapes, heavy shadows, silhouette.`,
  },
  'Simple': {
    id: 'level_2',
    label: 'Level 2: Simple (Clear)', 
    objectDensityInstruction: `Simple scene, 1-3 primary subjects. Basic background hints only. Clear separation.`,
    lineWeightInstruction: `Standard Bold outlines (1mm - 1.5mm).`,
    backgroundInstruction: `Simple contextual background. No pattern fills.`,
    negativePrompt: `intricate, hatching, tiny stars, excessive foliage, abstract noise, grayscale shading, solid black areas, filled regions.`,
  },
  'Moderate': {
    id: 'level_3',
    label: 'Level 3: Moderate (Standard)',
    objectDensityInstruction: `Full scene. Include 4-6 REST AREAS (empty white space OR simple solid shapes - NOT decorative motifs like clouds/flowers). Distribute across composition for breathing space. Avoid wall-to-wall detail.`,
    lineWeightInstruction: `Standard line weight (0.8mm - 1mm). Min gap: 2mm.`,
    backgroundInstruction: `Complete scene with intentional empty regions. Background can be stylized but must include white space.`,
    negativePrompt: `vast empty spaces, messy sketch, blurry lines, background filled with decorative elements.`,
  },
  'Intricate': {
    id: 'level_4',
    label: 'Level 4: Intricate (Detailed)',
    objectDensityInstruction: `High density with objects/patterned regions. Include 2-4 REST AREAS (empty white space or simple anchor shapes - NOT decorative motifs). Balance detail clusters with calm regions.`,
    lineWeightInstruction: `Fine line work (0.3mm - 0.5mm). Min gap: ~1-1.2mm. Favor medium/large closed regions over microscopic texture.`,
    backgroundInstruction: `Detailed background with closed colorable regions (no stipple/hatching). Must include some empty white space.`,
    negativePrompt: `simple shapes, thick lines, blurry details, wall-to-wall decorative motifs.`,
  },
  'Extreme Detail': {
    id: 'level_5',
    label: 'Level 5: Masterwork (Micro)',
    objectDensityInstruction: `Maximum density permitted. Hidden object style. Microscopic details. Include 1-2 larger simple shapes as visual anchors.`,
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
8. EDGE SAFETY: Leave a clear, unmarked margin (about 8-10% of the canvas) on all sides. No objects, bubbles, or lines may touch or cross the border.
9. HUMAN COLORING FRIENDLY: Use closed, clearly bounded regions sized for coloring by hand; avoid microscopic cells. Most enclosed areas should be comfortably colorable at print size.
10. NO SHADING TEXTURES: Absolutely forbid stippling, hatching, cross-hatching, halftone, dithering, or dots-for-shading. Do not simulate shading or engraving textures; rely on clean shapes and patterns instead.
11. AVOID TANGENTS AND MICRO-GAPS: Lines that are meant to be separate must maintain minimum 3-5mm separation at print scale. Never create near-touching lines (tangents) or accidental sliver regions. Ensure unrelated elements have clear visual separation.
12. SCALE AND PROPORTION: Objects must maintain realistic relative proportions to each other. A phone should not be larger than a lamp. Headphones should not be larger than a bed. Use common sense scale relationships. Anchor the scene with one primary subject at appropriate size, then scale all other objects relative to it.
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
    double lines, loose sketch, rough draft,
    hatching, cross-hatching, stippling, halftone, dithering, dots used for shading, engraving texture, etching texture, scratchy shading, scribble shading, texture used as shading, micro-texture, microscopic details, ultra fine noise.
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
      - Topology: Closed Paths (Watertight); no hatching, stippling, or open sketch lines.
      - Separation: Maintain 3-5mm minimum gap between unrelated elements to prevent tangent confusion and sliver regions. Clearly separate overlapping objects with intentional line intersections.
      - Edge Safety: Leave an 8-10% blank margin on all sides; no elements may touch or cross the border.
      - Rest Areas: ${
        complexityKey === 'Moderate'
          ? 'Include 4-6 REST AREAS (large empty white regions OR simple solid shapes with minimal internal lines). REST AREAS are NOT decorative motifs - they are calm visual breathing spaces. Distribute across composition.'
          : complexityKey === 'Intricate'
          ? 'Include 2-4 REST AREAS (larger simple shapes as visual anchors). REST AREAS = empty space, NOT decorative elements like clouds or flowers. Balance dense detail clusters with calm regions.'
          : complexityKey === 'Extreme Detail'
          ? 'Include 1-2 REST AREAS (larger simple shapes as visual anchors amidst maximum density).'
          : ''
      }
      - Borders: ${
        styleKey === 'Bold & Easy'
          ? 'Include a thick, rounded decorative border frame. Border thickness must match main outlines. Soft rounded corners. 5-8% internal padding.'
          : ''
      }
      - Scale: All objects must have realistic proportions relative to each other. No oversized accessories. Anchor scene with primary subject, scale everything else appropriately.
   ${typographyInstruction}
   [OUTPUT_FORMAT]: High-resolution line art, 300 DPI, Vector style, Black Ink on White Paper.
  `.trim().replace(/\s+/g, ' ');

  // Clean up negative prompt
  const fullNegativePrompt = negativePrompts.trim().replace(/\s+/g, ' ');

  return { fullPrompt, fullNegativePrompt };
};