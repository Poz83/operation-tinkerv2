import { CharacterDNA, StyleDNA, VISUAL_STYLES, TARGET_AUDIENCES } from '../../types';

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

// 2. AUDIENCE PHYSICS (Existing)
const AUDIENCE_RULES: Record<string, string> = {
  'toddlers': 'CRITICAL: Ultra-low detail. Giant shapes only. Line weight 8px minimum. No background details. Zoomed in. No tiny artifacts.',
  'kids': 'Standard coloring book complexity. Clear separation of shapes. Storytelling elements. Medium line weight. No shading.',
  'adults': 'High intricacy. Fine liner detail (0.5mm). Complex patterns. Mindfulness texture. Detailed background allowed.',
  'seniors': 'High clarity. Large distinct sections. Very clear separation between elements. Readable shapes. No visual clutter.'
};

// 3. [NEW] AUDIENCE TONE GUIDE (The Universe Rules)
const AUDIENCE_TONE_GUIDE: Record<string, string> = {
  'toddlers': `
    [TONE: INNOCENT & JOYFUL]
    - EMOTIONS: Pure happiness, curiosity, or sleepiness. No anger, no sadness.
    - CONFLICT: None. Everyone is friends. 
    - SCARY: STRICTLY FORBIDDEN. Even monsters must be plush toys.
  `,
  'preschool': `
    [TONE: FRIENDLY & DISCOVERY]
    - EMOTIONS: Bright, cheerful, wonder. 
    - SCARY: "Scooby-Doo" level. Cute ghosts. No sharp teeth.
  `,
  'kids': `
    [TONE: ADVENTUROUS & FUN]
    - EMOTIONS: Excitement, determination, laughter.
    - SCARY: "Goosebumps" level. Spooky forests okay. NO GORE.
  `,
  'teens': `
    [TONE: STYLISH & RELATABLE]
    - SCARY: Edgy/Gothic. Vampires/Zombies okay (PG-13). No extreme violence.
  `,
  'adults': `
    [TONE: SOPHISTICATED & EVOCATIVE]
    - SCARY: Horror allowed. Skulls, Lovecraftian, dark fantasy.
  `,
  'seniors': `
    [TONE: NOSTALGIC & CLEAR]
    - EMOTIONS: Peaceful, heartwarming, dignified.
  `,
  'sen': `
    [TONE: CALM & PREDICTABLE]
    - EMOTIONS: Soothing, safe. Avoid surprises.
  `
};

// 4. NEGATIVE PROMPT
const UNIVERSAL_NEGATIVE = `
  grayscale, shading, gradients, 3d render, photo, realistic, text, watermark, signature, 
  blurry, sketch lines, pencil lead, dither, noise, double lines, open shapes, 
  broken lines, colored fill, grey fill, 
  deformed hands, extra fingers, distorted face, 
  random floating objects, dust spots,
  human, people, man, woman, person, child, boy, girl, (unless explicitly prompted)
`;

// [NEW] Smart Contextual Hygiene
const getContextualNegatives = (prompt: string): string => {
  const p = prompt.toLowerCase();
  const negatives: string[] = [];
  // Indoors? Ban nature debris.
  if (p.includes('room') || p.includes('kitchen') || p.includes('inside') || p.includes('indoor')) {
    negatives.push('sky', 'clouds', 'sun', 'moon', 'grass', 'trees', 'mountains');
  }
  // Underwater? Ban fire/dust.
  if (p.includes('underwater') || p.includes('ocean') || p.includes('sea')) {
    negatives.push('fire', 'smoke', 'dust', 'fur', 'feathers');
  }
  return negatives.join(', ');
};

export const buildPrompt = (
  userPrompt: string, styleId: string, complexity: string, requiresText: boolean,
  audiencePrompt: string, audienceId: string, styleDNA?: StyleDNA | null, heroDNA?: CharacterDNA
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
      2. SCALE LOCK: The character establishes the scale. Props must be realistic relative to character.
      3. SOLO FOCUS: Unless asked, draw ONLY the main character. No random sidekicks.
    `;
  }

  let finalStyle = techSpecs;
  if (styleDNA) {
    finalStyle = `Mimic this style: Line Weight: ${styleDNA.lineWeight}. ${styleDNA.promptFragment || ''}`;
  }

  const fullPrompt = `
    ROLE: Professional coloring book artist.
    [SUBJECT MATTER]
    ${subject}
    [ARTISTIC STYLE]
    ${finalStyle}
    [UNIVERSE RULES]
    Target Audience: ${audienceId}
    ${toneInstructions}
    [TECHNICAL CONSTRAINTS]
    Physics: ${audiencePhysics}
    Constraint: All shapes must be closed.
    ${heroConstraint}
  `.replace(/\s+/g, ' ').trim();

  // Smart Negatives
  let dynamicNegative = UNIVERSAL_NEGATIVE;
  if (!userPrompt.toLowerCase().includes('snail')) dynamicNegative += ", snail, slug, insect, mascot";

  const contextualNegatives = getContextualNegatives(userPrompt);
  if (contextualNegatives) dynamicNegative += `, ${contextualNegatives}`;

  return { fullPrompt, fullNegativePrompt: dynamicNegative.replace(/\s+/g, ' ').trim() };
};

export const STYLE_RULES: Record<string, any> = {
  'Bold & Easy': { recommendedTemperature: 0.7 },
  'Cozy Hand-Drawn': { recommendedTemperature: 0.9 },
  'Kawaii': { recommendedTemperature: 0.8 },
  'Botanical': { recommendedTemperature: 0.7, allowsTextureShading: true },
  'default': { recommendedTemperature: 1.0 }
};

export const SYSTEM_INSTRUCTION = "You are a professional coloring book artist.";