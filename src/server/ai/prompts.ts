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
  /** If true, applies organic hand-drawn line quality (wiggly, imperfect, felt-tip pen aesthetic) */
  organicLineQuality?: boolean;
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

// --- SHARED ANTI-REPETITION CONSTANTS ---
const ANTI_REPETITION_NEGATIVE = `obsessive labeling, logos on every object, repetitive filler icons, floating random objects, text, watermark, signature, logo, copyright`;
const ANTI_STAMPING_DIRECTIVE = `Avoid stamping the same motif (like a coffee bean or heart) on every single object.`;

export const STYLE_RULES: Record<string, StyleRule> = {
  // --- 0. Cozy Hand-Drawn (NEW Flagship Felt-Tip Style) ---
  'Cozy Hand-Drawn': {
    id: 'cozy_handdrawn',
    label: 'Cozy Hand-Drawn',
    sceneIntent: `Create a scene that feels like it was lovingly drawn by hand with a felt-tip pen. The viewer should feel wrapped in warmth and whimsy - like opening a treasured handmade gift. Evoke cozy comfort, playful joy, and the tactile pleasure of imperfect art.`,
    positivePrompt: `casual hand-drawn coloring book line art, cozy whimsical feel, thick rounded SLIGHTLY WIGGLY outlines, hand-drawn imperfect aesthetic like a felt-tip marker, gentle natural line variation, NEVER vector-clean or computer-perfect, soft organic strokes with subtle wobble, rounded soft forms only, large readable shapes for easy coloring, cute playful joyful mood, varied props and details, moderately full cozy scene without clutter, all shapes fully enclosed and colorable, overlapping elements still form closed colorable areas, thick black lines on pure white background.`,
    negativePrompt: `vector-clean lines, computer-perfect strokes, mechanical precision, ruler-straight lines, thin lines, thin details, fine details, tiny repeating details, microscopic elements, sharp angular forms, grayscale, shading, halftone, crosshatching, stippling, texture strokes, sketch lines, solid black fills, open paths, incomplete shapes, cluttered busy composition, scary, horror, aggressive, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Stroke width: 3-4px with natural variation. Lines should look HAND-DRAWN with felt-tip pen - slightly wiggly, organic, imperfect but confident. All shapes must be FULLY ENCLOSED for flood-fill coloring. Large readable regions (minimum 5mm) favored over tiny details. Overlapping elements must each form closed colorable areas. Rounded corners on all shapes. Gap size: 4mm minimum. ${ANTI_STAMPING_DIRECTIVE}`,
    isFloodFillFriendly: true,
    organicLineQuality: true,
    recommendedTemperature: 0.85, // Balanced warmth with some organic variety
    anatomyGuidance: `COZY ANATOMY: Soft rounded forms, slightly simplified. Mitten hands or 4 fingers OK. Chunky proportions preferred. Bean-shaped bodies with stubby limbs are charming. Faces should be simple and friendly.`,
  },

  // --- 1. Bold & Easy (Flagship Marker-Safe Style) ---
  'Bold & Easy': {
    id: 'kawaii_bold',
    label: 'Bold & Easy',
    sceneIntent: `Create a scene that evokes nostalgia and comfort. The viewer should feel safe, satisfied, and instantly drawn to color. Like rediscovering a beloved childhood coloring book.`,
    // STREAMLINED: Clear priorities - thick borders, clean backgrounds. Focus ONLY on the requested subject.
    positivePrompt: `bold and easy coloring page, friendly whimsical scene featuring ONLY the requested subject, chibi proportions with simple dot eyes, rounded chunky forms, soft curved edges, simplified perspective, thick rounded decorative border frame, heavy outlines (4px stroke) with subtle organic variation, high-contrast line art, simple hollow shapes, clean white background in empty areas, alcohol marker friendly, minimal detail, joyous composition, thick line weight with gentle hand-drawn feel.`,
    negativePrompt: `shading, gradients, greyscale, hatching, cross-hatching, stippling, sharp angles, scary, horror, intricate detail, thin lines, thin details, thin borders, angular borders, scratchy lines, distorted anatomy, noise, dithering, realism, photorealistic, sketch, texture, fur texture, dirty lines, solid black fills, tiny gaps, microscopic details, fine detail, tiny repeating details, background filled with decorative elements, cluttered background, busy background, unrelated objects, props not mentioned in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Stroke width: 4px (Very Bold) with subtle organic variation - not vector-perfect. All shapes convex or simple concave. Gap size: 5mm minimum (Marker Safe). Closed paths only (Watertight). Thick rounded border frame with 5-8% internal padding. Include ONLY elements explicitly described in the subject prompt. Large readable shapes for easy coloring. ${ANTI_STAMPING_DIRECTIVE}`,
    isFloodFillFriendly: true,
    organicLineQuality: true,
    recommendedTemperature: 0.7, // Requires precision for thick consistent lines
    anatomyGuidance: `SIMPLIFIED ANATOMY: Chibi/cartoon style allowed. Mitten hands (no individual fingers) OK. 3-4 fingers acceptable. Round paw feet OK. Exaggerated head-to-body ratio (big head, small body) is desirable.`,
  },

  // --- 2. Kawaii ---
  'Kawaii': {
    id: 'kawaii_classic',
    label: 'Kawaii',
    sceneIntent: `Trigger protective, nurturing instincts. The viewer should feel like they're looking at a beloved plush toy come to life - irresistibly cute and innocent.`,
    positivePrompt: `Japanese Kawaii mascot style, chibi proportions (1:1 head body), shimmering anime eyes, floating sparkles and bubbles, soft rounded forms, marshmallow aesthetic, extremely cute, innocent expression, thick smooth ink lines with gentle organic quality, all shapes fully enclosed for coloring.`,
    negativePrompt: `realistic anatomy, scary, sharp edges, rough sketch, hatching, shading, grime, dirty, serious, aggressive, solid black eyes, thin lines, thin details, tiny repeating patterns, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Use uniform rounded line caps with subtle organic warmth. No sharp points. Eyes must be large and distinct. All shapes fully enclosed - overlapping elements must still form closed colorable areas. Large readable regions preferred. ${ANTI_STAMPING_DIRECTIVE}`,
    isFloodFillFriendly: true,
    organicLineQuality: true,
    recommendedTemperature: 0.8, // Needs consistency for cute proportions
    anatomyGuidance: `PLUSH TOY ANATOMY: 1:1 head-to-body ratio. Stub limbs OK. Mitten hands preferred. Dot eyes or large shimmering anime eyes. No detailed fingers required. Bean-shaped bodies acceptable.`,
  },

  // --- 3. Whimsical ---
  'Whimsical': {
    id: 'whimsical_storybook',
    label: 'Whimsical',
    sceneIntent: `Spark wonder and imagination. A doorway into a magical world where physics gently bends and everything feels enchanted.`,
    positivePrompt: `whimsical storybook illustration, hand-drawn dip pen style with organic imperfect strokes, playful distortion, floating elements, magical atmosphere, curling vines, swirling wind lines, soft organic rounded shapes, fairy tale aesthetic, charming and gentle, all shapes fully enclosed for coloring, large readable areas.`,
    negativePrompt: `rigid geometry, mechanical lines, vector-perfect strokes, scary, horror, stiff, corporate vector, technical drawing, heavy black fills, thin details, tiny repeating elements, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Use variable line width (thick swells and thin tapers) to mimic a nib pen with natural hand-drawn wobble. Allow slight physics-defying placement of objects. All shapes must be fully enclosed - overlapping elements must still form closed colorable areas. Favor large readable shapes over microscopic details. ${ANTI_STAMPING_DIRECTIVE}`,
    isFloodFillFriendly: true,
    organicLineQuality: true,
    recommendedTemperature: 1.0, // Benefits from creative variety
    anatomyGuidance: `STORYBOOK ANATOMY: Gentle exaggeration allowed. Maintain readable human/animal forms. Limbs can be elongated or curved whimsically but must remain functional and attached properly.`,
  },

  // --- 4. Cartoon ---
  'Cartoon': {
    id: 'cartoon_action',
    label: 'Cartoon',
    sceneIntent: `Energize and excite. Capture the Saturday morning adventure feeling - dynamic, fun, and full of personality.`,
    positivePrompt: `classic Saturday morning cartoon style, dynamic action lines, squash and stretch deformation, exaggerated facial expressions, distinct character silhouettes, energetic pose, clear vector outlines, western animation style.`,
    negativePrompt: `static, stiff, realistic proportions, anime style, sketchy, rough, dirty lines, excessive detail, cross-hatching, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Prioritize silhouette readability. Use 'Speed Lines' for motion. Lines should be uniform thickness vector strokes. ${ANTI_STAMPING_DIRECTIVE}`,
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
    negativePrompt: `cartoon, heavy outlines, sticker border, messy roots, dirt, dead leaves, low resolution, pixelated, marker style, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Use 'Contour Hatching' (fine parallel lines) to show petal curvature. Lines should be very fine (0.5mm). ${ANTI_STAMPING_DIRECTIVE}`,
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
    negativePrompt: `asymmetry, organic chaos, broken lines, sketching, shading, grey fill, humans, faces, animals, text, signature, blurry lines, solid black fills, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
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
    negativePrompt: `cute, kawaii, modern, sci-fi, smooth vector, flat, minimal, blurry, low detail, sketch, unrelated modern objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Use 'Stippling' (dots) for shading. Use broken lines for battle damage/wear. High detail density. ${ANTI_STAMPING_DIRECTIVE}`,
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
    negativePrompt: `thin lines, open paths, floating elements, soft shading, watercolor style, gradient, transparency, photorealism, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Simulate 'leading' with very thick lines (min 3px). Every region must be a closed polygon. Connect foreground to frame. ${ANTI_STAMPING_DIRECTIVE}`,
    isFloodFillFriendly: true,
    recommendedTemperature: 0.8, // Architectural precision needed
  },

  // --- 9. Realistic ---
  'Realistic': {
    id: 'realistic_fine_art',
    label: 'Realistic',
    sceneIntent: `Capture the subject with academic precision and dignity. A serious, artistic study suitable for advanced colorists who enjoy shading.`,
    positivePrompt: `academic realism, fine line art, technical pen illustration, correct perspective, cross-hatching texture, scientific accuracy, highly detailed, museum quality sketch, etching style.`,
    negativePrompt: `cartoon, caricature, distorted proportions, anime, doodle, simplified, cute, mascot, abstract, surreal, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Use 'Cross-Hatching' and 'Stippling' for depth. Maintain realistic proportions. No simplified symbols. ${ANTI_STAMPING_DIRECTIVE}`,
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
    positivePrompt: `hygge aesthetic line art, warm and inviting atmosphere, soft cozy mood, rounded organic shapes, gentle curved lines with hand-drawn organic quality, intimate close-up perspective, comforting composition, relaxed peaceful feeling, nostalgic warmth, soft touchable textures implied through natural line weight variation, welcoming scene, all shapes fully enclosed for coloring.`,
    negativePrompt: `cold, sharp, industrial, scary, aggressive, high energy, dynamic action, empty space, modern tech, jagged lines, vector-perfect mechanical lines, thin details, tiny repeating patterns, unrelated objects, tea cups, coffee mugs, books, blankets, reading materials, hot beverages, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Use short curved strokes to suggest soft textures (wool, fur) but keep them sparse to allow coloring. Lines should have organic hand-drawn warmth - never vector-clean. Perspective should be intimate and close-up. All shapes must be fully enclosed. Do NOT add unrelated cozy props - focus only on the subject. Large readable shapes for easy coloring. ${ANTI_STAMPING_DIRECTIVE}`,
    isFloodFillFriendly: true,
    organicLineQuality: true,
    recommendedTemperature: 0.9, // Balanced warmth with consistency
  },

  // --- 10. Geometric (Updated for Functional Realism) ---
  'Geometric': {
    id: 'geometric_poly',
    label: 'Geometric',
    sceneIntent: `Deliver satisfying precision. Architectural order and balance that appeals to those who love clean lines and perfect symmetry.`,
    positivePrompt: `clean vector line art, geometric composition, art deco influence, symmetry, distinct shapes, architectural precision, drafting style, technical illustration, blueprint aesthetic (black on white), precise angles.`,
    negativePrompt: `organic chaos, messy sketch, blurry, hand-drawn, low poly, wireframe, mesh, confusing topology, impossible geometry, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Use ruler-straight lines for man-made objects. Maintain perfect symmetry where appropriate. Ensure functional parts (gears, wheels) are clearly defined circles, not polygons. ${ANTI_STAMPING_DIRECTIVE}`,
    isFloodFillFriendly: true,
    recommendedTemperature: 0.7, // Requires precision
  },

  // --- 11. Wildlife ---
  'Wildlife': {
    id: 'wildlife_naturalist',
    label: 'Wildlife',
    sceneIntent: `Inspire respectful observation. Nature documentary stillness - the viewer feels like a patient observer witnessing wildlife in its habitat.`,
    positivePrompt: `naturalist field sketch, realistic animal anatomy, detailed fur texture rendering, natural habitat background, respectful representation, wildlife conservation art, fine ink details.`,
    negativePrompt: `cartoon, caricature, big head, anthropomorphic, clothes on animals, sticker style, simple outlines, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
    technicalDirectives: `Use directional strokes to mimic fur/feather flow. Proportions must be biologically accurate. ${ANTI_STAMPING_DIRECTIVE}`,
    isFloodFillFriendly: false, // Fur texture usually breaks fills
    recommendedTemperature: 0.9, // Anatomical accuracy with life
  },

  // --- 12. Floral ---
  'Floral': {
    id: 'floral_pattern',
    label: 'Floral',
    sceneIntent: `Evoke abundant joy. A garden in full bloom - lush, celebratory, and overflowing with natural beauty.`,
    positivePrompt: `floral pattern design, horror vacui composition, Art Nouveau influence, intertwining stems, lush garden density, decorative motif, elegant sworls, wallpaper aesthetic, all-over print style.`,
    negativePrompt: `single flower, empty background, geometric, mechanical, stiff, dead space, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
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
    negativePrompt: `identifiable objects, faces, animals, buildings, rigid grid, chaotic scribbles, random marks, undefined boundaries between patterns, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}.`,
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
    negativePrompt: `shading, grayscale, gradients, noise, text, watermark, color, unrelated objects, props not in prompt, ${ANTI_REPETITION_NEGATIVE}`,
    technicalDirectives: `Standard line weight, distinct shapes, closed paths where possible. ${ANTI_STAMPING_DIRECTIVE}`,
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
    objectDensityInstruction: `Generate EXACTLY ONE central object. It must occupy 60-80% of the canvas. NO background elements; pure white void. Ensure high white-space ratio. No solid black fills. LARGE READABLE SHAPES ONLY - no tiny details.`,
    lineWeightInstruction: `Bold, clear outlines (1.5mm - 2mm). ALL shapes must be hollow. Thick rounded strokes.`,
    backgroundInstruction: 'White void. No patterns.',
    negativePrompt: `background, texture, tiny details, thin details, fine details, complex patterns, multiple objects, text, hatching, solid black fills, filled shapes, heavy shadows, silhouette, microscopic elements, tiny repeating patterns.`,
  },
  'Simple': {
    id: 'level_2',
    label: 'Level 2: Simple (Clear)',
    objectDensityInstruction: `Simple scene, 1-3 primary subjects. Basic background hints only. Clear separation. Large readable shapes for easy coloring - avoid clutter and tiny repeating details.`,
    lineWeightInstruction: `Standard Bold outlines (1mm - 1.5mm). Thick rounded strokes.`,
    backgroundInstruction: `Simple contextual background. No pattern fills. Keep shapes large and readable.`,
    negativePrompt: `intricate, hatching, tiny stars, tiny details, thin details, excessive foliage, abstract noise, grayscale shading, solid black areas, filled regions, microscopic elements, cluttered composition.`,
  },
  'Moderate': {
    id: 'level_3',
    label: 'Level 3: Moderate (Standard)',
    objectDensityInstruction: `Cozy, moderately full scene. Include 4-6 REST AREAS (empty white space OR simple solid shapes - NOT decorative motifs like clouds/flowers). Distribute across composition for breathing space. Avoid wall-to-wall detail. Large readable shapes - avoid clutter and tiny repeating details.`,
    lineWeightInstruction: `Standard line weight (0.8mm - 1mm). Min gap: 2mm. Favor readable shapes over microscopic detail.`,
    backgroundInstruction: `Complete scene with intentional empty regions. Background can be stylized but must include white space. All shapes large enough to color comfortably.`,
    negativePrompt: `vast empty spaces, messy sketch, blurry lines, background filled with decorative elements, tiny repeating details, microscopic patterns, cluttered busy composition.`,
  },
  'Intricate': {
    id: 'level_4',
    label: 'Level 4: Intricate (Detailed)',
    objectDensityInstruction: `High density with objects/patterned regions. Include 2-4 REST AREAS (empty white space or simple anchor shapes - NOT decorative motifs). Balance detail clusters with calm regions. Shapes should still be readable - favor medium closed regions over microscopic texture.`,
    lineWeightInstruction: `Fine line work (0.3mm - 0.5mm). Min gap: ~1-1.2mm. Favor medium/large closed regions over microscopic texture.`,
    backgroundInstruction: `Detailed background with closed colorable regions (no stipple/hatching). Must include some empty white space. Shapes remain colorable.`,
    negativePrompt: `simple shapes, thick lines, blurry details, wall-to-wall decorative motifs, unclosable microscopic areas.`,
  },
  'Extreme Detail': {
    id: 'level_5',
    label: 'Level 5: Masterwork (Micro)',
    objectDensityInstruction: `Maximum density permitted. Hidden object style. Include 1-2 larger simple shapes as visual anchors. Even small details should remain colorable closed shapes.`,
    lineWeightInstruction: `Micro-fine lines (0.1mm - 0.2mm). All regions still enclosed for coloring.`,
    backgroundInstruction: `Fractal density. No white space larger than 1cm. All shapes closed and colorable.`,
    negativePrompt: `simple, easy, empty space, thick lines, unclosed regions.`,
  }
};

// ============================================================================
// 4. System Prompt & Construction Helpers
// ============================================================================

export const SYSTEM_INSTRUCTION = `
You are a MASTERFUL Coloring Book Illustrator with decades of experience creating bestselling coloring books.
Your goal is to generate high-quality, black-and-white line art that is BEAUTIFUL, INVITING, and a JOY to color.

ARTISTIC GUIDELINES & CONSTRAINTS:

== CORE QUALITY ==
1.  OUTPUT: Pure black lines (#000000) on pure white (#FFFFFF) background. NO gray, NO gradients, NO texture.
2.  LINE QUALITY: Thick, rounded, confident strokes. Lines should feel hand-drawn with natural organic variation - NOT vector-clean or computer-perfect. Think felt-tip pen aesthetic with gentle wobble.
3.  COMPOSITION: Main subject must fit the canvas with 8-10% margin on all edges. Nothing touches the border.

== SHAPE CLOSURE & OVERLAP RULES (CRITICAL) ==
4.  ALL SHAPES FULLY ENCLOSED: Every visible area must be a closed, bounded region suitable for flood-fill coloring. No open paths, no incomplete shapes.
5.  OVERLAP RULE: When elements overlap, each resulting visible region must STILL form a fully enclosed colorable area. The intersection creates new bounded shapes - each one must be closed.
6.  ROUNDED SOFT FORMS: Use rounded, soft forms only. Avoid sharp angular shapes. Edges should be curved and friendly.

== MARKETABILITY & COLORING APPEAL ==
7.  LARGE READABLE SHAPES: Design shapes that BEG to be colored. Include a satisfying mix of:
    - 2-3 LARGE, simple anchor shapes for quick coloring wins.
    - Medium-sized shapes for engaging detail work.
    - Avoid tiny details, microscopic elements, or cluttered repeating patterns.
8.  VISUAL FLOW: Guide the eye through the composition. Avoid "floating object syndrome" where elements feel randomly scattered. Connect elements visually (overlapping, proximity, shared ground lines).
9.  MEANINGFUL OPEN SPACES: Instead of empty voids, make open areas part of the scene (e.g., clear sky, calm water, smooth tabletop). These give the colorist rest areas that feel intentional.
10. THE "COLORING SATISFACTION FACTOR": Imagine someone coloring this with markers. Are there enough medium-large areas to feel productive? Are shapes readable and easy to color? Optimize for this feeling.

== TECHNICAL CONSTRAINTS ==
11. TOPOLOGY: Closed, watertight paths for digital flood fill. All regions must be clearly bounded.
12. NO BLACK FILLS: All distinct regions must be white/empty for the user to color. No solid black areas.
13. NO SHADING TEXTURES: Absolutely no stippling, hatching, cross-hatching, halftone, dithering, dots-for-shading, texture strokes, or sketch lines.
14. NO THIN DETAILS: Avoid thin lines, fine details, or tiny repeating patterns. Keep everything large and readable.
15. SEPARATION: Maintain 3-5mm minimum gap between unrelated lines. Avoid tangents (near-touching lines).
16. SCALE & PROPORTION: Objects must have realistic relative proportions. Anchor scene with primary subject and scale everything else appropriately.
17. NO TEXT OR WATERMARKS (unless explicitly requested).

== THE ARTIST'S TOUCH ==
18. MOOD: Cute, playful, cozy, joyful. The illustration should feel warm and inviting.
19. NARRATIVE MOMENT: Every page should capture a "moment" or tell a micro-story. A cat isn't just sitting; it's "napping in a sunbeam."
20. DELIGHTFUL DETAILS: Add one small, surprising, or charming detail that fits the theme and rewards close inspection.

== ANATOMICAL INTEGRITY ==
21. CORRECT LIMB COUNT: Humans have exactly 2 arms and 2 legs. Animals match their species (dogs: 4 legs, birds: 2 wings, octopus: 8 tentacles).
22. HANDS & FEET: Unless stylized (mitten hands, paws), humans have 5 fingers per hand and 5 toes per foot.
23. FACIAL FEATURES: Faces are symmetric with 2 eyes, 1 nose, 1 mouth in anatomically correct positions.
24. NO MUTATIONS: No extra limbs, fused body parts, floating appendages, or distorted anatomy.

== PHYSICAL COHERENCE ==
25. NATURAL POSES: Limbs must be in physically possible positions. Joints bend in correct directions only.
26. CLEAR BOUNDARIES: Bodies do NOT merge into objects, furniture, or backgrounds. A character sits ON a chair, not fused with it.
27. PROPER LAYERING: When objects overlap, one is clearly in front with logical occlusion - and BOTH resulting visible regions remain closed colorable shapes.
28. GROUNDED ELEMENTS: Objects and characters appear grounded unless intentionally floating (flying birds, balloons).

== LINE AESTHETIC SUMMARY ==
The illustration should look like it was drawn with a FELT-TIP PEN by a skilled artist:
- Thick, rounded, slightly wiggly outlines
- Hand-drawn and imperfect, NEVER vector-clean
- Gentle natural line variation
- Confident but organic strokes
`;

export const buildPrompt = (
  userSubject: string,
  styleKey: string,
  complexityKey: string,
  includeText: boolean = false,
  audiencePrompt: string = '',
  audienceLabel: string = '', // For precise border logic
  styleDNA?: import('../../types').StyleDNA | null, // Forensic analysis results
  characterDNA?: import('../../types').CharacterDNA | null // Hero character DNA for consistency
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
    color, coloured, colorful, photography, photorealistic, 3d render,
    gradient, shadow, ambient occlusion, greyscale, gray,
    blurry, low resolution, jpeg artifacts, pixelated,
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
    negativePrompts += `, hatching, cross-hatching, stippling, halftone, dithering, dots used for shading, engraving texture, etching texture, scratchy shading, scribble shading, texture used as shading, micro-texture, microscopic details, ultra fine noise, texture strokes, sketch lines`;
  }

  // Apply organic line quality constraints for non-vector styles
  if (style.organicLineQuality) {
    negativePrompts += `, vector-clean lines, computer-perfect strokes, mechanical precision, ruler-straight lines, sterile digital look`;
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
  const kidFriendlyStyles = ['Cozy Hand-Drawn', 'Bold & Easy', 'Kawaii', 'Cartoon', 'Whimsical', 'Cozy'];

  // Logic: Young audience GETS a border. Low complexity GETS a border (if style fits). 
  // We expand the "kid friendly" check to strict audience check.
  const shouldHaveBorder = isYoungAudience || (isLowComplexity && kidFriendlyStyles.includes(styleKey));

  const bordersInstruction = shouldHaveBorder
    ? 'Include a thick, rounded decorative border frame. Border thickness must match main outlines. Soft rounded corners. 5-8% internal padding.'
    : '';

  // Positive reinforcements for critical constraints (helps model follow rules)
  const POSITIVE_REINFORCEMENTS = `
LINE STYLE: Thick, rounded, slightly wiggly outlines - hand-drawn felt-tip pen aesthetic, NEVER vector-clean.
TEXTURE BAN: No shading, no crosshatching, no stippling, no texture strokes, no sketch lines.
CLOSURE RULE: All shapes fully enclosed and colorable. Overlapping elements must still form closed areas.
SHAPE QUALITY: Rounded soft forms only. Large readable shapes for easy coloring. NO thin details or tiny patterns.
DRAW WITH: Closed watertight paths suitable for digital flood fill.
PRESERVE: 8-10% blank margin on all edges - nothing touches the border.
BACKGROUND: Pure white paper (#FFFFFF) - no cream, beige, or texture.
COMPOSITION: Connect elements visually to avoid floating object syndrome.
SATISFACTION: Include a mix of large anchor shapes and medium detail areas. Avoid microscopic elements.
MOOD: Cute, playful, cozy, joyful.
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

  // Character DNA Reference - for hero consistency across multiple pages
  const characterDNASection = characterDNA && characterDNA.name ? `
[CHARACTER REFERENCE: ${characterDNA.name}]
You MUST maintain absolute visual consistency with this character throughout:
- Role: ${characterDNA.role || 'Not specified'}
- Age: ${characterDNA.age || 'Not specified'}
- Face: ${characterDNA.face || 'Not specified'}
- Eyes: ${characterDNA.eyes || 'Not specified'}
- Hair: ${characterDNA.hair || 'Not specified'}
- Body: ${characterDNA.body || 'Not specified'}
- Signature Features: ${characterDNA.signatureFeatures || 'None'}
- Outfit: ${characterDNA.outfitCanon || 'Not specified'}

CRITICAL: Every detail above MUST appear consistently on every page. Do not omit or alter signature features.
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
${characterDNASection}
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