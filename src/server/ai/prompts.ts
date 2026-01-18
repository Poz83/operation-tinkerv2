import {
  CharacterDNA,
  StyleDNA,
  CinematicOption,
  VISUAL_STYLES,
  TARGET_AUDIENCES
} from '../../types';

// 1. STYLE DICTIONARY
const STYLE_SPECS: Record<string, string> = {
  'Bold & Easy': 'thick uniform vector lines (4px-6px), high contrast, minimal detail, sticker art style, bold outlines, no tiny gaps, white background',
  'Cozy Hand-Drawn': 'organic ink bleed, imperfect wobble, warm feeling, rounded corners, thick felt-tip pen texture, hygge aesthetic, whimsical but clean',
  'Kawaii': 'chibi style, super deformed, rounded proportions, thick soft lines, sparkles, simple vector art, cute eyes',
  'Botanical': 'scientific botanical illustration, fine liner pen, cross-hatching shading, highly detailed organic textures, vintage biology textbook style',
  'Mandala': 'radial symmetry, geometric patterns, fractals, precise mathematical lines, zentangle patterns, meditative complexity',
  'Gothic': 'stained glass window style, thick lead lines, heavy black outlines, intricate segmentation, angular shapes, medieval woodcut',
  'default': 'standard coloring book page, clear black lines, white background'
};

// 2. AUDIENCE PHYSICS (Engineering Constraints)
const AUDIENCE_RULES: Record<string, string> = {
  'toddlers': 'CRITICAL: Ultra-low detail. Giant shapes only. Line weight 8px minimum. No background details. Zoomed in. No tiny artifacts.',
  'preschool': 'Very simple shapes. Clear separation. Minimal background. Thick lines.',
  'kids': 'Standard coloring book complexity. Clear separation of shapes. Storytelling elements. Medium line weight. No shading.',
  'teens': 'Dynamic poses, moderate detail, stylish lines. Pop culture aesthetic.',
  'adults': 'High intricacy. Fine liner detail (0.5mm). Complex patterns. Mindfulness texture. Detailed background allowed.',
  'seniors': 'High clarity. Large distinct sections. Very clear separation between elements. Readable shapes. No visual clutter.',
  'sen': 'Sensory friendly. Predictable patterns. No chaos. Soothing geometry.'
};

// 3. AUDIENCE TONE GUIDE (The "Universe" Rules)
const AUDIENCE_TONE_GUIDE: Record<string, string> = {
  'toddlers': '[TONE: INNOCENT & JOYFUL] Emotions: Pure happiness. Conflict: None. Scary: FORBIDDEN.',
  'preschool': '[TONE: FRIENDLY & DISCOVERY] Emotions: Wonder. Scary: "Scooby-Doo" level (cute ghosts).',
  'kids': '[TONE: ADVENTUROUS & FUN] Emotions: Excitement. Scary: "Goosebumps" level. NO GORE.',
  'teens': '[TONE: STYLISH & RELATABLE] Emotions: Cool, dramatic. Scary: PG-13 Horror allowed.',
  'adults': '[TONE: SOPHISTICATED] Emotions: Complex, serene. Scary: Horror/Dark Fantasy allowed.',
  'seniors': '[TONE: NOSTALGIC & DIGNIFIED] Emotions: Peaceful. Avoid aggressive imagery.',
  'sen': '[TONE: CALM & PREDICTABLE] Emotions: Soothing. Avoid surprises.'
};

// 4. THE NUCLEAR NEGATIVE PROMPT (Universal Bans)
const UNIVERSAL_NEGATIVE = `
  // --- MOCKUP & PHOTO BANS (The "Table" Fix) ---
  photo, photograph, photorealistic, realism, 
  staged scene, flatlay, flat lay, product shot, promotional shot,
  table, desk, wood, wooden surface, fabric, tablecloth,
  pencils, pens, crayons, markers, brushes, art supplies,
  shadow, drop shadow, contact shadow, vignette, depth of field,
  angled view, perspective shot, tilt shift,
  
  // --- TEXTURE & PAPER BANS (The "Cream" Fix) ---
  paper texture, aged paper, vintage paper, parchment,
  cream paper, off-white background, yellowed paper,
  cardboard, canvas texture, grain, noise, dither,
  
  // --- COLOR & 3D BANS (The "Glasses" Fix) ---
  color, colored, colorful, pigment, paint, watercolor,
  red, blue, green, yellow, pink, purple,
  anaglyph, stereoscopic, chromatic aberration, 3d glasses effect,
  colored fill, grey fill, multi-colored,
  
  // --- DRAWING ARTIFACTS ---
  grayscale, shading, gradients, 3d render, 3d style,
  sketch lines, pencil lead, graphite, smudge,
  double lines, open shapes, broken lines, fuzzy edges,
  
  // --- CONTENT BANS ---
  text, watermark, signature, logo, date,
  human, people, man, woman, person, face, skin (unless explicitly prompted),
  deformed hands, extra fingers, distorted face
`;

// Helper: Smart Contextual Cleaning
const getContextualNegatives = (prompt: string): string => {
  const p = prompt.toLowerCase();
  const negatives: string[] = [];

  // If Indoors, ban nature debris to prevent "leaves in kitchen"
  if (p.includes('room') || p.includes('kitchen') || p.includes('inside') || p.includes('indoor')) {
    negatives.push('sky', 'clouds', 'sun', 'moon', 'grass', 'trees', 'mountains');
  }

  // If Underwater, ban fire/dust
  if (p.includes('underwater') || p.includes('ocean') || p.includes('sea')) {
    negatives.push('fire', 'smoke', 'dust', 'fur', 'feathers');
  }

  return negatives.join(', ');
};

interface PromptContext {
  userPrompt: string;
  styleId: string;
  audienceId: string;
  heroDNA?: CharacterDNA;
  styleDNA?: StyleDNA;
}

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

  // A. Resolve Constraints
  const techSpecs = STYLE_SPECS[styleId] || STYLE_SPECS['default'];
  const audiencePhysics = AUDIENCE_RULES[audienceId] || AUDIENCE_RULES['kids'];
  const toneInstructions = AUDIENCE_TONE_GUIDE[audienceId] || AUDIENCE_TONE_GUIDE['kids'];

  // B. Hero Logic & Scale Locking (Backward Compatible)
  let subject = userPrompt;
  let heroConstraint = "";

  if (heroDNA) {
    subject = `
      PRIMARY SUBJECT: ${heroDNA.name} (${heroDNA.role}).
      APPEARANCE: ${heroDNA.body}, ${heroDNA.face}, ${heroDNA.hair}.
      OUTFIT: ${heroDNA.outfitCanon}.
      ACTION: ${userPrompt}
    `.trim();

    heroConstraint = `
      [CHARACTER RULES]
      1. SPECIES LOCK: Subject is strictly '${heroDNA.name}'. DO NOT morph into a human.
      2. SCALE LOCK: The character establishes the scale. All props (fruit, items, furniture) must be realistic size relative to the character.
      3. SOLO FOCUS: Unless the prompt asks for a friend, draw ONLY the main character. No random sidekicks.
    `;
  }

  // C. Forensic Style Override (Backward Compatible)
  let finalStyle = techSpecs;
  if (styleDNA) {
    finalStyle = `
      Mimic this specific style:
      Line Weight: ${styleDNA.lineWeight}.
      Density: ${styleDNA.density}.
      Technique: ${styleDNA.lineStyle}.
      ${styleDNA.promptFragment || ''}
    `;
  }

  // D. Final Assembly

  // [NEW] The "Compliance Footer" - Forces the model to check this LAST
  const complianceFooter = `
    [FINAL COMPLIANCE CHECK]
    1. VIEW CHECK: Is this a digital vector file? (YES) Is this a photo of paper? (NO)
    2. COLOR CHECK: Is the image 100% Black & White? (YES) Is there any red/blue/gray? (NO)
    3. CONTENT CHECK: Are there humans? (NO - unless prompted)
    
    CRITICAL: If the image looks like a photo of a drawing on a table, YOU HAVE FAILED. 
    Output strictly the vector line art on a pure white canvas (#FFFFFF).
  `;

  // We wrap the instructions to enforce "Digital Vector" mode
  const fullPrompt = `
    ROLE: You are a vector line art generator.
    TASK: Generate a strictly 2D, BLACK AND WHITE, digital vector line drawing.
    
    [CRITICAL FORMATTING]
    1. VIEW: Direct digital 2D view. NOT a photo of paper. NO angles.
    2. COLOR: Pure Black (#000000) on Pure White (#FFFFFF). NO gray. NO color.
    3. CANVAS: Full usage of canvas. No borders or frames.
    
    [SUBJECT MATTER]
    ${subject}

    [ARTISTIC STYLE]
    ${finalStyle}

    [AUDIENCE & PHYSICS]
    Audience: ${audienceId}
    Physics: ${audiencePhysics}
    ${toneInstructions}
    
    [TECHNICAL CONSTRAINTS]
    Constraint: All shapes must be closed/watertight for flood-fill.
    
    ${heroConstraint}

    ${complianceFooter}
  `;

  // E. Dynamic Negatives
  let dynamicNegative = UNIVERSAL_NEGATIVE;

  // Contextual Hygiene
  const contextNeg = getContextualNegatives(userPrompt);
  if (contextNeg) dynamicNegative += `, ${contextNeg}`;

  // Dynamic Snail Ban
  if (!userPrompt.toLowerCase().includes('snail')) {
    dynamicNegative += ", snail, slug, insect, mascot";
  }

  return {
    fullPrompt: fullPrompt.replace(/\s+/g, ' ').trim(),
    fullNegativePrompt: dynamicNegative.replace(/\s+/g, ' ').trim()
  };
};

export const STYLE_RULES: Record<string, { recommendedTemperature?: number, allowsTextureShading?: boolean }> = {
  'Bold & Easy': { recommendedTemperature: 0.7, allowsTextureShading: false },
  'Cozy Hand-Drawn': { recommendedTemperature: 0.9, allowsTextureShading: false },
  'Kawaii': { recommendedTemperature: 0.8, allowsTextureShading: false },
  'Botanical': { recommendedTemperature: 0.7, allowsTextureShading: true },
  'Mandala': { recommendedTemperature: 0.5, allowsTextureShading: false },
  'default': { recommendedTemperature: 1.0, allowsTextureShading: false }
};

export const SYSTEM_INSTRUCTION = "You are a professional coloring book artist.";