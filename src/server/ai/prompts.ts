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
  /** Gemini 3 Pro: Explain the emotional/psychological intent of the scene */
  sceneIntent: string;
  positivePrompt: string;
  negativePrompt: string;
  technicalDirectives: string;
  isFloodFillFriendly: boolean;
  /** If true, this style is exempt from the global hatching/stippling ban */
  allowsTextureShading?: boolean;
  /** Recommended temperature for this style (0.7-1.2 range) */
  recommendedTemperature: number;
  /** Style-specific anatomy guidance (Tier 2) - injected for character-heavy styles */
  anatomyGuidance?: string;
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
    sceneIntent: `Create a scene that evokes nostalgia and comfort. The viewer should feel safe, satisfied, and instantly drawn to color. Like rediscovering a beloved childhood coloring book.`,
    // STREAMLINED: Clear priorities - thick borders, clean backgrounds. Focus ONLY on the requested subject.
    positivePrompt: `bold and easy coloring page, friendly whimsical scene featuring ONLY the requested subject, chibi proportions with simple dot eyes, rounded chunky forms, soft curved edges, simplified perspective, thick rounded decorative border frame, heavy vector outlines (4px stroke), high-contrast line art, simple hollow shapes, clean white background in empty areas, alcohol marker friendly, minimal detail, joyous composition, thick uniform line weight.`,
    negativePrompt: `shading, gradients, greyscale, hatching, cross-hatching, stippling, sharp angles, scary, horror, intricate detail, thin lines, thin borders, angular borders, scratchy lines, distorted anatomy, noise, dithering, realism, photorealistic, sketch, texture, fur texture, dirty lines, solid black fills, tiny gaps, microscopic details, fine detail, background filled with decorative elements, cluttered background, busy background, unrelated objects, props not mentioned in prompt.`,
    technicalDirectives: `Stroke width: 4px (Very Bold). All shapes convex or simple concave. Gap size: 5mm minimum (Marker Safe). Closed paths only (Watertight). Thick rounded border frame with 5-8% internal padding. Include ONLY elements explicitly described in the subject prompt.`,
    isFloodFillFriendly: true,
    recommendedTemperature: 0.7, // Requires precision for thick consistent lines
    anatomyGuidance: `SIMPLIFIED ANATOMY: Chibi/cartoon style allowed. Mitten hands (no individual fingers) OK. 3-4 fingers acceptable. Round paw feet OK. Exaggerated head-to-body ratio (big head, small body) is desirable.`,
  },

  // --- 2. Kawaii ---
  'Kawaii': {
    id: 'kawaii_classic',
    label: 'Kawaii',
    sceneIntent: `Trigger protective, nurturing instincts. The viewer should feel like they're looking at a beloved plush toy come to life - irresistibly cute and innocent.`,
    positivePrompt: `Japanese Kawaii mascot style, chibi proportions (1:1 head body), shimmering anime eyes, floating sparkles and bubbles, soft rounded vector shapes, marshmallow aesthetic, extremely cute, innocent expression, thick smooth ink lines.`,
    negativePrompt: `realistic anatomy, scary, sharp edges, rough sketch, hatching, shading, grime, dirty, serious, aggressive, solid black eyes, unrelated objects, props not in prompt.`,
    technicalDirectives: `Use uniform rounded line caps. No sharp points. Eyes must be large and distinct.`,
    isFloodFillFriendly: true,
    recommendedTemperature: 0.8, // Needs consistency for cute proportions
    anatomyGuidance: `PLUSH TOY ANATOMY: 1:1 head-to-body ratio. Stub limbs OK. Mitten hands preferred. Dot eyes or large shimmering anime eyes. No detailed fingers required. Bean-shaped bodies acceptable.`,
  },

  // --- 3. Whimsical ---
  'Whimsical': {
    id: 'whimsical_storybook',
    label: 'Whimsical',
    sceneIntent: `Spark wonder and imagination. A doorway into a magical world where physics gently bends and everything feels enchanted.`,
    positivePrompt: `whimsical storybook illustration, hand-drawn dip pen style, playful distortion, floating elements, magical atmosphere, curling vines, swirling wind lines, soft organic shapes, fairy tale aesthetic, charming and gentle.`,
    negativePrompt: `rigid geometry, mechanical lines, scary, horror, stiff, corporate vector, technical drawing, heavy black fills, unrelated objects, props not in prompt.`,
    technicalDirectives: `Use variable line width (thick swells and thin tapers) to mimic a nib pen. Allow slight physics-defying placement of objects.`,
    isFloodFillFriendly: true,
    recommendedTemperature: 1.0, // Benefits from creative variety
    anatomyGuidance: `STORYBOOK ANATOMY: Gentle exaggeration allowed. Maintain readable human/animal forms. Limbs can be elongated or curved whimsically but must remain functional and attached properly.`,
  },

  // --- 4. Cartoon ---
  'Cartoon': {
    id: 'cartoon_action',
    label: 'Cartoon',
    sceneIntent: `Energize and excite. Capture the Saturday morning adventure feeling - dynamic, fun, and full of personality.`,
    positivePrompt: `classic Saturday morning cartoon style, dynamic action lines, squash and stretch deformation, exaggerated facial expressions, distinct character silhouettes, energetic pose, clear vector outlines, western animation style.`,
    negativePrompt: `static, stiff, realistic proportions, anime style, sketchy, rough, dirty lines, excessive detail, cross-hatching, unrelated objects, props not in prompt.`,
    technicalDirectives: `Prioritize silhouette readability. Use 'Speed Lines' for motion. Lines should be uniform thickness vector strokes.`,
    isFloodFillFriendly: true,
    recommendedTemperature: 0.9, // Dynamic but consistent poses
    anatomyGuidance: `CLASSIC TOON ANATOMY: 4 fingers per hand is standard (like Mickey Mouse). Squash and stretch deformation OK. Exaggerated expressions and poses allowed but limbs must be clearly attached and functional.`,
  },

  // --- 5. Botanical ---
  'Botanical': {
    id: 'botanical_scientific',
    label: 'Botanical',
    sceneIntent: `Inspire calm scholarly appreciation. Museum-quality study of nature's elegance - precise, educational, and beautiful.`,
    positivePrompt: `vintage scientific botanical illustration, lithograph style, detailed leaf veins, elegant floral composition, organic line art, accurate plant anatomy, fine ink pen style, nature study, contour drawing.`,
    negativePrompt: `cartoon, heavy outlines, sticker border, messy roots, dirt, dead leaves, low resolution, pixelated, marker style, unrelated objects, props not in prompt.`,
    technicalDirectives: `Use 'Contour Hatching' (fine parallel lines) to show petal curvature. Lines should be very fine (0.5mm).`,
    isFloodFillFriendly: false, // Hatching breaks flood fills
    allowsTextureShading: true, // EXEMPT from global hatching ban
    recommendedTemperature: 0.8, // Scientific accuracy needed
  },

  // --- 6. Mandala ---
  'Mandala': {
    id: 'mandala_sacred',
    label: 'Mandala',
    sceneIntent: `Induce meditative focus. Hypnotic symmetry draws the eye inward, calming the mind through repetitive, balanced patterns.`,
    positivePrompt: `complex mandala design, radial symmetry, sacred geometry, kaleidoscope pattern, zentangle style, precise vector geometry, mathematical patterns, tessellation, perfectly centered, circular composition, crisp architectural lines, meditative pattern.`,
    negativePrompt: `asymmetry, organic chaos, broken lines, sketching, shading, grey fill, humans, faces, animals, text, signature, blurry lines, solid black fills, unrelated objects, props not in prompt.`,
    technicalDirectives: `Enforce strict 8-fold or 12-fold radial symmetry. Lines must be mechanically consistent weight. No solid black fills > 5%.`,
    isFloodFillFriendly: true,
    recommendedTemperature: 0.7, // Requires perfect symmetry
  },

  // --- 7. Fantasy ---
  'Fantasy': {
    id: 'fantasy_rpg',
    label: 'Fantasy',
    sceneIntent: `Evoke awe and reverence. Ancient legends made tangible - the feeling of discovering a forbidden tome or legendary artifact.`,
    positivePrompt: `epic fantasy RPG bestiary art, Dungeons and Dragons manual style, woodcut influence, dramatic lighting rendered in ink, stippling texture for scales/armor, magical smoke swirls, runes, ancient artifacts, legendary atmosphere.`,
    negativePrompt: `cute, kawaii, modern, sci-fi, smooth vector, flat, minimal, blurry, low detail, sketch, unrelated modern objects, props not in prompt.`,
    technicalDirectives: `Use 'Stippling' (dots) for shading. Use broken lines for battle damage/wear. High detail density.`,
    isFloodFillFriendly: false, // Stippling breaks fills
    allowsTextureShading: true, // EXEMPT from global stippling ban
    recommendedTemperature: 1.1, // Benefits from creative variation
    anatomyGuidance: `HEROIC ANATOMY: Detailed, accurate human proportions. 5 fingers required. Muscular definition for warriors. Armor/clothing must wrap around body logically. Creatures follow fantasy species conventions (dragons: 4 legs + 2 wings OR 2 legs + 2 wings).`,
  },

  // --- 8. Gothic ---
  'Gothic': {
    id: 'gothic_stained_glass',
    label: 'Gothic',
    sceneIntent: `Create solemn beauty. Cathedral light filtering through sacred art - reverent, timeless, and architecturally magnificent.`,
    positivePrompt: `stained glass window design, thick bold leadlines, gothic arch frame, mosaic style, strong separation of regions, ecclesiastical art style, high contrast black ironwork lines, interconnected geometry, rose window aesthetics.`,
    negativePrompt: `thin lines, open paths, floating elements, soft shading, watercolor style, gradient, transparency, photorealism, unrelated objects, props not in prompt.`,
    technicalDirectives: `Simulate 'leading' with very thick lines (min 3px). Every region must be a closed polygon. Connect foreground to frame.`,
    isFloodFillFriendly: true,
    recommendedTemperature: 0.8, // Architectural precision needed
  },

  // --- 9. Realistic ---
  'Realistic': {
    id: 'realistic_fine_art',
    label: 'Realistic',
    sceneIntent: `Capture the subject with academic precision and dignity. A serious, artistic study suitable for advanced colorists who enjoy shading.`,
    positivePrompt: `academic realism, fine line art, technical pen illustration, correct perspective, cross-hatching texture, scientific accuracy, highly detailed, museum quality sketch, etching style.`,
    negativePrompt: `cartoon, caricature, distorted proportions, anime, doodle, simplified, cute, mascot, abstract, surreal, unrelated objects, props not in prompt.`,
    technicalDirectives: `Use 'Cross-Hatching' and 'Stippling' for depth. Maintain realistic proportions. No simplified symbols.`,
    isFloodFillFriendly: false, // Hatching breaks fills
    allowsTextureShading: true, // Crucial for realism
    recommendedTemperature: 0.7, // Lower temp for accuracy
    anatomyGuidance: `STRICT REALISM: Anatomically perfect. Muscles, joints, and skeletal structure must be accurate. No cartoon exaggeration.`,
  },

  // --- 10. Cozy (The Nostalgia Factor) ---
  'Cozy': {
    id: 'cozy_hygge',
    label: 'Cozy',
    sceneIntent: `Wrap the viewer in warm nostalgia. The feeling of safety, softness, and deep comfort.`,
    positivePrompt: `hygge aesthetic line art, warm and inviting atmosphere, soft cozy mood, rounded organic shapes, gentle curved lines, intimate close-up perspective, comforting composition, relaxed peaceful feeling, nostalgic warmth, soft touchable textures implied through line weight variation, welcoming scene.`,
    negativePrompt: `cold, sharp, industrial, scary, aggressive, high energy, dynamic action, empty space, modern tech, jagged lines, unrelated objects, tea cups, coffee mugs, books, blankets, reading materials, hot beverages.`,
    technicalDirectives: `Use short curved strokes to suggest soft textures (wool, fur) but keep them sparse to allow coloring. Perspective should be intimate and close-up. Do NOT add unrelated cozy props - focus only on the subject.`,
    isFloodFillFriendly: true,
    recommendedTemperature: 0.9, // Balanced warmth with consistency
  },

  // --- 10. Geometric (Updated for Functional Realism) ---
  'Geometric': {
    id: 'geometric_poly',
    label: 'Geometric',
    sceneIntent: `Deliver satisfying precision. Architectural order and balance that appeals to those who love clean lines and perfect symmetry.`,
    positivePrompt: `clean vector line art, geometric composition, art deco influence, symmetry, distinct shapes, architectural precision, drafting style, technical illustration, blueprint aesthetic (black on white), precise angles.`,
    negativePrompt: `organic chaos, messy sketch, blurry, hand-drawn, low poly, wireframe, mesh, confusing topology, impossible geometry, unrelated objects, props not in prompt.`,
    technicalDirectives: `Use ruler-straight lines for man-made objects. Maintain perfect symmetry where appropriate. Ensure functional parts (gears, wheels) are clearly defined circles, not polygons.`,
    isFloodFillFriendly: true,
    recommendedTemperature: 0.7, // Requires precision
  },

  // --- 11. Wildlife ---
  'Wildlife': {
    id: 'wildlife_naturalist',
    label: 'Wildlife',
    sceneIntent: `Inspire respectful observation. Nature documentary stillness - the viewer feels like a patient observer witnessing wildlife in its habitat.`,
    positivePrompt: `naturalist field sketch, realistic animal anatomy, detailed fur texture rendering, natural habitat background, respectful representation, wildlife conservation art, fine ink details.`,
    negativePrompt: `cartoon, caricature, big head, anthropomorphic, clothes on animals, sticker style, simple outlines, unrelated objects, props not in prompt.`,
    technicalDirectives: `Use directional strokes to mimic fur/feather flow. Proportions must be biologically accurate.`,
    isFloodFillFriendly: false, // Fur texture usually breaks fills
    recommendedTemperature: 0.9, // Anatomical accuracy with life
  },

  // --- 12. Floral ---
  'Floral': {
    id: 'floral_pattern',
    label: 'Floral',
    sceneIntent: `Evoke abundant joy. A garden in full bloom - lush, celebratory, and overflowing with natural beauty.`,
    positivePrompt: `floral pattern design, horror vacui composition, Art Nouveau influence, intertwining stems, lush garden density, decorative motif, elegant sworls, wallpaper aesthetic, all-over print style.`,
    negativePrompt: `single flower, empty background, geometric, mechanical, stiff, dead space, unrelated objects, props not in prompt.`,
    technicalDirectives: `Maximize coverage (minimize white space). Stems must flow elegantly into one another.`,
    isFloodFillFriendly: true,
    recommendedTemperature: 1.0, // Organic variety acceptable
  },

  // --- 13. Abstract ---
  'Abstract': {
    id: 'abstract_flow',
    label: 'Abstract',
    sceneIntent: `Induce flow state. Rhythmic patterns that guide the hand without demanding interpretation - pure meditative coloring.`,
    positivePrompt: `abstract line art with clearly defined zones, each zone containing a distinct repeating pattern (spirals, waves, scales, concentric circles, chevrons). Zones must be separated by bold boundary lines (2px minimum). Non-representational - no faces, animals, or objects. Organic flowing divisions between pattern zones.`,
    negativePrompt: `identifiable objects, faces, animals, buildings, rigid grid, chaotic scribbles, random marks, undefined boundaries between patterns, unrelated objects, props not in prompt.`,
    technicalDirectives: `Focus on line quality and rhythm. Create 5-8 distinct 'zones' for coloring, each with a different internal pattern. All zone boundaries must be bold and clearly closed.`,
    isFloodFillFriendly: true,
    recommendedTemperature: 1.2, // Most creative freedom allowed
  },

  // --- Fallback ---
  'default': {
    id: 'standard',
    label: 'Standard',
    sceneIntent: `Provide a clean, satisfying coloring experience with clear shapes and good balance.`,
    positivePrompt: 'clean black and white line art, coloring book page, high contrast, vector style, white background',
    negativePrompt: 'shading, grayscale, gradients, noise, text, watermark, color, unrelated objects, props not in prompt',
    technicalDirectives: 'Standard line weight, distinct shapes, closed paths where possible.',
    isFloodFillFriendly: true,
    recommendedTemperature: 1.0, // Balanced default
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
You are a MASTERFUL Coloring Book Illustrator and Vector Artist with decades of experience creating bestselling coloring books.
Your goal is to generate high-quality, black-and-white line art that is BEAUTIFUL, INVITING, and a JOY to color.

ARTISTIC GUIDELINES & CONSTRAINTS:

== CORE QUALITY ==
1.  OUTPUT: Pure black lines on pure white (#FFFFFF) background. No gray, no gradients, no texture.
2.  LINE QUALITY: Crisp, confident, continuous lines. Emulate professional vector art with smooth curves and deliberate strokes.
3.  COMPOSITION: Main subject must fit the canvas with 8-10% margin on all edges. Nothing touches the border.

== MARKETABILITY & COLORING APPEAL ==
4.  INVITING SHAPES: Design shapes that BEG to be colored. Include a satisfying mix of:
    - 2-3 LARGE, simple anchor shapes for quick coloring wins.
    - Medium-sized shapes for engaging detail work.
    - Small accents (but NOT microscopic) for finishing touches.
5.  VISUAL FLOW: Guide the eye through the composition. Avoid "floating object syndrome" where elements feel randomly scattered. Connect elements visually (overlapping, proximity, shared ground lines).
6.  MEANINGFUL OPEN SPACES: Instead of empty voids, make open areas part of the scene (e.g., clear sky, calm water, smooth tabletop, side of a building). These give the colorist rest areas that feel intentional.
7.  THE "COLORING SATISFACTION FACTOR": Imagine someone coloring this with markers. Are there enough medium-large areas to feel productive? Are small areas still manageable? Optimize for this feeling.

== TECHNICAL CONSTRAINTS ==
8.  TOPOLOGY: Closed, watertight paths for digital flood fill. All regions must be clearly bounded.
9.  NO BLACK FILLS: All distinct regions must be white/empty for the user to color.
10. NO SHADING TEXTURES: Absolutely no stippling, hatching, cross-hatching, halftone, dithering, or dots-for-shading.
11. SEPARATION: Maintain 3-5mm minimum gap between unrelated lines. Avoid tangents (near-touching lines).
12. SCALE & PROPORTION: Objects must have realistic relative proportions. Anchor scene with primary subject and scale everything else appropriately.
13. NO TEXT OR WATERMARKS (unless explicitly requested).

== THE ARTIST'S TOUCH ==
14. NARRATIVE MOMENT: Every page should capture a "moment" or tell a micro-story. A cat isn't just sitting; it's "napping in a sunbeam." A flower isn't just there; it's "swaying in a gentle breeze."
15. DELIGHTFUL DETAILS: Add one small, surprising, or charming detail that fits the theme and rewards close inspection.

== ANATOMICAL INTEGRITY ==
16. CORRECT LIMB COUNT: Humans have exactly 2 arms and 2 legs. Animals match their species (dogs: 4 legs, birds: 2 wings, octopus: 8 tentacles).
17. HANDS & FEET: Unless stylized (mitten hands, paws), humans have 5 fingers per hand and 5 toes per foot.
18. FACIAL FEATURES: Faces are symmetric with 2 eyes, 1 nose, 1 mouth in anatomically correct positions.
19. NO MUTATIONS: No extra limbs, fused body parts, floating appendages, or distorted anatomy.

== PHYSICAL COHERENCE ==
20. NATURAL POSES: Limbs must be in physically possible positions. Joints bend in correct directions only.
21. CLEAR BOUNDARIES: Bodies do NOT merge into objects, furniture, or backgrounds. A character sits ON a chair, not fused with it.
22. PROPER LAYERING: When objects overlap, one is clearly in front with logical occlusion.
23. GROUNDED ELEMENTS: Objects and characters appear grounded unless intentionally floating (flying birds, balloons).
`;

export const buildPrompt = (
  userSubject: string,
  styleKey: string,
  complexityKey: string,
  includeText: boolean = false,
  audiencePrompt: string = '',
  audienceLabel: string = '', // For precise border logic
  styleDNA?: import('../../types').StyleDNA | null // Forensic analysis results
): { fullPrompt: string; fullNegativePrompt: string } => {
  const style = STYLE_RULES[styleKey] || STYLE_RULES['default'];
  const complexity = COMPLEXITY_RULES[complexityKey] || COMPLEXITY_RULES['Moderate'];

  // === SMART ANATOMY DETECTION ===
  // Detect if the subject involves characters (humans, animals) or just objects
  const CHARACTER_KEYWORDS = [
    'person', 'human', 'man', 'woman', 'child', 'kid', 'boy', 'girl', 'baby',
    'animal', 'cat', 'dog', 'bird', 'bunny', 'rabbit', 'bear', 'fox', 'owl',
    'dragon', 'unicorn', 'creature', 'monster', 'fairy', 'mermaid', 'character',
    'princess', 'prince', 'knight', 'witch', 'wizard', 'elf', 'dwarf',
    'dinosaur', 'elephant', 'lion', 'tiger', 'horse', 'cow', 'pig', 'sheep',
    'fish', 'dolphin', 'whale', 'octopus', 'crab', 'turtle', 'frog',
    'monkey', 'gorilla', 'penguin', 'panda', 'koala', 'kangaroo',
    'squirrel', 'hedgehog', 'mouse', 'rat', 'hamster', 'guinea pig',
    'people', 'family', 'friends', 'couple'
  ];

  const lowerSubject = userSubject.toLowerCase();
  const hasCharacter = CHARACTER_KEYWORDS.some(keyword => lowerSubject.includes(keyword));
  const shouldApplyAnatomy = hasCharacter;

  const typographyInstruction = includeText
    ? `[TYPOGRAPHY RULES]: Include the text "${userSubject}" or related words styled as HOLLOW OUTLINES (bubble letters). Never fill with black.`
    : ``;

  // Build negative prompts
  let negativePrompts = `
    ${style.negativePrompt},
    ${complexity.negativePrompt},
    color, coloured, colorful, photography, photorealistic, 3d render,
    gradient, shadow, ambient occlusion, greyscale, gray,
    watermark, signature, logo, copyright,
    blurry, low resolution, jpeg artifacts, pixelated,
    cropped, out of frame, cut off,
    messy, smudge, dirt, noise,
    double lines, loose sketch, rough draft,
    extra limbs, extra arms, extra legs, extra fingers, extra toes, missing limbs, missing fingers,
    fused limbs, fused fingers, merged body parts, bad anatomy, malformed hands, malformed feet,
    distorted face, asymmetric eyes, floating limbs, disconnected body parts,
    impossible pose, backwards joints, merged with object, body fused with furniture,
    artifacts, stray marks, broken lines, dangling lines
  `;

  if (!style.allowsTextureShading) {
    negativePrompts += `, hatching, cross-hatching, stippling, halftone, dithering, dots used for shading, engraving texture, etching texture, scratchy shading, scribble shading, texture used as shading, micro-texture, microscopic details, ultra fine noise`;
  }

  if (!includeText) {
    negativePrompts += `, text, words, alphabet, kanji, signage, signboards, branding, numbers, numerals, digits, alphanumeric`;
  }

  // Construct Rest Areas instruction
  let restAreasInstruction = '';
  if (complexityKey === 'Moderate') {
    restAreasInstruction = 'WHITE VOID ZONES: Include 4-6 completely empty white regions (pure white, NO lines, NO marks, NO decoration). Each zone should cover approximately 8-12% of the canvas. Distribute these breathing spaces evenly. These are NOT clouds, flowers, or decorative elements - they are pure empty white space for coloring comfort.';
  } else if (complexityKey === 'Intricate') {
    restAreasInstruction = 'WHITE VOID ZONES: Include 2-4 completely empty white regions as visual anchors. Each zone should cover approximately 5-8% of the canvas. Balance dense detail clusters with these calm empty white spaces.';
  } else if (complexityKey === 'Extreme Detail') {
    restAreasInstruction = 'WHITE VOID ZONES: Include 1-2 large simple shapes or empty white regions as visual anchors amidst the maximum density. Each should cover at least 5% of the canvas.';
  }

  // --- BORDER CALIBRATION LOGIC ---
  // A border is FORCED if:
  // 1. Audience is young (Toddlers, Preschool, Kids) - "Containment Rule"
  // 2. Complexity is low (Very Simple, Simple) and style allows it - "Anchor Rule"
  const isYoungAudience = ['Toddlers', 'Preschool', 'Kids'].some(a => audienceLabel.includes(a));
  const isLowComplexity = ['Very Simple', 'Simple'].includes(complexityKey);
  const kidFriendlyStyles = ['Bold & Easy', 'Kawaii', 'Cartoon', 'Whimsical'];

  // Logic: Young audience GETS a border. Low complexity GETS a border (if style fits). 
  // We expand the "kid friendly" check to strict audience check.
  const shouldHaveBorder = isYoungAudience || (isLowComplexity && kidFriendlyStyles.includes(styleKey));

  const bordersInstruction = shouldHaveBorder
    ? 'Include a thick, rounded decorative border frame. Border thickness must match main outlines. Soft rounded corners. 5-8% internal padding.'
    : '';

  // Positive reinforcements for critical constraints (helps model follow rules)
  const POSITIVE_REINFORCEMENTS = `
USE ONLY: Solid clean lines with no texture or shading techniques.
DRAW WITH: Closed watertight paths suitable for digital flood fill.
MAINTAIN: Consistent line weight throughout the composition.
PRESERVE: 8-10% blank margin on all edges - nothing touches the border.
BACKGROUND: Pure white paper (#FFFFFF) - no cream, beige, or texture.
COMPOSITION: Connect elements visually to avoid floating object syndrome.
SATISFACTION: Include a mix of large anchor shapes, medium detail areas, and small accents.
`;

  // Creative Spark - encourage one delightful detail
  const CREATIVE_SPARK = `
[ARTIST'S TOUCH]: Add ONE small, delightful, or surprising detail that fits the theme. This could be a hidden element, a charming expression, an unexpected texture, or a tiny narrative moment. Make it rewarding to discover.
`;

  // StyleDNA Override - when reference image was analyzed
  const styleDNASection = styleDNA ? `
[STYLE_MATCHING - CRITICAL]: 
You MUST match the exact visual style of the provided reference image:
${styleDNA.promptFragment}
- Line Weight: ${styleDNA.lineWeightMm} (${styleDNA.lineWeight}, ${styleDNA.lineConsistency})
- Line Style: ${styleDNA.lineStyle}
- Shading: ${styleDNA.shadingTechnique === 'none' ? 'NO shading - pure black lines on white only' : styleDNA.shadingTechnique + ' shading technique'}
- Density: ${styleDNA.density} (${styleDNA.whiteSpaceRatio} white space)
${styleDNA.hasBorder ? `- Border: ${styleDNA.borderStyle} border frame required` : '- Border: None - no border frame'}
` : '';

  // Override line weight instruction when StyleDNA is present
  const effectiveLineWeight = styleDNA
    ? `${styleDNA.lineWeightMm} (${styleDNA.lineWeight}, ${styleDNA.lineConsistency} - FROM REFERENCE IMAGE)`
    : complexity.lineWeightInstruction;

  // Construct the narrative prompt using Gemini 3 Pro's deep visual reasoning
  // Note: Preserving newlines for better tokenization (removed .replace(/\s+/g, ' '))
  const fullPrompt = `
[SCENE_INTENT]: ${style.sceneIntent}

[ROLE]: Professional Vector Illustrator creating a coloring book page.

[SUBJECT]: ${userSubject}

[AUDIENCE_GUIDANCE]: ${audiencePrompt || 'General audience - balanced approach.'}

[STYLE]: ${style.label}
${style.positivePrompt}
${styleDNASection}
[COMPLEXITY]: ${complexity.label}
${complexity.objectDensityInstruction}

[TECHNICAL_SPECS]:
- Line Weight: ${effectiveLineWeight}
- Rendering: ${style.technicalDirectives}
- Background: ${complexity.backgroundInstruction}
- Topology: Closed Paths (Watertight)${style.allowsTextureShading ? '' : '; no hatching, stippling, or open sketch lines'}.
- Separation: Maintain 3-5mm minimum gap between unrelated elements to prevent tangent confusion and sliver regions.
- Edge Safety: Leave an 8-10% blank margin on all sides; no elements may touch or cross the border.
${restAreasInstruction ? `- Rest Areas: ${restAreasInstruction}` : ''}
${bordersInstruction ? `- Borders: ${bordersInstruction}` : ''}
- Scale: All objects must have realistic proportions relative to each other. Anchor scene with primary subject, scale everything else appropriately.
${(shouldApplyAnatomy && style.anatomyGuidance) ? `
[ANATOMY_GUIDANCE]: ${style.anatomyGuidance}` : ''}

${typographyInstruction}

[CRITICAL_REQUIREMENTS]:
${POSITIVE_REINFORCEMENTS}

${CREATIVE_SPARK}

[OUTPUT_FORMAT]: High-resolution line art, 300 DPI, Vector style, Black Ink on White Paper.
`.trim();

  // Clean up negative prompt (preserve structure but remove excessive whitespace)
  const fullNegativePrompt = negativePrompts
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { fullPrompt, fullNegativePrompt };
};