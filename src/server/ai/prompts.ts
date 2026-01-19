/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROMPTS v5.0 — Optimized for Gemini 3 Pro Image (Nano Banana Pro)
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * KEY INSIGHTS FROM GOOGLE DOCUMENTATION:
 * 
 * 1. NEGATIVE PROMPTS ARE DEPRECATED in Imagen 3+ / Gemini 3 Pro Image
 *    - We cannot use `negative_prompt` parameter
 *    - All prohibitions must be IN the main prompt
 *
 * 2. CONSTRAINT PLACEMENT IS CRITICAL
 *    - Gemini 3 may DROP constraints that appear too early
 *    - Negative constraints (what NOT to do) must be at the END
 *    - Core request + critical restrictions = FINAL LINE
 *
 * 3. PROMPT STRUCTURE (Google Recommended)
 *    - Be precise and direct
 *    - Use consistent structure (XML tags or Markdown)
 *    - Define parameters explicitly
 *    - Place constraints at the end
 *
 * 4. STYLE KEYWORDS MATTER
 *    - "A sketch of..." vs "A painting of..." dramatically changes output
 *    - "coloring book page" is a recognized style keyword
 *    - Quality modifiers like "high-quality" affect output
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type StyleId =
  | 'Cozy Hand-Drawn'
  | 'Bold & Easy'
  | 'Kawaii'
  | 'Whimsical'
  | 'Cartoon'
  | 'Botanical'
  | 'Realistic'
  | 'Geometric'
  | 'Fantasy'
  | 'Gothic'
  | 'Mandala'
  | 'Zentangle';

export type ComplexityId =
  | 'Very Simple'
  | 'Simple'
  | 'Moderate'
  | 'Intricate'
  | 'Extreme Detail';

export type AudienceId =
  | 'toddlers'
  | 'preschool'
  | 'kids'
  | 'teens'
  | 'adults'
  | 'seniors';

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface StyleSpec {
  /** Style keyword for Gemini to recognize */
  styleKeyword: string;
  /** Positive description of what we want */
  positiveDescription: string;
  /** Line weight description */
  lineWeight: string;
  /** Specific visual requirements */
  visualRequirements: string[];
}

const STYLE_SPECS: Record<StyleId, StyleSpec> = {
  'Cozy Hand-Drawn': {
    styleKeyword: 'hand-drawn coloring book illustration',
    positiveDescription: 'warm, inviting hand-drawn style with organic slightly wobbly lines suggesting handmade charm',
    lineWeight: 'medium weight lines (0.5-1mm), consistent throughout',
    visualRequirements: [
      'Clean outlined shapes only',
      'Rounded corners on all objects',
      'Every shape is a closed colorable region',
      'Texture shown through shape variety, not line patterns',
    ],
  },
  'Bold & Easy': {
    styleKeyword: 'simple bold outline coloring page',
    positiveDescription: 'extremely simple bold-line coloring page suitable for young children, sticker-like aesthetic',
    lineWeight: 'very thick uniform lines (4mm+)',
    visualRequirements: [
      'Maximum 30 colorable regions',
      'Thick bold outlines only',
      'Large simple shapes',
      'No fine details whatsoever',
    ],
  },
  'Kawaii': {
    styleKeyword: 'kawaii cute coloring page',
    positiveDescription: 'adorable kawaii style with chibi proportions, all rounded soft shapes, cute friendly expressions',
    lineWeight: 'thick smooth lines (3mm)',
    visualRequirements: [
      'All corners rounded (no sharp angles)',
      'Large heads, small bodies (chibi)',
      'Friendly smiling expressions',
      'Soft bubble-like shapes',
    ],
  },
  'Whimsical': {
    styleKeyword: 'whimsical fairy tale coloring book illustration',
    positiveDescription: 'dreamy whimsical style with flowing graceful lines, elongated fairy-tale proportions',
    lineWeight: 'variable flowing lines (0.5-1.5mm)',
    visualRequirements: [
      'Flowing curved lines',
      'Elongated elegant proportions',
      'Magical fairy-tale atmosphere',
      'Sparkles as star shapes (not dots)',
    ],
  },
  'Cartoon': {
    styleKeyword: 'cartoon coloring book page',
    positiveDescription: 'clean dynamic cartoon style with clear bold outlines and expressive poses',
    lineWeight: 'bold outlines (1.5-2mm) with thinner internal lines (0.5mm)',
    visualRequirements: [
      'Clear silhouettes',
      'Expressive character poses',
      'Strong line hierarchy',
      'Clean professional outlines',
    ],
  },
  'Botanical': {
    styleKeyword: 'botanical illustration coloring page',
    positiveDescription: 'scientific botanical illustration style with precise fine linework showing plant anatomy',
    lineWeight: 'fine precise lines (0.3-0.5mm)',
    visualRequirements: [
      'Accurate plant anatomy',
      'Fine detailed linework',
      'Each petal/leaf is a closed shape',
      'Clean scientific illustration style',
    ],
  },
  'Realistic': {
    styleKeyword: 'realistic line art coloring page',
    positiveDescription: 'realistic proportions rendered in clean uniform line art, Ligne Claire style',
    lineWeight: 'uniform lines throughout (0.6mm)',
    visualRequirements: [
      'Accurate realistic proportions',
      'Uniform line weight (no variation)',
      'Clean contour lines only',
      'No sketchy or loose lines',
    ],
  },
  'Geometric': {
    styleKeyword: 'geometric low-poly coloring page',
    positiveDescription: 'geometric faceted style using ONLY straight lines, polygonal tessellated construction',
    lineWeight: 'uniform straight lines (0.8mm)',
    visualRequirements: [
      'ONLY straight lines (absolutely no curves)',
      'All shapes are polygons',
      'Faceted crystalline aesthetic',
      'Low-poly style construction',
    ],
  },
  'Fantasy': {
    styleKeyword: 'fantasy coloring book illustration',
    positiveDescription: 'epic fantasy illustration style with dramatic compositions and detailed world-building',
    lineWeight: 'varied dramatic lines (0.5-2mm)',
    visualRequirements: [
      'Epic dramatic compositions',
      'Detailed fantasy elements',
      'Clear outlined regions',
      'Rich imaginative details',
    ],
  },
  'Gothic': {
    styleKeyword: 'gothic dark art coloring page',
    positiveDescription: 'elegant gothic style with ornate details, dramatic atmosphere, and intricate patterns',
    lineWeight: 'fine to medium varied lines',
    visualRequirements: [
      'Ornate decorative details',
      'Gothic architectural elements',
      'Dramatic atmospheric composition',
      'Intricate pattern work',
    ],
  },
  'Mandala': {
    styleKeyword: 'mandala coloring page',
    positiveDescription: 'circular symmetrical mandala design with repeating geometric patterns radiating from center',
    lineWeight: 'fine uniform lines (0.5mm)',
    visualRequirements: [
      'Perfect circular symmetry',
      'Repeating radial patterns',
      'Geometric precision',
      'Meditative balanced design',
    ],
  },
  'Zentangle': {
    styleKeyword: 'zentangle pattern coloring page',
    positiveDescription: 'zentangle-inspired pattern art with structured repetitive patterns filling defined spaces',
    lineWeight: 'fine uniform lines (0.5mm)',
    visualRequirements: [
      'Structured repeating patterns',
      'Defined pattern boundaries',
      'Meditative repetitive elements',
      'Clean precise linework',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLEXITY SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface ComplexitySpec {
  regionRange: string;
  backgroundRule: string;
  restAreaRule: string;
  detailLevel: string;
}

const COMPLEXITY_SPECS: Record<ComplexityId, ComplexitySpec> = {
  'Very Simple': {
    regionRange: '3-8 large colorable regions',
    backgroundRule: 'Pure white background for children; for adults add a simple decorative border frame',
    restAreaRule: 'Children: entire background is white. Adults: border provides colorable content',
    detailLevel: 'Single iconic subject with minimal internal detail',
  },
  'Simple': {
    regionRange: '10-25 colorable regions',
    backgroundRule: 'Children: simple ground line. Adults: add decorative border frame with patterns',
    restAreaRule: 'Children: 50% white space. Adults: reduce white space to 25% with border fill',
    detailLevel: 'Main subject with 1-2 supporting elements',
  },
  'Moderate': {
    regionRange: '40-80 colorable regions',
    backgroundRule: 'Full scene with foreground, midground, background',
    restAreaRule: 'Include 4-6 clear white space rest areas (minimum 15% of image)',
    detailLevel: 'Complete scene with balanced detail distribution',
  },
  'Intricate': {
    regionRange: '80-120 colorable regions',
    backgroundRule: 'Detailed environment throughout with decorative elements filling any gaps',
    restAreaRule: 'Include 2-4 rest areas (minimum 10% of image)',
    detailLevel: 'Rich detailed scene with patterns and textures as shapes',
  },
  'Extreme Detail': {
    regionRange: '120-150+ colorable regions',
    backgroundRule: 'Maximum detail throughout, edge-to-edge content',
    restAreaRule: 'Include 2-3 small rest areas for visual relief',
    detailLevel: 'Expert-level complexity with shapes within shapes',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIENCE SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface AudienceSpec {
  maxComplexity: ComplexityId;
  contentGuidance: string;
  toneGuidance: string;
  /** How to fill the page - adults want edge-to-edge, children need simpler layouts */
  pageFillStrategy: string;
}

const AUDIENCE_SPECS: Record<AudienceId, AudienceSpec> = {
  'toddlers': {
    maxComplexity: 'Very Simple',
    contentGuidance: 'Single friendly recognizable object, extremely simple, no scary elements',
    toneGuidance: 'Friendly, cute, instantly recognizable',
    pageFillStrategy: 'Center the main subject large on the page. Keep background completely white or with minimal elements. Big simple shapes are easier for small hands.',
  },
  'preschool': {
    maxComplexity: 'Simple',
    contentGuidance: 'Friendly characters and simple scenes, educational themes welcome',
    toneGuidance: 'Cheerful, simple, age-appropriate',
    pageFillStrategy: 'Main subject should be large and centered. Simple background elements like ground, sky line, or basic shapes. Keep at least 40% white space.',
  },
  'kids': {
    maxComplexity: 'Moderate',
    contentGuidance: 'Fun engaging scenes, adventure themes, appropriate for ages 6-12',
    toneGuidance: 'Fun, exciting, imaginative',
    pageFillStrategy: 'Fill the scene with interesting elements. Background should have colorable details. Keep some white space (20-30%) for rest areas.',
  },
  'teens': {
    maxComplexity: 'Intricate',
    contentGuidance: 'Stylish dynamic scenes, more sophisticated themes for ages 13-17',
    toneGuidance: 'Cool, stylish, dynamic',
    pageFillStrategy: 'Fill most of the page with detailed content. Add decorative patterns or environmental details in background areas. Minimal white space (15%).',
  },
  'adults': {
    maxComplexity: 'Extreme Detail',
    contentGuidance: 'Sophisticated artistic designs for relaxation and meditation',
    toneGuidance: 'Artistic, meditative, sophisticated',
    pageFillStrategy: 'FILL THE PAGE EDGE-TO-EDGE with colorable content. Add a decorative border frame around the main scene using patterns that match the style (geometric tiles, floral vines, organic shapes, or themed elements). The main scene occupies 60-70% center, with decorative border patterns filling remaining space. Minimal white space - every area should have something to color.',
  },
  'seniors': {
    maxComplexity: 'Moderate',
    contentGuidance: 'Clear visible designs, nostalgic themes, avoid tiny details',
    toneGuidance: 'Clear, nostalgic, relaxing',
    pageFillStrategy: 'Fill the page but keep elements large and clearly defined. Use decorative borders with larger, simpler patterns. Avoid tiny intricate details in border areas.',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export interface BuildPromptOptions {
  userPrompt: string;
  styleId: StyleId;
  complexityId: ComplexityId;
  audienceId: AudienceId;
  aspectRatio?: string;
  imageSize?: '1K' | '2K' | '4K';
}

export interface BuildPromptResult {
  prompt: string;
  warnings: string[];
}

/**
 * Build a prompt optimized for Gemini 3 Pro Image
 * 
 * Structure follows Google's recommendations:
 * 1. Style keyword + positive description (what we want)
 * 2. Subject/scene description (user's content)
 * 3. Technical specifications (complexity, regions)
 * 4. CRITICAL CONSTRAINTS AT THE END (what to avoid)
 */
export const buildPromptForGemini3 = (options: BuildPromptOptions): BuildPromptResult => {
  const { userPrompt, styleId, complexityId, audienceId } = options;
  const warnings: string[] = [];

  // Get specifications
  const styleSpec = STYLE_SPECS[styleId] || STYLE_SPECS['Cozy Hand-Drawn'];
  const complexitySpec = COMPLEXITY_SPECS[complexityId] || COMPLEXITY_SPECS['Moderate'];
  const audienceSpec = AUDIENCE_SPECS[audienceId] || AUDIENCE_SPECS['adults'];

  // Check complexity vs audience max
  const complexityOrder: ComplexityId[] = ['Very Simple', 'Simple', 'Moderate', 'Intricate', 'Extreme Detail'];
  const requestedIdx = complexityOrder.indexOf(complexityId);
  const maxIdx = complexityOrder.indexOf(audienceSpec.maxComplexity);

  let effectiveComplexity = complexityId;
  let effectiveComplexitySpec = complexitySpec;

  if (requestedIdx > maxIdx) {
    effectiveComplexity = audienceSpec.maxComplexity;
    effectiveComplexitySpec = COMPLEXITY_SPECS[effectiveComplexity];
    warnings.push(`Complexity reduced from "${complexityId}" to "${effectiveComplexity}" for ${audienceId} audience`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD THE PROMPT
  // Google recommends: positive description first, constraints at END
  // ═══════════════════════════════════════════════════════════════════════════

  const prompt = `
A high-quality ${styleSpec.styleKeyword}, ${styleSpec.positiveDescription}.

SCENE: ${userPrompt}

STYLE DETAILS:
- ${styleSpec.lineWeight}
- ${styleSpec.visualRequirements.join('\n- ')}

COMPOSITION:
- ${effectiveComplexitySpec.regionRange}
- ${effectiveComplexitySpec.backgroundRule}
- ${effectiveComplexitySpec.restAreaRule}
- ${effectiveComplexitySpec.detailLevel}
- PRINT MARGINS: Keep main subjects within the CENTER 85% of the canvas. Leave breathing room at all edges (at least 7% margin on each side). Content too close to edges may be trimmed during printing.

PAGE FILL STRATEGY (${audienceId} audience):
${audienceSpec.pageFillStrategy}

OUTPUT: A single black and white coloring book page illustration. Pure black lines on pure white background. Every area is a closed shape that can be colored in.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL REQUIREMENTS (must follow exactly):
═══════════════════════════════════════════════════════════════════════════════

This is a COLORING BOOK PAGE. The output requirements are strict:

1. COLORS: Pure black lines (#000000) on pure white background (#FFFFFF) ONLY.
   - Zero grey tones
   - Zero gradients
   - Zero shading
   - Zero color tints

2. LINE WORK: Clean outlined shapes only.
   - Zero stippling (no dots for texture)
   - Zero hatching (no parallel lines for shading)
   - Zero cross-hatching
   - Zero sketchy overlapping lines
   - Zero decorative texture strokes

3. TEXTURE REPRESENTATION: Show texture through SHAPE OUTLINES only.
   - Fur/hair = enclosed sections (not individual strands)
   - Fabric/knit = outlined geometric shapes (not texture lines)
   - Water/waves = enclosed wave shapes (not wavy lines)
   - Wood = outlined planks (not grain lines)

4. REGIONS: Every single area must be a CLOSED shape.
   - All lines connect at endpoints
   - No gaps in outlines
   - No open paths
   - Each region can be flood-filled

5. FILLS: Zero solid black filled areas.
   - Pupils = outlined circles
   - Dark areas = empty regions to color dark
   - No silhouettes

6. FORMAT: Single illustration filling the canvas.
   - Not a mockup or product photo
   - Not multiple images
   - Not a photo of paper on a table
   - Just the line art illustration itself
`.trim();

  return {
    prompt,
    warnings,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ALTERNATIVE: ULTRA-MINIMAL PROMPT
// For when the verbose prompt isn't working
// ═══════════════════════════════════════════════════════════════════════════════

export const buildMinimalPrompt = (options: BuildPromptOptions): BuildPromptResult => {
  const { userPrompt, styleId } = options;
  const styleSpec = STYLE_SPECS[styleId] || STYLE_SPECS['Cozy Hand-Drawn'];

  // Ultra-direct, minimal prompt
  const prompt = `
Black and white coloring book page, ${styleSpec.styleKeyword}.

${userPrompt}

Clean black outlines on white background. Closed shapes only. No shading, no grey, no stippling, no hatching, no texture marks. Every area is colorable.
`.trim();

  return {
    prompt,
    warnings: [],
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT VARIATIONS FOR A/B TESTING
// ═══════════════════════════════════════════════════════════════════════════════

export const buildPromptVariantA = (options: BuildPromptOptions): string => {
  const { userPrompt, styleId } = options;
  const styleSpec = STYLE_SPECS[styleId] || STYLE_SPECS['Cozy Hand-Drawn'];

  // Variant A: Lead with "coloring book" keyword heavily
  return `
Coloring book page illustration. Black and white line art for coloring.

${styleSpec.styleKeyword}: ${userPrompt}

Style: ${styleSpec.positiveDescription}
Lines: ${styleSpec.lineWeight}

Pure black outlines on white. All shapes closed for coloring. No grey, no shading, no stippling, no hatching.
`.trim();
};

export const buildPromptVariantB = (options: BuildPromptOptions): string => {
  const { userPrompt, styleId } = options;
  const styleSpec = STYLE_SPECS[styleId] || STYLE_SPECS['Cozy Hand-Drawn'];

  // Variant B: Use "line art" terminology
  return `
Professional line art illustration for adult coloring book.

Scene: ${userPrompt}

Art style: ${styleSpec.positiveDescription}
Line weight: ${styleSpec.lineWeight}

Technical requirements: Black ink lines on white paper. Every shape is a closed outline ready to color. No fills, no shading, no grey tones, no dot textures, no line textures.
`.trim();
};

export const buildPromptVariantC = (options: BuildPromptOptions): string => {
  const { userPrompt, styleId } = options;
  const styleSpec = STYLE_SPECS[styleId] || STYLE_SPECS['Cozy Hand-Drawn'];

  // Variant C: Mimic successful coloring book description
  return `
${userPrompt}

Rendered as a ${styleSpec.styleKeyword} in the style of a professional published coloring book. Clean black outlines on white background. ${styleSpec.lineWeight}. All areas are enclosed shapes designed to be colored with markers or pencils. No pre-filled areas, no shading effects, no grey tones.
`.trim();
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: ENHANCE USER PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Enhance a user's basic prompt with coloring-book-specific details
 * Can be used with Gemini 1.5 Pro as the planner
 */
export const PROMPT_ENHANCER_SYSTEM = `
You are a coloring book prompt engineer. Your job is to take a user's basic idea and expand it into a detailed scene description optimized for AI image generation.

RULES:
1. Keep the enhanced prompt under 100 words
2. Focus on VISUAL elements only (shapes, objects, composition)
3. Describe what IS there, not what isn't
4. Include composition guidance (foreground, background, focal point)
5. Add details that create interesting colorable regions
6. Do NOT mention colors, shading, or textures
7. Do NOT add technical instructions (the generation system adds those)

EXAMPLE INPUT: "A dragon"
EXAMPLE OUTPUT: "A friendly dragon sitting on a pile of treasure coins and gems. The dragon has large expressive eyes, curved horns, folded wings with membrane sections, and a long tail curling around the treasure. Medieval castle visible in background. Dragon is the focal point, centered, taking up 60% of frame."

Now enhance this prompt:
`;

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { STYLE_SPECS, COMPLEXITY_SPECS, AUDIENCE_SPECS };