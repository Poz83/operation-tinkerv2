import {
  CharacterDNA,
  StyleDNA,
  CinematicOption,
  VISUAL_STYLES,
  TARGET_AUDIENCES
} from '../../types';

// 1. UNIVERSAL HEADER (v3.0 - Global Rules)
const UNIVERSAL_HEADER = `
CRITICAL REQUIREMENTS FOR ALL OUTPUT:
═══════════════════════════════════════
You are generating BLACK AND WHITE LINE ART for a colouring book.

ABSOLUTE RULES:
1. OUTPUT ONLY: Black lines (#000000) on white background (#FFFFFF)
2. NO solid black filled areas—everything is OUTLINE ONLY
3. NO grey tones, NO gradients, NO shading, NO rendering
4. ALL shapes must be CLOSED (fully enclosed regions)
5. Every white space must be a colourable region
6. Pupils, shadows, dark areas = outlined shapes, NOT filled black

The purpose is to create line art that users will colour in.
Every area that appears "black" in reference images must be
converted to an outlined region that can be coloured.

Now follow these style-specific instructions:
═══════════════════════════════════════
`.trim();

// 2. STYLE SPECIFICATIONS (v3.0 - Professional Manual)
const STYLE_SPECS: Record<string, string> = {
  'Cozy Hand-Drawn': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Organic, slightly wobbly strokes simulating a 0.5mm felt-tip pen. Natural pressure variation (0.4–0.7mm width). Imperfect, hand-drawn aesthetic—NOT vector-perfect.
LINE WEIGHT: 0.5mm nominal.
CORNERS: Rounded, soft transitions. No sharp angles.
CLOSURE: All shapes fully enclosed despite organic wobble. Line endpoints must connect.
MINIMUM REGION: 4mm².
AESTHETIC GOAL: Warm, rustic, approachable. The charm is in the imperfection.
DO: Slightly uneven lines, gentle curves, cosy domestic subjects.
DO NOT: Perfectly straight lines, geometric precision, sharp corners, any filled/solid black areas.
  `.trim(),

  'Bold & Easy': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Thick, uniform strokes simulating a 4mm chisel marker. Smooth, confident curves. Maximum simplicity.
LINE WEIGHT: 4mm consistent—no variation.
MINIMUM GAP: 2mm between any parallel lines.
CLOSURE: All shapes fully enclosed. No gaps.
MINIMUM REGION: 8mm² (no tiny spaces).
MAXIMUM REGIONS: 50 total for entire image.
AESTHETIC GOAL: Simple, bold, high-contrast. Readable at arm's length. Sticker-art clarity.
DO: Large simple shapes, thick confident lines, minimal detail.
DO NOT: Fine details, intricate patterns, thin lines, small enclosed spaces, any filled/solid black areas.
  `.trim(),

  'Kawaii': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Thick, smooth, uniform vector curves. Friendly and approachable.
LINE WEIGHT: 3mm consistent throughout.
CORNER RADIUS: Minimum 2mm on ALL corners—nothing sharp.
CLOSURE: All shapes fully enclosed with seamless joins.
MINIMUM REGION: 6mm².
PROPORTIONS: Chibi style—1:2 head-to-body ratio for characters. Oversized heads.
EYES: Large (30–40% of face width). Include 1–2 circular highlight areas as separate enclosed regions (NOT filled white—left as colourable space).
AESTHETIC GOAL: Cute, round, soft, cheerful.
DO: Rounded everything, simple expressions, oversized features, mitten-hands acceptable.
DO NOT: Sharp angles, realistic proportions, detailed anatomy, filled black areas (including pupils—outline only).
  `.trim(),

  'Whimsical': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Flowing, gestural strokes with expressive width variation. Suggests movement and magic.
LINE WEIGHT: Variable 0.5mm–2mm. Thicker for emphasis/foreground, thinner for detail/background.
CLOSURE: ALL paths must close completely despite gestural quality. No open strokes.
MINIMUM REGION: 5mm².
AESTHETIC GOAL: Fairy-tale storybook illustration. Dreamlike, magical, gently surreal.
PERMITTED: Exaggerated scale, whimsical architecture, floating elements, curved horizons.
DO: Flowing lines, magical subjects, enchanted scenes, playful distortion.
DO NOT: Open-ended strokes, incomplete shapes, fading lines, any solid black fills, realistic proportions.
  `.trim(),

  'Cartoon': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Dynamic strokes with purposeful tapering. Thick outer contours define silhouette; thinner inner lines define features.
LINE WEIGHT HIERARCHY: Outer silhouette 2–3mm, secondary forms 1–1.5mm, fine details 0.8mm minimum.
CLOSURE: All shapes fully enclosed. Contour lines must connect cleanly.
MINIMUM REGION: 5mm².
AESTHETIC GOAL: Western animation cel style. Clear silhouettes, dynamic poses, energetic.
POSES: Exaggerated action, clear "line of action," strong silhouette readability.
DO: Bold outlines, expressive shapes, dynamic poses, clear shape hierarchy.
DO NOT: Static poses, tangent lines, ambiguous silhouettes, any solid black fills, rendering/shading.
  `.trim(),

  'Botanical': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Fine, precise strokes simulating copperplate engraving. Controlled and elegant.
LINE WEIGHT: 0.3mm primary contours.
TEXTURE INDICATION: Use STIPPLING (scattered dots) or OPEN HATCHING (parallel lines that do NOT enclose regions) to suggest form. Dots and hatch lines are decorative only—they must not create colourable sub-regions.
CLOSURE: All plant structures (leaves, petals, stems) must form closed colourable regions.
MINIMUM REGION: 3mm².
WHITE SPACE: Maintain 60%+ open white space within each plant form.
AESTHETIC GOAL: Victorian scientific illustration. Precise, elegant, botanically informed.
DO: Fine controlled lines, accurate plant anatomy, delicate detail, stipple dots for texture.
DO NOT: Solid black areas, closed hatching, dense rendering, grey tones, any fills.
  `.trim(),

  'Mandala': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Precise vector strokes with perfect geometric accuracy. Mathematical symmetry.
LINE WEIGHT: 1mm primary radial divisions, 0.5mm secondary pattern lines.
SYMMETRY: Radial symmetry MANDATORY (8-fold, 12-fold, or 16-fold). Perfect rotational repetition.
STRUCTURE: Concentric bands radiating from defined centre point. Each band contains repeating pattern elements.
CLOSURE: All segments fully enclosed. Geometric construction ensures closure.
MINIMUM REGION: 4mm².
OUTER BOUNDARY: Complete circle or regular polygon required.
AESTHETIC GOAL: Meditative, balanced, geometrically perfect.
DO: Perfect symmetry, repetitive patterns, concentric organisation, clean geometry.
DO NOT: Asymmetry, organic variation, any solid black fills, incomplete patterns.
  `.trim(),

  'Zentangle': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Consistent, confident ink-style strokes. High contrast, uniform weight.
LINE WEIGHT: 0.8mm consistent.
STRUCTURE: Divide composition into sections ("strings"). Each string is a closed region. Fill strings with decorative patterns.
PATTERN RULES: Patterns (dots, parallel lines, curves, grids) suggest texture but must NOT create enclosed sub-regions smaller than minimum. Pattern elements are decorative marks, not boundaries.
CLOSURE: Each string section must be a closed, colourable region.
MINIMUM REGION: 4mm² for string sections.
AESTHETIC GOAL: Structured doodling. Meditative, rhythmic, abstract.
DO: Bold section divisions, decorative pattern fills, rhythmic repetition.
DO NOT: Patterns that create tiny enclosed spaces, solid black fills, representational imagery, shading.
  `.trim(),

  'Fantasy': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Detailed ink work with weight variation suggesting drama and depth.
LINE WEIGHT: 1.5mm shadow-side contours, 0.5mm light-side contours, 0.3mm fine detail minimum.
LIGHTING CONVENTION: Suggest single dramatic light source through line weight ONLY. Shadow side = thicker lines. NO solid black shadows.
CLOSURE: All forms fully enclosed despite intricate detail.
MINIMUM REGION: 3.5mm².
PROPORTIONS: Heroic (8–9 head heights for humanoid figures).
AESTHETIC GOAL: Classic RPG/fantasy illustration. Dramatic, detailed, epic.
SUBJECTS: Warriors, mages, dragons, mythical creatures, armour, weapons, magical effects.
DO: Line weight variation for drama, intricate costume detail, heroic poses.
DO NOT: Solid black shadows, filled areas, modern elements, grey tones, actual shading.
  `.trim(),

  'Gothic': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Very thick, angular strokes simulating stained glass leading or woodcut lines.
LINE WEIGHT: 5mm minimum for ALL lines. No line thinner than 3mm permitted.
STRUCTURE: Image compartmentalised into distinct segments like stained glass panels.
CORNERS: Angular preferred. Minimum curve radius 10mm where curves occur.
CLOSURE: Mandatory—compartmentalised structure inherently creates closed regions.
MINIMUM REGION: 15mm² (large segments required due to thick lines).
AESTHETIC GOAL: Medieval stained glass or woodcut. Bold, angular, dramatic.
DO: Thick bold lines, angular shapes, compartmentalised composition, dramatic subjects.
DO NOT: Thin lines, fine detail, soft curves, any solid black fills, grey tones.
  `.trim(),

  'Cozy': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Soft, rounded strokes with gentle, warm quality. Approachable and comforting.
LINE WEIGHT: 1.5mm with softened endpoints (rounded line caps).
CORNERS: No angles sharper than 90°. Prefer curves. Minimum 3mm radius on all corners.
CLOSURE: All shapes fully enclosed.
MINIMUM REGION: 6mm².
AESTHETIC GOAL: Hygge/comfort illustration. Warm, soft, domestic, peaceful.
SUBJECTS: Cosy interiors, comfort food, pets, blankets, beverages, candles, books, soft furnishings.
DO: Rounded shapes, plump forms, gentle curves, domestic warmth.
DO NOT: Sharp angles, cold subjects, harsh contrasts, industrial elements, any solid black fills.
  `.trim(),

  'Geometric': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Perfectly straight ruler lines ONLY. Absolute precision.
LINE WEIGHT: 0.8mm consistent throughout.
CONSTRUCTION: ZERO curves permitted. Entire image composed of straight-edged triangles and convex polygons.
CLOSURE: Inherent to geometric construction—all polygons closed.
MINIMUM REGION: 5mm².
VERTICES: Clean, precise intersections at polygon meeting points.
AESTHETIC GOAL: Low-poly, faceted, crystalline, digital.
DO: Straight lines only, triangular tessellation, clean vertices, mathematical precision.
DO NOT: Any curved lines whatsoever, organic shapes, soft transitions, any solid black fills.
  `.trim(),

  'Wildlife': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Naturalistic contour drawing with directional strokes indicating texture.
LINE WEIGHT: 1mm primary contours, 0.4mm texture indication lines.
TEXTURE TECHNIQUE: Use line DIRECTION to suggest fur grain, feather barbs, scale patterns. Texture lines indicate direction only—they must remain OPEN-ENDED within regions, not enclosing sub-spaces.
CLOSURE: All animal body regions (head, body, limbs, tail) must be closed colourable shapes.
MINIMUM REGION: 4mm².
WHITE SPACE: Maintain 70%+ open white space. Do not over-render.
ANATOMY: Accurate proportions for species identification.
AESTHETIC GOAL: Naturalist field guide illustration. Scientific yet artistic.
DO: Accurate anatomy, directional texture strokes, natural poses, habitat elements.
DO NOT: Solid black areas, over-rendering to dark, closed texture patterns, grey tones, any fills.
  `.trim(),

  'Floral': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Flowing, continuous Art Nouveau "whiplash" curves. Elegant, sinuous, organic.
LINE WEIGHT: 1.2mm consistent, slightly thicker (1.5mm) at curve peaks.
COMPOSITION: Interlocking plant elements filling the frame. Vines, leaves, flowers weave together.
CLOSURE: All floral elements form closed colourable regions.
MINIMUM REGION: 4mm².
SPACE FILLING: Minimal empty background—fill negative space with secondary elements (small leaves, buds, tendrils).
AESTHETIC GOAL: Art Nouveau decorative pattern. Flowing, organic, elegant.
DO: Continuous flowing lines, interlocking organic forms, rhythmic curves, dense composition.
DO NOT: Rigid geometric shapes, isolated floating elements, sharp angles, any solid black fills.
  `.trim(),

  'Abstract': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Fluid, continuous, expressive strokes with intentional variation.
LINE WEIGHT: Variable 0.5mm–2.5mm based on compositional emphasis.
CLOSURE: ALL lines must form closed regions despite abstract nature. No open-ended strokes.
MINIMUM REGION: 5mm².
COMPOSITION: Non-representational. Focus on shape relationships, negative space, visual rhythm, movement.
AESTHETIC GOAL: Abstract line composition. Balanced, dynamic, visually engaging.
DO: Overlapping forms, interlocking shapes, continuous paths, compositional balance.
DO NOT: Recognisable subjects, representational imagery, open strokes, any solid black fills.
  `.trim(),

  'Realistic': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Clean, precise, uniform strokes. Pure contour—form described through outline only.
LINE WEIGHT: 0.6mm consistent throughout. TRUE Ligne Claire—no weight variation.
CLOSURE: All forms cleanly closed with precise endpoint connections.
MINIMUM REGION: 4mm².
PROPORTIONS: Anatomically correct. Adult figures 7.5–8 head heights. Accurate perspective.
STYLE: Ligne Claire (Hergé/Tintin influence). Form through contour alone.
AESTHETIC GOAL: Clean, precise, professional technical illustration.
DO: Uniform line weight, accurate anatomy, correct perspective, clean closures.
DO NOT: Line weight variation, hatching, cross-hatching, shading, rendering, any solid black fills.
  `.trim(),

  'default': `
OUTPUT: Black line art on white background. No fills, no shading.
LINE CHARACTER: Clean, continuous vector strokes. Professional, neutral, versatile.
LINE WEIGHT: 1mm consistent throughout.
MINIMUM GAP: 1.5mm between parallel lines.
CLOSURE: All regions fully enclosed. No gaps.
MINIMUM REGION: 5mm².
TARGET REGIONS: 80–120 distinct colourable regions.
AESTHETIC GOAL: Standard commercial colouring book. Clean, clear, broadly appealing.
DO: Clear shapes, consistent lines, unambiguous regions.
DO NOT: Stylistic flourishes, texture rendering, any solid black fills, grey tones.
  `.trim()
};

// 3. COMPLEXITY GUIDES (Engineering-Grade Physics)
// Keeps the "How much stuff" logic separate from "How to draw" logic
const COMPLEXITY_GUIDES: Record<string, string> = {
  'Very Simple': 'Physics: "Fat Marker" Standard. Constraint: Maximum 3-5 major shapes. Min Gap: 5mm (crayon safe). Internal Detail: ZERO. No patterns, no shading. Focus: Instant recognition.',
  'Simple': 'Physics: "Standard Marker" Standard. Constraint: Clear separation between elements. Min Gap: 3mm. Internal Detail: Minimal (only defining features like eyes/mouth). Background: Sparse or empty.',
  'Moderate': 'Physics: "Sharp Pencil" Standard. Constraint: Balanced foreground/background interactions. Min Gap: 1mm. Internal Detail: Standard coloring book level. Use variation in line weight to separate forms.',
  'Intricate': 'Physics: "Fine Liner" Standard. Constraint: High element density. Textures: Allowed (fur, wood grain, leaves). Min Gap: 0.5mm. Focus: Engaging for adults, requiring fine motor control.',
  'Extreme Detail': 'Physics: "Micro-Pen" Standard. Constraint: Fractal subdivision. Fill 90% of negative space with patterns (Zentangle-style). Recursive detail: large shapes should contain smaller shapes. "Hidden Object" density.'
};

// 4. VALIDATION CHECKLIST (v3.0 - QA Layer)
const VALIDATION_CHECKLIST = {
  universal: [
    'ONLY black (#000000) lines present—no grey, no other colours',
    'Background is pure white (#FFFFFF)—no off-white, no texture',
    'ZERO solid black filled areas anywhere in image',
    'ZERO grey tones or gradients anywhere',
    'ALL paths fully closed (no gaps exceeding 0.1mm)',
    'NO regions below style-specified minimum size',
    'Total region count between 30–150',
    'No unintended micro-regions from line intersections',
    'Output resolution: 300 DPI at target print size',
    'All lines clearly separated (no merged strokes)',
  ],
  styleSpecific: {
    'Bold & Easy': ['Line weight consistently 4mm (no thin lines)', 'Region count under 50', 'Minimum gap 2mm verified', 'No fine detail present'],
    'Botanical': ['Stipple dots do NOT form enclosed regions', 'Hatch lines are OPEN-ENDED (not closing spaces)', 'White space exceeds 60% within plant forms'],
    'Zentangle': ['Pattern marks do NOT create sub-regions', 'Each string section independently closed', 'No pattern area smaller than 4mm²'],
    'Geometric': ['ZERO curved lines (absolute requirement)', 'All shapes are straight-edged polygons', 'Clean vertex intersections'],
    'Wildlife': ['Texture lines are directional strokes, NOT boundaries', 'No texture line encloses a sub-region', 'White space exceeds 70%'],
    'Gothic': ['No line thinner than 3mm', 'All regions exceed 15mm²', 'Compartmentalised structure verified'],
    'Realistic': ['Line weight uniform throughout (0.6mm)', 'No hatching or cross-hatching present', 'No rendering or tonal indication'],
    'Kawaii': ['All corners rounded (2mm+ radius)', 'Eye highlights are enclosed regions, NOT filled white', 'No sharp angles present'],
  }
};

// 5. AUDIENCE PHYSICS (Narrative Rules)
const AUDIENCE_RULES: Record<string, string> = {
  'toddlers': 'The subject must be isolated and instantly recognizable. Zero background noise. Use massive shapes.',
  'preschool': 'Use simple storytelling scenes with clearly defined characters. Avoid clutter.',
  'kids': 'Create a fun, dynamic scene. Standard complexity is appropriate.',
  'teens': 'Use stylish, "cool" aesthetics. Dynamic poses and pop-culture vibes are welcome.',
  'adults': 'Prioritize artistic beauty and sophistication. Complex patterns are encouraged.',
  'seniors': 'Ensure high visibility. Use distinct sections and avoid tiny, hard-to-see details.',
  'sen': 'Predictability is key. Avoid chaotic elements or "busy" areas. Keep it calming.'
};

// 6. THE BASE NEGATIVE (Strict Safety Net)
const BASE_NEGATIVE = `
  // --- MOCKUP & PHOTO BANS ---
  photo, photograph, photorealistic, realism, 3d render,
  staged scene, flatlay, product shot,
  pencils, pens, crayons, markers, art supplies on table,
  shadow, drop shadow, vignette,
  
  // --- TEXTURE BANS ---
  crumpled paper, parchment, canvas grain, noise, dither,
  
  // --- COLOR & SHADING BANS (STRICT) ---
  shading, gray, grey, gradient, solid black fill, filled areas, solid blocks,
  color, pigment, paint, watercolor, red, blue, green,
  
  // --- CONTENT BANS ---
  text, watermark, signature, logo, date,
  human face (unless requested), deformed hands, extra fingers
`;

// 7. LINE HIERARCHY (Structural Engineering) - This is now integrated into STYLE_SPECS
// const LINE_HIERARCHY: Record<string, string> = {
//   'default': `
//     - **Contour Lines (Tier 1)**: Use a bold outer boundary (simulated 0.8mm) to separate the subject from the background.
//     - **Structure Lines (Tier 2)**: Use medium weight (0.5mm) for internal forms and clothing folds.
//     - **Detail Lines (Tier 3)**: Use fine lines (0.3mm) for textures, fur, or patterns.
//   `.trim(),
//   'Bold & Easy': `
//     - **Unified Weight**: Use a consistent 4mm line weight for EVERYTHING.
//     - **No Micro-Details**: Do not use thin lines. All lines must be bold.
//   `.trim(),
//   'Botanical': `
//     - **Fine Contours**: Use a delicate 0.3mm contour.
//     - **Texture Mapping**: Use 0.1mm micro-stippling for form definition.
//   `.trim()
// };

// 8. COMPOSITIONAL PHYSICS (Layout Rules) - This is now integrated into STYLE_SPECS or AUDIENCE_RULES
// const COMPOSITIONAL_PHYSICS: Record<string, string> = {
//   'toddlers': 'Gravity needs to be center-weighted. Keep a 20% safe-zone margin around the edges (no bleeding). Subject must "float" in the center.',
//   'preschool': 'Center focus with mild background elements. Keep margins clear of important details.',
//   'kids': 'Dynamic balanced composition. Fill the frame, but keep the primary action central.',
//   'adults': 'Full-bleed composition allowed. Infinite canvas feel. Complex layering permitted.',
//   'default': 'Balanced composition with standard margins.'
// };

const getContextualNegatives = (prompt: string): string => {
  const p = prompt.toLowerCase();
  const negatives: string[] = [];
  if (p.includes('room') || p.includes('inside')) negatives.push('mountains', 'sun');
  if (p.includes('underwater')) negatives.push('fire', 'smoke', 'dust');
  return negatives.join(', ');
};

export const buildPrompt = (
  userPrompt: string,
  styleId: string,
  complexity: string,
  requiresText: boolean,
  audiencePrompt: string,
  audienceId: string,
  styleDNA?: StyleDNA | null,
  heroDNA?: CharacterDNA
): { fullPrompt: string; fullNegativePrompt: string } => {

  const techSpecs = STYLE_SPECS[styleId] || STYLE_SPECS['default'];
  const complexitySpecs = COMPLEXITY_GUIDES[complexity] || COMPLEXITY_GUIDES['Moderate'];
  const audienceSpecs = AUDIENCE_RULES[audienceId] || AUDIENCE_RULES['kids'];

  // QA Logic
  const specificQA = VALIDATION_CHECKLIST.styleSpecific[styleId as keyof typeof VALIDATION_CHECKLIST.styleSpecific] || [];
  const qaInstructions = [
    ...VALIDATION_CHECKLIST.universal,
    ...specificQA
  ].map(r => `- [ ] ${r}`).join('\n');

  // 1. SUBJECT CONSTRUCTION
  let subjectDescription = userPrompt;
  let characterConsistencyInstruction = "";

  if (heroDNA) {
    subjectDescription = `
      The main subject is ${heroDNA.name}, ${heroDNA.role}.
      Appearance: ${heroDNA.body}, ${heroDNA.face}, ${heroDNA.hair}.
      Outfit: ${heroDNA.outfitCanon}.
      Action: ${userPrompt}.
    `.trim();

    characterConsistencyInstruction = `
      - Ensure the character explicitly matches this description.
      - Do not morph the character into a human if they are an animal.
      - Maintain the scale established by the character.
    `;
  }

  // 2. STYLE & EXECUTION INSTRUCTION
  let styleInstruction = `
    ${techSpecs}
    
    COMPLEXITY PHYSICS:
    ${complexitySpecs}
    
    TARGET AUDIENCE RULES:
    ${audienceSpecs}
  `.trim();

  if (styleDNA) {
    styleInstruction += `\n    **Style Mimicry**: Mimic these attributes: ${styleDNA.lineWeight}, ${styleDNA.density}, ${styleDNA.lineStyle}.`;
  }

  // 3. TEXT INTEGRATION
  let textInstruction = "";
  if (requiresText) {
    const quotedText = userPrompt.match(/"([^"]+)"/)?.[1] || userPrompt;
    textInstruction = `
      **Text Integration**: Incorporate the text "${quotedText}" into the design.
      - The text must be outlined, legible, and colorable (hollow letters).
      - Treat the text as a graphical element within the composition.
    `;
  }

  // 4. THE NARRATIVE PROMPT (v3.0 - Professional Manual Format)
  const fullPrompt = `
    ${UNIVERSAL_HEADER}
    
    ### 1. SUBJECT MATTER
    ${subjectDescription}

    ### 2. STYLE SPECIFICATIONS & EXECUTION
    ${styleInstruction}

    ### 3. TECHNICAL CONSTRAINTS
    - **Line Quality**: Use pure black (#000000) lines on a pure white (#FFFFFF) background.
    - **Closed Shapes**: Ensure all major shapes are closed to allow for easy coloring.
    - **No Shading**: Do NOT apply any gray, shading, gradients, or texture. The inside of shapes should be empty white.
    - **Composition**: Fill the canvas appropriately. Do not add borders or frames.
    ${characterConsistencyInstruction}
    ${textInstruction}

    ### 4. QUALITY ASSURANCE CHECKLIST
    Review your generated image against these rules before finalizing:
    ${qaInstructions}
  `.replace(/\s+/g, ' ').trim(); // Flatten whitespace for token efficiency

  // 5. NEGATIVE PROMPT
  let dynamicNegative = BASE_NEGATIVE;
  const contextNeg = getContextualNegatives(userPrompt);
  if (contextNeg) dynamicNegative += `, ${contextNeg}`;
  if (!userPrompt.toLowerCase().includes('snail')) dynamicNegative += ", snail, slug";

  return {
    fullPrompt,
    fullNegativePrompt: dynamicNegative.replace(/\s+/g, ' ').trim()
  };
};

export const STYLE_RULES: Record<string, any> = {
  // Configs for specific styles if needed (legacy temperature control)
  'Cozy Hand-Drawn': { recommendedTemperature: 0.9, allowsTextureShading: false },
  'Botanical': { recommendedTemperature: 0.7, allowsTextureShading: true },
  'default': { recommendedTemperature: 1.0, allowsTextureShading: false }
};

export const SYSTEM_INSTRUCTION = "You are a professional coloring book artist.";