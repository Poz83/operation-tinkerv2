import {
  CharacterDNA,
  StyleDNA,
  CinematicOption,
  VISUAL_STYLES,
  TARGET_AUDIENCES
} from '../../types';

// 1. STYLE DICTIONARY (Narrative Definitions)
// These instruct the model HOW to draw, using art-direction terminology.
// 1. STYLE DICTIONARY (Engineering-Grade Definition)
// These use specific technical art direction that Gemini 3 Pro can "reason" about.
const STYLE_SPECS: Record<string, string> = {
  'Cozy Hand-Drawn': 'Technical Spec: Simulate a 0.5mm felt-tip pen on textured paper. Line Quality: Organic, slightly wobbly, with natural pressure variation. Aesthetic: Whimsical, rustic, imperfect (non-vector).',
  'Bold & Easy': 'Technical Spec: Simulate a 4mm heavy marker. Line Quality: Uniform width, high contrast, vector-smooth. Constraints: Minimum gap size of 2mm (no tiny spaces). No isolated "island" shapes. Sticker-art look.',
  'Kawaii': 'Technical Spec: Soft vector curves. Line Quality: Thick (approx 3mm) and consistent. Aesthetic: "Chibi" proportions (1:2 head-to-body ratio). Features: Oversized eyes with "shiny" white highlights. Rounded corners everywhere.',
  'Whimsical': 'Technical Spec: Loose, gestural ink wash style. Line Quality: Varying width to suggest movement. Constraints: Dreamlike distortions allowed, but all paths must remain closed. fairy-tale vibe.',
  'Cartoon': 'Technical Spec: Western animation cel style. Line Quality: Dynamic tapering (thick outer contours, thinner inner details). Aesthetic: Exaggerated poses, clear silhouettes, energetic flow.',
  'Botanical': 'Technical Spec: Vintage copperplate engraving style. Line Quality: Fine, precise lines (0.3mm equivalent). Constraints: Use stippling or simple hatching for form, but keep white space open for coloring.',
  'Mandala': 'Technical Spec: Vector precesion with radial symmetry. Line Quality: Consistent distinct weight. Constraints: Perfect geometric alignment. Repetitive, meditative patterns radiating from center.',
  'Zentangle': 'Technical Spec: Structured doodling. Line Quality: High contrast ink. Subject: Fill spaces with specific "tangle" patterns (dots, orbs, hatching) rather than realistic shading.',
  'Fantasy': 'Technical Spec: Classic RPG illustration. Line Quality: Detailed ink work. Aesthetic: Dramatic lighting suggestions via line weight (shadows = thicker lines). Intricate armor/costume details.',
  'Gothic': 'Technical Spec: Stained glass or woodcut effect. Line Quality: Very thick, angular "lead" lines (5mm+). Constraints: Compartmentalized segments. No varying grays, just black and white.',
  'Cozy': 'Technical Spec: Hygge illustration. Line Quality: Soft, rounded, "fuzzy" edges. Aesthetic: Warm, comfortable, domestic. Avoid sharp angles.',
  'Geometric': 'Technical Spec: Low-poly wireframe. Line Quality: Straight ruler lines only. No curves. Aesthetic: Faceted, crystal-like structures composed of triangles and polygons.',
  'Wildlife': 'Technical Spec: Naturalist field sketch. Line Quality: descriptive contour drawing. Texture: Use line direction to suggest fur/feather flow, but do not over-render to black.',
  'Floral': 'Technical Spec: Art Nouveau textile pattern. Line Quality: Flowing, continuous curves (whiplash lines). Constraint: Interlocking plant elements with no dead space.',
  'Abstract': 'Technical Spec: Non-representational line art. Line Quality: Fluid, continuous motion. Focus: Compositional balance and flow rather than anatomy.',
  'Realistic': 'Technical Spec: Academic figure drawing. Line Quality: Refined, anatomical precision. Constraint: Correct proportions and perspective. "Clean line" (Ligne Claire) style.',
  'default': 'Technical Spec: Standard commercial coloring book. Line Quality: Clean, continuous vector lines. Background: Pure white.'
};

// 2. COMPLEXITY GUIDES (Engineering-Grade Physics)
const COMPLEXITY_GUIDES: Record<string, string> = {
  'Very Simple': 'Physics: "Fat Marker" Standard. Constraint: Maximum 3-5 major shapes. Min Gap: 5mm (crayon safe). Internal Detail: ZERO. No patterns, no shading. Focus: Instant recognition.',
  'Simple': 'Physics: "Standard Marker" Standard. Constraint: Clear separation between elements. Min Gap: 3mm. Internal Detail: Minimal (only defining features like eyes/mouth). Background: Sparse or empty.',
  'Moderate': 'Physics: "Sharp Pencil" Standard. Constraint: Balanced foreground/background interactions. Min Gap: 1mm. Internal Detail: Standard coloring book level. Use variation in line weight to separate forms.',
  'Intricate': 'Physics: "Fine Liner" Standard. Constraint: High element density. Textures: Allowed (fur, wood grain, leaves). Min Gap: 0.5mm. Focus: Engaging for adults, requiring fine motor control.',
  'Extreme Detail': 'Physics: "Micro-Pen" Standard. Constraint: Fractal subdivision. Fill 90% of negative space with patterns (Zentangle-style). Recursive detail: large shapes should contain smaller shapes. "Hidden Object" density.'
};

// 3. AUDIENCE PHYSICS (Narrative Rules)
const AUDIENCE_RULES: Record<string, string> = {
  'toddlers': 'The subject must be isolated and instantly recognizable. Zero background noise. Use massive shapes.',
  'preschool': 'Use simple storytelling scenes with clearly defined characters. Avoid clutter.',
  'kids': 'Create a fun, dynamic scene. Standard complexity is appropriate.',
  'teens': 'Use stylish, "cool" aesthetics. Dynamic poses and pop-culture vibes are welcome.',
  'adults': 'Prioritize artistic beauty and sophistication. Complex patterns are encouraged.',
  'seniors': 'Ensure high visibility. Use distinct sections and avoid tiny, hard-to-see details.',
  'sen': 'Predictability is key. Avoid chaotic elements or "busy" areas. Keep it calming.'
};

// 4. THE BASE NEGATIVE (Strict Safety Net)
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

// 5. LINE HIERARCHY (Structural Engineering)
const LINE_HIERARCHY: Record<string, string> = {
  'default': `
    - **Contour Lines (Tier 1)**: Use a bold outer boundary (simulated 0.8mm) to separate the subject from the background.
    - **Structure Lines (Tier 2)**: Use medium weight (0.5mm) for internal forms and clothing folds.
    - **Detail Lines (Tier 3)**: Use fine lines (0.3mm) for textures, fur, or patterns.
  `.trim(),
  'Bold & Easy': `
    - **Unified Weight**: Use a consistent 4mm line weight for EVERYTHING.
    - **No Micro-Details**: Do not use thin lines. All lines must be bold.
  `.trim(),
  'Botanical': `
    - **Fine Contours**: Use a delicate 0.3mm contour.
    - **Texture Mapping**: Use 0.1mm micro-stippling for form definition.
  `.trim()
};

// 6. COMPOSITIONAL PHYSICS (Layout Rules)
const COMPOSITIONAL_PHYSICS: Record<string, string> = {
  'toddlers': 'Gravity needs to be center-weighted. Keep a 20% safe-zone margin around the edges (no bleeding). Subject must "float" in the center.',
  'preschool': 'Center focus with mild background elements. Keep margins clear of important details.',
  'kids': 'Dynamic balanced composition. Fill the frame, but keep the primary action central.',
  'adults': 'Full-bleed composition allowed. Infinite canvas feel. Complex layering permitted.',
  'default': 'Balanced composition with standard margins.'
};

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

  // Structural selection
  const lineHierarchy = LINE_HIERARCHY[styleId] || LINE_HIERARCHY['default'];
  const compositionPhysics = COMPOSITIONAL_PHYSICS[audienceId] || COMPOSITIONAL_PHYSICS['default'];

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
    **Artistic Style**: ${techSpecs}
    **Complexity Level**: ${complexitySpecs}
    **Target Audience**: ${audienceSpecs}
  `.trim();

  if (styleDNA) {
    styleInstruction += `\n    **Style Mimicry**: Mimic these attributes: ${styleDNA.lineWeight}, ${styleDNA.density}, ${styleDNA.lineStyle}.`;
  }

  // 3. STRUCTURAL ENGINEERING INSTRUCTION
  const engineeringInstruction = `
    **Line Hierarchy**:
    ${lineHierarchy}
    
    **Compositional Physics**:
    ${compositionPhysics}
  `.trim();

  // 4. TEXT INTEGRATION
  let textInstruction = "";
  if (requiresText) {
    const quotedText = userPrompt.match(/"([^"]+)"/)?.[1] || userPrompt;
    textInstruction = `
      **Text Integration**: Incorporate the text "${quotedText}" into the design.
      - The text must be outlined, legible, and colorable (hollow letters).
      - Treat the text as a graphical element within the composition.
    `;
  }

  // 5. THE NARRATIVE PROMPT (Gemini 3 Pro Format)
  const fullPrompt = `
    **Role**: You are a professional illustrator creating a high-quality line art coloring page.
    
    **Task**: Generate a strictly 2D, BLACK AND WHITE, UNCOLORED image.

    ### 1. Subject Matter
    ${subjectDescription}

    ### 2. Style & Execution
    ${styleInstruction}

    ### 3. Structural Engineering
    ${engineeringInstruction}

    ### 4. Technical Constraints
    - **Line Quality**: Use pure black (#000000) lines on a pure white (#FFFFFF) background.
    - **Closed Shapes**: Ensure all major shapes are closed to allow for easy coloring.
    - **No Shading**: Do NOT apply any gray, shading, gradients, or texture. The inside of shapes should be empty white.
    - **Composition**: Fill the canvas appropriately. Do not add borders or frames.
    ${characterConsistencyInstruction}
    ${textInstruction}
  `.replace(/\s+/g, ' ').trim(); // Flatten whitespace for token efficiency

  // 6. NEGATIVE PROMPT
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