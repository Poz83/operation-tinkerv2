import {
  CharacterDNA,
  StyleDNA,
  CinematicOption,
  VISUAL_STYLES,
  TARGET_AUDIENCES
} from '../../types';

// 1. STYLE DICTIONARY (Refined for "Cozy" authenticity)
const STYLE_SPECS: Record<string, string> = {
  'Bold & Easy': 'thick uniform vector lines (4px-6px), high contrast, minimal detail, sticker art style, bold outlines, no tiny gaps, white background',
  'Cozy Hand-Drawn': 'fine ink illustration, organic shaky lines, stippling texture, ink bleed, cross-hatching, whimsical storybook aesthetic, intricate details, rustic feel',
  'Kawaii': 'chibi style, super deformed, rounded proportions, thick soft lines, sparkles, simple vector art, cute eyes',
  'Botanical': 'scientific botanical illustration, fine liner pen, cross-hatching shading, highly detailed organic textures, vintage biology textbook style',
  'Mandala': 'radial symmetry, geometric patterns, fractals, precise mathematical lines, zentangle patterns, meditative complexity',
  'Gothic': 'stained glass window style, thick lead lines, heavy black outlines, intricate segmentation, angular shapes, medieval woodcut',
  'default': 'standard coloring book page, clear black lines, white background'
};

// 2. AUDIENCE PHYSICS (Adjusted "Adults" to allow texture)
const AUDIENCE_RULES: Record<string, string> = {
  'toddlers': 'Simple shapes. clear outlines. Bold lines (4px+). minimal detail. Focus on the main subject. Easy to color.',
  'preschool': 'Very simple shapes. Clear separation. Minimal background. Thick lines.',
  'kids': 'Standard coloring book complexity. Clear separation of shapes. Storytelling elements. Medium line weight. No shading.',
  'teens': 'Dynamic poses, moderate detail, stylish lines. Pop culture aesthetic.',
  'adults': 'High intricacy. Fine liner detail. Complex patterns. Texture and shading (stippling/hatching) are ALLOWED for artistic effect.',
  'seniors': 'High clarity. Large distinct sections. Very clear separation between elements. Readable shapes. No visual clutter.',
  'sen': 'Sensory friendly. Predictable patterns. No chaos. Soothing geometry.'
};

// 3. AUDIENCE TONE GUIDE
const AUDIENCE_TONE_GUIDE: Record<string, string> = {
  'toddlers': '[TONE: INNOCENT & JOYFUL] Emotions: Pure happiness. Conflict: None. Scary: FORBIDDEN.',
  'preschool': '[TONE: FRIENDLY & DISCOVERY] Emotions: Wonder. Scary: "Scooby-Doo" level (cute ghosts).',
  'kids': '[TONE: ADVENTUROUS & FUN] Emotions: Excitement. Scary: "Goosebumps" level. NO GORE.',
  'teens': '[TONE: STYLISH & RELATABLE] Emotions: Cool, dramatic. Scary: PG-13 Horror allowed.',
  'adults': '[TONE: SOPHISTICATED] Emotions: Complex, serene. Scary: Horror/Dark Fantasy allowed.',
  'seniors': '[TONE: NOSTALGIC & DIGNIFIED] Emotions: Peaceful. Avoid aggressive imagery.',
  'sen': '[TONE: CALM & PREDICTABLE] Emotions: Soothing. Avoid surprises.'
};

// 4. THE BASE NEGATIVE (Truly Universal Bans)
const BASE_NEGATIVE = `
  // --- MOCKUP & PHOTO BANS (Targeted) ---
  photo, photograph, photorealistic, realism, 
  staged scene, flatlay, flat lay, product shot, promotional shot,
  overhead shot of desk, drafting table background,
  pencils, pens, crayons, markers, brushes, art supplies on table,
  shadow, drop shadow, contact shadow, vignette, depth of field,
  angled view, perspective shot, tilt shift,
  
  // --- TEXTURE BANS (Specific) ---
  crumpled paper, wrinkled paper, parchment texture, 
  cardboard, canvas grain, noise, dither,
  
  // --- COLOR BANS (Strict) ---
  color, colored, colorful, pigment, paint, watercolor,
  red, blue, green, yellow, pink, purple,
  anaglyph, stereoscopic, chromatic aberration, 3d glasses effect,
  colored fill, grey fill, multi-colored,
  
  // --- CONTENT BANS ---
  text, watermark, signature, logo, date,
  human, people, man, woman, person, face, skin (unless explicitly prompted),
  deformed hands, extra fingers, distorted face
`;

// 5. STYLE-SPECIFIC NEGATIVES (The "Switch")
const STYLE_NEGATIVES: Record<string, string> = {
  'Bold & Easy': 'sketch lines, hatching, stippling, texture, shading, grayscale, broken lines, fuzzy edges',
  'Cozy Hand-Drawn': 'digital perfection, vector smoothness, mechanical lines, rigid geometry', // ALLOWS sketch/texture
  'default': 'grayscale, shading, gradients, 3d render, sketch lines, pencil lead, smudge'
};

const getContextualNegatives = (prompt: string): string => {
  const p = prompt.toLowerCase();
  const negatives: string[] = [];

  if (p.includes('room') || p.includes('kitchen') || p.includes('inside') || p.includes('indoor')) {
    negatives.push('sky', 'clouds', 'sun', 'grass', 'mountains');
  }
  if (p.includes('underwater') || p.includes('ocean') || p.includes('sea')) {
    negatives.push('fire', 'smoke', 'dust', 'fur', 'feathers');
  }
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
  const audiencePhysics = AUDIENCE_RULES[audienceId] || AUDIENCE_RULES['kids'];
  const toneInstructions = AUDIENCE_TONE_GUIDE[audienceId] || AUDIENCE_TONE_GUIDE['kids'];

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
      2. SCALE LOCK: The character establishes the scale.
      3. SOLO FOCUS: Unless the prompt asks for a friend, draw ONLY the main character.
    `;
  }

  let finalStyle = techSpecs;
  if (styleDNA) {
    finalStyle = `Mimic this style: ${styleDNA.lineWeight}, ${styleDNA.density}, ${styleDNA.lineStyle}.`;
  }

  // Choose the right negative prompt based on style
  const styleNegative = STYLE_NEGATIVES[styleId] || STYLE_NEGATIVES['default'];

  // [UPDATED] The Prompt Structure
  const fullPrompt = `
    ROLE: You are a professional illustrator.
    TASK: Generate a strictly 2D, BLACK AND WHITE, digital line drawing.
    
    [CRITICAL FORMATTING]
    1. VIEW: Direct 2D view. NOT a photo of paper. NO angles.
    2. COLOR: Pure Black (#000000) on Pure White (#FFFFFF).
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
    Constraint: Main shapes must be closed.
    ${heroConstraint}

    [FINAL COMPLIANCE CHECK]
    - Is this a photo of a drawing on a desk? (NO - If yes, FAIL).
    - Are there colored 3D glasses? (NO - If yes, FAIL).
    - Is there shading? (Allowed ONLY if style is 'Cozy' or 'Botanical'. Otherwise NO).
  `.replace(/\s+/g, ' ').trim();

  let dynamicNegative = `${BASE_NEGATIVE}, ${styleNegative}`;

  const contextNeg = getContextualNegatives(userPrompt);
  if (contextNeg) dynamicNegative += `, ${contextNeg}`;

  if (!userPrompt.toLowerCase().includes('snail')) {
    dynamicNegative += ", snail, slug, insect, mascot";
  }

  return {
    fullPrompt,
    fullNegativePrompt: dynamicNegative.replace(/\s+/g, ' ').trim()
  };
};

export const STYLE_RULES: Record<string, any> = {
  'Bold & Easy': { recommendedTemperature: 0.7, allowsTextureShading: false },
  'Cozy Hand-Drawn': { recommendedTemperature: 0.9, allowsTextureShading: true }, // <--- THIS IS KEY
  'Kawaii': { recommendedTemperature: 0.8, allowsTextureShading: false },
  'Botanical': { recommendedTemperature: 0.7, allowsTextureShading: true },
  'default': { recommendedTemperature: 1.0, allowsTextureShading: false }
};

export const SYSTEM_INSTRUCTION = "You are a professional coloring book artist.";