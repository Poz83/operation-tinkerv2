import {
  CharacterDNA,
  StyleDNA,
  CinematicOption,
  VISUAL_STYLES,
  TARGET_AUDIENCES
} from '../../types';

// 1. STYLE DICTIONARY: Maps friendly names to technical art specs
const STYLE_SPECS: Record<string, string> = {
  'Bold & Easy': 'thick uniform vector lines (4px-6px), high contrast, minimal detail, sticker art style, bold outlines, no tiny gaps, white background',
  'Cozy Hand-Drawn': 'organic ink bleed, imperfect wobble, warm feeling, rounded corners, thick felt-tip pen texture, hygge aesthetic, whimsical but clean',
  'Kawaii': 'chibi style, super deformed, rounded proportions, thick soft lines, sparkles, simple vector art, cute eyes',
  'Botanical': 'scientific botanical illustration, fine liner pen, cross-hatching shading, highly detailed organic textures, vintage biology textbook style',
  'Mandala': 'radial symmetry, geometric patterns, fractals, precise mathematical lines, zentangle patterns, meditative complexity',
  'Gothic': 'stained glass window style, thick lead lines, heavy black outlines, intricate segmentation, angular shapes, medieval woodcut',
  'default': 'standard coloring book page, clear black lines, white background'
};

// 2. AUDIENCE GUARDRAILS: Strict physics rules per age group
const AUDIENCE_RULES: Record<string, string> = {
  'toddlers': 'CRITICAL: Ultra-low detail. Giant shapes only. Line weight 8px minimum. No background details. Zoomed in. No tiny artifacts.',
  'kids': 'Standard coloring book complexity. Clear separation of shapes. Storytelling elements. Medium line weight. No shading.',
  'adults': 'High intricacy. Fine liner detail (0.5mm). Complex patterns. Mindfulness texture. Detailed background allowed.',
  'seniors': 'High clarity. Large distinct sections. Very clear separation between elements. Readable shapes. No visual clutter.'
};

// 3. NEGATIVE PROMPT: The "Anti-Hallucination" shield
// [UPDATED]: Added specific bans for 'humans' (unless requested) and 'mascots'
const UNIVERSAL_NEGATIVE = `
  grayscale, shading, gradients, 3d render, photo, realistic, text, watermark, signature, 
  blurry, sketch lines, pencil lead, dither, noise, double lines, open shapes, 
  broken lines, colored fill, grey fill, 
  deformed hands, extra fingers, distorted face, 
  random floating objects, dust spots,
  human, people, man, woman, person, child, boy, girl, (unless explicitly prompted)
`;

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

  // [NEW] B. Hero Logic & Scale Locking
  let subject = userPrompt;
  let heroConstraint = "";

  if (heroDNA) {
    // If we have a hero, we strictly describe them AND their scale
    subject = `
      PRIMARY SUBJECT: ${heroDNA.name} (${heroDNA.role}).
      APPEARANCE: ${heroDNA.body}, ${heroDNA.face}, ${heroDNA.hair}.
      OUTFIT: ${heroDNA.outfitCanon}.
      ACTION: ${userPrompt}
    `.trim();

    // [FIX 1 & 3]: Scale Locking & Species Protection
    heroConstraint = `
      [CHARACTER RULES]
      1. SPECIES LOCK: Subject is strictly '${heroDNA.name}'. DO NOT morph into a human. DO NOT morph into other animals.
      2. SCALE LOCK: The character establishes the scale. All props (fruit, items, furniture) must be realistic size relative to the character.
      3. SOLO FOCUS: Unless the prompt asks for a friend, draw ONLY the main character. No random sidekicks (snails, birds, cats) in the corners.
    `;
  }

  // C. Forensic Style Override
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
  // We place the Constraints *after* the Subject so they act as a filter
  const fullPrompt = `
    ROLE: You are a professional coloring book artist.
    TASK: Draw a black and white printable coloring page.
    
    [SUBJECT MATTER]
    ${subject}

    [ARTISTIC STYLE]
    ${finalStyle}

    [TECHNICAL CONSTRAINTS]
    Physics: ${audiencePhysics}
    Constraint: All shapes must be closed/watertight for flood-fill.
    Background: Pure white. No texture.
    
    ${heroConstraint}
  `;

  // [FIX 2]: Dynamic Negative Prompt
  // If the prompt doesn't explicitly ask for a "snail" or "mascot", we ban them.
  let dynamicNegative = UNIVERSAL_NEGATIVE;
  if (!userPrompt.toLowerCase().includes('snail')) {
    dynamicNegative += ", snail, slug, insect, mascot, sidekick";
  }

  return {
    fullPrompt: fullPrompt.replace(/\s+/g, ' ').trim(),
    fullNegativePrompt: dynamicNegative.replace(/\s+/g, ' ').trim()
  };
};

export const STYLE_RULES: Record<string, { recommendedTemperature?: number, allowsTextureShading?: boolean }> = {
  'Bold & Easy': { recommendedTemperature: 0.7, allowsTextureShading: false },
  'Cozy Hand-Drawn': { recommendedTemperature: 0.9, allowsTextureShading: false }, // Higher temp for "wobble"
  'Kawaii': { recommendedTemperature: 0.8, allowsTextureShading: false },
  'Botanical': { recommendedTemperature: 0.7, allowsTextureShading: true }, // Stippling allowed
  'default': { recommendedTemperature: 1.0, allowsTextureShading: false }
};

// [COMPATIBILITY EXPORT] 
// Kept to prevent breaking src/server/ai/gemini-client.ts which likely imports this.
export const SYSTEM_INSTRUCTION = "You are a professional coloring book artist.";