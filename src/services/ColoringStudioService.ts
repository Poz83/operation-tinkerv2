/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COLORING STUDIO SERVICE v2.0
 * Paint-by-Numbers SaaS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Handles all AI text operations for the Coloring Book Studio:
 * - generateBookPlan(): Creates page-by-page plans for coloring books
 * - brainstormPrompt(): Expands simple ideas into detailed scene descriptions
 * - analyzeReferenceStyle(): Extracts StyleDNA from reference images
 *
 * v2.0 Changes:
 * - Integrated with prompts-v4.ts style/complexity/audience specifications
 * - Uses correct model constants from gemini-client.ts
 * - Book plan generation respects actual style constraints
 * - Improved prompt engineering with specification awareness
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/// <reference types="vite/client" />

import { GoogleGenAI, Type } from '@google/genai';
import { GEMINI_TEXT_MODEL } from '../server/ai/gemini-client';
import { getStoredApiKey } from '../lib/crypto';
import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE SPECIFICATIONS (Aligned with prompts-v4.ts)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valid style IDs - must match prompts-v4.ts exactly
 */
export const VALID_STYLE_IDS = [
    'Cozy Hand-Drawn',
    'Bold & Easy',
    'Kawaii',
    'Whimsical',
    'Cartoon',
    'Botanical',
    'Mandala',
    'Zentangle',
    'Fantasy',
    'Gothic',
    'Cozy',
    'Geometric',
    'Wildlife',
    'Floral',
    'Abstract',
    'Realistic',
] as const;

export type StyleId = typeof VALID_STYLE_IDS[number];

/**
 * Valid complexity IDs - must match prompts-v4.ts exactly
 */
export const VALID_COMPLEXITY_IDS = [
    'Very Simple',
    'Simple',
    'Moderate',
    'Intricate',
    'Extreme Detail',
] as const;

export type ComplexityId = typeof VALID_COMPLEXITY_IDS[number];

/**
 * Valid audience IDs - must match prompts-v4.ts exactly
 */
export const VALID_AUDIENCE_IDS = [
    'toddlers',
    'preschool',
    'kids',
    'teens',
    'adults',
    'seniors',
    'sen',
] as const;

export type AudienceId = typeof VALID_AUDIENCE_IDS[number];

/**
 * Style characteristics for book planning
 * Extracted from prompts-v4.ts for consistency
 */
const STYLE_CHARACTERISTICS: Record<string, {
    lineDescription: string;
    bestFor: string;
    avoid: string;
    vectorMode: 'organic' | 'geometric' | 'standard';
}> = {
    'Cozy Hand-Drawn': {
        lineDescription: 'organic, wobbly 0.5mm lines with hand-drawn charm',
        bestFor: 'domestic scenes, comfort objects, gentle subjects',
        avoid: 'geometric precision, sharp angles',
        vectorMode: 'organic',
    },
    'Bold & Easy': {
        lineDescription: 'thick 4mm uniform lines, maximum simplicity',
        bestFor: 'simple iconic subjects, sticker-style designs',
        avoid: 'fine details, intricate patterns, small spaces',
        vectorMode: 'standard',
    },
    'Kawaii': {
        lineDescription: 'thick 3mm smooth curves, all rounded corners',
        bestFor: 'cute characters, chibi proportions, friendly subjects',
        avoid: 'sharp angles, realistic proportions, mature themes',
        vectorMode: 'organic',
    },
    'Whimsical': {
        lineDescription: 'flowing variable-width lines suggesting movement',
        bestFor: 'fairy tales, magical scenes, storybook illustrations',
        avoid: 'rigid forms, realistic proportions, mundane subjects',
        vectorMode: 'organic',
    },
    'Cartoon': {
        lineDescription: 'dynamic tapered lines with clear hierarchy',
        bestFor: 'action scenes, expressive characters, dynamic poses',
        avoid: 'static poses, ambiguous silhouettes',
        vectorMode: 'standard',
    },
    'Botanical': {
        lineDescription: 'fine 0.3mm precise lines with stippling texture',
        bestFor: 'plants, flowers, scientific illustration subjects',
        avoid: 'solid fills, dense rendering',
        vectorMode: 'organic',
    },
    'Mandala': {
        lineDescription: 'precise geometric lines with radial symmetry',
        bestFor: 'meditative patterns, symmetrical designs',
        avoid: 'asymmetry, organic variation',
        vectorMode: 'geometric',
    },
    'Zentangle': {
        lineDescription: 'consistent 0.8mm lines with pattern fills',
        bestFor: 'abstract patterns, structured doodling',
        avoid: 'representational imagery, tiny enclosed spaces',
        vectorMode: 'geometric',
    },
    'Fantasy': {
        lineDescription: 'detailed ink work with dramatic line weight variation',
        bestFor: 'epic scenes, mythical creatures, heroic characters',
        avoid: 'modern elements, casual poses',
        vectorMode: 'standard',
    },
    'Gothic': {
        lineDescription: 'very thick 5mm+ angular lines like stained glass',
        bestFor: 'medieval themes, dramatic compartmentalized scenes',
        avoid: 'thin lines, soft curves, delicate elements',
        vectorMode: 'geometric',
    },
    'Cozy': {
        lineDescription: 'soft 1.5mm rounded lines with warm feeling',
        bestFor: 'hygge scenes, comfort, domestic tranquility',
        avoid: 'sharp angles, cold subjects, action scenes',
        vectorMode: 'organic',
    },
    'Geometric': {
        lineDescription: 'perfectly straight 0.8mm ruler lines only',
        bestFor: 'low-poly designs, crystalline structures, abstract forms',
        avoid: 'ANY curves, organic shapes',
        vectorMode: 'geometric',
    },
    'Wildlife': {
        lineDescription: 'naturalistic contours with directional texture strokes',
        bestFor: 'animals, nature, scientific accuracy',
        avoid: 'stylization, solid black areas',
        vectorMode: 'organic',
    },
    'Floral': {
        lineDescription: 'flowing Art Nouveau curves, interlocking forms',
        bestFor: 'flowers, vines, decorative patterns',
        avoid: 'geometric rigidity, sparse composition',
        vectorMode: 'organic',
    },
    'Abstract': {
        lineDescription: 'fluid expressive strokes with compositional focus',
        bestFor: 'non-representational designs, visual rhythm',
        avoid: 'recognizable subjects, open strokes',
        vectorMode: 'standard',
    },
    'Realistic': {
        lineDescription: 'uniform 0.6mm Ligne Claire contours',
        bestFor: 'accurate anatomy, technical illustration',
        avoid: 'line weight variation, hatching, stylization',
        vectorMode: 'standard',
    },
};

/**
 * Complexity characteristics for book planning
 */
const COMPLEXITY_CHARACTERISTICS: Record<string, {
    regionCount: string;
    backgroundAllowed: boolean;
    detailLevel: string;
    promptTrick: string;
}> = {
    'Very Simple': {
        regionCount: '3-5 major shapes',
        backgroundAllowed: false,
        detailLevel: 'ZERO internal detail',
        promptTrick: 'A sticker design of [Subject], A die-cut vector of [Subject]',
    },
    'Simple': {
        regionCount: '10-25 distinct regions',
        backgroundAllowed: true,
        detailLevel: 'minimal - only essential features',
        promptTrick: 'A clean line art illustration of [Subject] framed by [Element]',
    },
    'Moderate': {
        regionCount: '40-80 distinct regions',
        backgroundAllowed: true,
        detailLevel: 'standard coloring book level',
        promptTrick: 'A balanced scene with [Subject] including 4-6 rest areas',
    },
    'Intricate': {
        regionCount: '80-120 distinct regions',
        backgroundAllowed: true,
        detailLevel: 'high - textures and patterns allowed',
        promptTrick: 'A detailed illustration with [Subject] requiring fine motor control',
    },
    'Extreme Detail': {
        regionCount: '120-150+ distinct regions',
        backgroundAllowed: true,
        detailLevel: 'fractal - shapes within shapes',
        promptTrick: 'An immersive [Subject] with 2-4 calm empty regions for comfort',
    },
};

/**
 * Audience characteristics for book planning
 */
const AUDIENCE_CHARACTERISTICS: Record<string, {
    maxComplexity: ComplexityId;
    toneAdjustment: string;
    prohibited: string[];
    required: string[];
}> = {
    'toddlers': {
        maxComplexity: 'Very Simple',
        toneAdjustment: 'Make everything CUTE, FRIENDLY, and SAFE. Single iconic subjects.',
        prohibited: ['scary', 'teeth', 'claws', 'fire', 'weapons', 'villains', 'conflict'],
        required: ['instantly recognizable', 'center-weighted', 'friendly faces'],
    },
    'preschool': {
        maxComplexity: 'Simple',
        toneAdjustment: 'Happy, adventurous, wonder-filled. Simple storytelling.',
        prohibited: ['scary', 'violence', 'weapons', 'death', 'aggressive'],
        required: ['clear characters', 'simple narrative', 'friendly aesthetic'],
    },
    'kids': {
        maxComplexity: 'Moderate',
        toneAdjustment: 'Fun, energetic, imaginative. Action is welcome.',
        prohibited: ['gore', 'sexual content', 'extreme violence'],
        required: ['age-appropriate', 'engaging', 'cool factor'],
    },
    'teens': {
        maxComplexity: 'Intricate',
        toneAdjustment: 'Stylish, dynamic, culturally aware. Mature themes OK.',
        prohibited: ['gore', 'sexual content', 'drug use'],
        required: ['stylish aesthetic', 'dynamic poses'],
    },
    'adults': {
        maxComplexity: 'Extreme Detail',
        toneAdjustment: 'Sophisticated, artistic, meditative. Full complexity welcome.',
        prohibited: ['illegal content'],
        required: ['artistic merit', 'relaxation value'],
    },
    'seniors': {
        maxComplexity: 'Moderate',
        toneAdjustment: 'Clear, visible, dignified. Nostalgic themes welcome.',
        prohibited: ['tiny details', 'cluttered compositions'],
        required: ['high visibility', 'clear sections'],
    },
    'sen': {
        maxComplexity: 'Simple',
        toneAdjustment: 'Calming, predictable, structured. Avoid sensory overwhelm.',
        prohibited: ['chaotic', 'busy', 'unpredictable', 'scary'],
        required: ['predictability', 'structure', 'calm aesthetic'],
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface BookPlanItem {
    pageNumber: number;
    prompt: string;
    vectorMode: 'organic' | 'geometric' | 'standard';
    complexityDescription: string;
    requiresText: boolean;
    /** Scene type for variety tracking */
    sceneType?: 'close-up' | 'medium' | 'wide' | 'pattern' | 'action';
    /** Whether hero appears on this page */
    heroAppears?: boolean;
}

export interface BookPlanRequest {
    userIdea: string;
    pageCount: number;
    audience: AudienceId;
    style: StyleId;
    complexity: ComplexityId;
    hasHeroRef: boolean;
    includeText: boolean;
    heroPresence?: number;
    heroName?: string;
    signal?: AbortSignal;
}

export interface BrainstormContext {
    style: StyleId;
    audience: AudienceId;
    complexity?: ComplexityId;
    heroName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ColoringStudioService v2.0
 * 
 * Handles all AI text operations for the Coloring Book Studio.
 * Integrated with prompts-v4.ts specifications for consistency.
 */
export class ColoringStudioService {
    private ai: GoogleGenAI | null = null;
    private apiKey: string | null = null;

    constructor(apiKey?: string) {
        if (apiKey) {
            this.apiKey = apiKey;
            this.ai = new GoogleGenAI({ apiKey });
        }
    }

    /**
     * Initialize or reinitialize with an API key
     */
    async initialize(apiKey?: string): Promise<void> {
        const key = apiKey || await getStoredApiKey() || undefined;

        if (!key) {
            console.warn('ColoringStudioService: No API key available');
            this.ai = null;
            this.apiKey = null;
            return;
        }

        if (key !== this.apiKey) {
            this.apiKey = key;
            this.ai = new GoogleGenAI({ apiKey: key });
        }
    }

    /**
     * Ensure service is initialized before making calls
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.ai) {
            await this.initialize();
        }
        if (!this.ai) {
            throw new Error('Gemini API Key is not configured. Please add your key in Settings.');
        }
    }

    /**
     * Create a new instance with a specific API key
     */
    static async createWithKey(apiKey: string): Promise<ColoringStudioService> {
        const service = new ColoringStudioService(apiKey);
        await service.initialize(apiKey);
        return service;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BOOK PLAN GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Generate a cohesive book plan based on user parameters
     * 
     * @example
     * const plan = await service.generateBookPlan({
     *   userIdea: 'A day at the beach',
     *   pageCount: 10,
     *   audience: 'kids',
     *   style: 'Cartoon',
     *   complexity: 'Moderate',
     *   hasHeroRef: true,
     *   includeText: false,
     *   heroPresence: 80,
     *   heroName: 'Sandy the Crab',
     * });
     */
    async generateBookPlan(request: BookPlanRequest): Promise<BookPlanItem[]> {
        await this.ensureInitialized();

        const {
            userIdea,
            pageCount,
            audience,
            style,
            complexity,
            hasHeroRef,
            includeText,
            heroPresence = 100,
            heroName,
            signal,
        } = request;

        // Validate and cap complexity to audience maximum
        const audienceSpec = AUDIENCE_CHARACTERISTICS[audience] || AUDIENCE_CHARACTERISTICS['kids'];
        const complexityOrder: ComplexityId[] = ['Very Simple', 'Simple', 'Moderate', 'Intricate', 'Extreme Detail'];
        const maxComplexityIndex = complexityOrder.indexOf(audienceSpec.maxComplexity);
        const requestedComplexityIndex = complexityOrder.indexOf(complexity);
        const effectiveComplexity = requestedComplexityIndex > maxComplexityIndex
            ? audienceSpec.maxComplexity
            : complexity;

        // Get specifications
        const styleSpec = STYLE_CHARACTERISTICS[style] || STYLE_CHARACTERISTICS['Cartoon'];
        const complexitySpec = COMPLEXITY_CHARACTERISTICS[effectiveComplexity] || COMPLEXITY_CHARACTERISTICS['Moderate'];

        // Build text control instruction
        const textControlInstruction = includeText
            ? `TEXT CONTROL: You MAY include text if the user's idea calls for it (e.g., 'birthday card'). Set requiresText=true for those pages only.`
            : `TEXT CONTROL: STRICTLY FORBIDDEN from suggesting text. Set requiresText=false for ALL pages. No words in scene descriptions.`;

        // Build hero instruction
        const heroInstruction = hasHeroRef
            ? `
HERO CHARACTER DIRECTIVE:
- Hero Name: "${heroName || 'The Hero'}"
- Target Presence: ${heroPresence}% of pages (approximately ${Math.round(pageCount * heroPresence / 100)} pages)
- Pages WITH hero: Explicitly mention "${heroName || 'The Hero'}" in the prompt
- Pages WITHOUT hero: Focus on SETTING, PROPS, or SECONDARY CHARACTERS (maintain the same visual world)
- Plan the narrative arc so hero enters/exits naturally to achieve target presence
      `.trim()
            : '';

        const systemInstruction = `
ROLE: Creative Director for a professional coloring book series.
TASK: Create a cohesive ${pageCount}-page book plan for the idea: "${userIdea}"

═══════════════════════════════════════════════════════════════════════════════
SPECIFICATION CONSTRAINTS (From Style System v4.0)
═══════════════════════════════════════════════════════════════════════════════

STYLE: ${style}
- Line Quality: ${styleSpec.lineDescription}
- Best For: ${styleSpec.bestFor}
- Avoid: ${styleSpec.avoid}
- Default Vector Mode: ${styleSpec.vectorMode}

COMPLEXITY: ${effectiveComplexity}
- Region Count: ${complexitySpec.regionCount}
- Background: ${complexitySpec.backgroundAllowed ? 'Allowed' : 'NOT allowed - pure white void'}
- Detail Level: ${complexitySpec.detailLevel}
- Prompt Technique: ${complexitySpec.promptTrick}

AUDIENCE: ${audience}
- Tone: ${audienceSpec.toneAdjustment}
- PROHIBITED content: ${audienceSpec.prohibited.join(', ')}
- REQUIRED characteristics: ${audienceSpec.required.join(', ')}

═══════════════════════════════════════════════════════════════════════════════
PLANNING DIRECTIVES
═══════════════════════════════════════════════════════════════════════════════

[THINKING PROCESS]:
1. ANALYZE the user's idea and the audience constraints
2. ADAPT the idea to match audience rules (e.g., "Haunted House" + "toddlers" → "Cute Pumpkin House")
3. PLAN a narrative arc with beginning, middle, and end
4. ENSURE variety: mix close-ups, medium shots, wide shots, and pattern pages
5. VERIFY no two consecutive pages are too similar

[COMPOSITION RULES]:
- Center main subjects with 10% margin from edges (prevents PDF cropping)
- Include REST AREAS: ${effectiveComplexity === 'Moderate' ? '4-6' : effectiveComplexity === 'Intricate' || effectiveComplexity === 'Extreme Detail' ? '2-4' : 'N/A - keep simple'} empty white spaces for coloring comfort
- Maintain realistic scale relationships between objects

[RESEARCH-BACKED PRINCIPLES]:
1. MANDALA EFFECT: For simple complexity, use bounded/symmetrical elements for anxiety reduction
2. FUNCTIONAL REALISM: Objects must make physical sense (bicycles have pedals, clocks have hands)
3. VISUAL QUIET: Every line must serve a purpose - no random scribbles or noisy textures
4. COZY FACTOR: For cozy styles, prioritize nostalgia and safety in terminology

${textControlInstruction}

${heroInstruction}

[SCENE TYPE VARIETY]:
Distribute these scene types across the ${pageCount} pages:
- close-up: Face or single object focus (good for ${effectiveComplexity === 'Very Simple' || effectiveComplexity === 'Simple' ? 'most pages' : 'some pages'})
- medium: Character with context (standard scenes)
- wide: Environmental establishing shots
- pattern: Decorative/mandala-style pages (if style supports it)
- action: Dynamic movement scenes (if audience allows)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return a JSON array of ${pageCount} objects with these fields:
- pageNumber: integer (1 to ${pageCount})
- prompt: string (detailed scene description for image generation)
- vectorMode: "organic" | "geometric" | "standard" (based on scene content)
- complexityDescription: string (brief note on this page's detail level)
- requiresText: boolean
- sceneType: "close-up" | "medium" | "wide" | "pattern" | "action"
- heroAppears: boolean (whether the hero character is in this scene)

Generate the plan now.
`.trim();

        try {
            if (signal?.aborted) {
                throw new Error('Aborted');
            }

            const response = await this.ai!.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: 'Generate the book plan now.',
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                pageNumber: { type: Type.INTEGER },
                                prompt: { type: Type.STRING },
                                vectorMode: {
                                    type: Type.STRING,
                                    enum: ['organic', 'geometric', 'standard']
                                },
                                complexityDescription: { type: Type.STRING },
                                requiresText: { type: Type.BOOLEAN },
                                sceneType: {
                                    type: Type.STRING,
                                    enum: ['close-up', 'medium', 'wide', 'pattern', 'action']
                                },
                                heroAppears: { type: Type.BOOLEAN },
                            },
                            required: ['pageNumber', 'prompt', 'vectorMode', 'complexityDescription', 'requiresText'],
                        },
                    },
                    temperature: 0.8,
                },
            });

            if (signal?.aborted) {
                throw new Error('Aborted');
            }

            if (response.text) {
                const plan = JSON.parse(response.text) as BookPlanItem[];

                // Post-process: ensure vectorMode matches style default if not explicitly set
                return plan.map(item => ({
                    ...item,
                    vectorMode: item.vectorMode || styleSpec.vectorMode,
                    heroAppears: item.heroAppears ?? (hasHeroRef && heroPresence === 100),
                }));
            }

            return [];

        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'Aborted' || signal?.aborted) {
                throw new Error('Aborted');
            }
            console.error('Failed to generate book plan:', error);
            return [];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROMPT BRAINSTORMING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Expand a simple idea into a detailed, style-appropriate prompt
     */
    async brainstormPrompt(
        rawPrompt: string,
        pageCount: number = 1,
        context?: BrainstormContext
    ): Promise<string> {
        await this.ensureInitialized();

        // Get specifications if context provided
        const styleSpec = context?.style
            ? STYLE_CHARACTERISTICS[context.style]
            : null;
        const audienceSpec = context?.audience
            ? AUDIENCE_CHARACTERISTICS[context.audience]
            : null;
        const complexitySpec = context?.complexity
            ? COMPLEXITY_CHARACTERISTICS[context.complexity]
            : null;

        const contextBlock = context ? `
═══════════════════════════════════════════════════════════════════════════════
CURRENT SETTINGS (Apply these to your output)
═══════════════════════════════════════════════════════════════════════════════

STYLE: ${context.style}
${styleSpec ? `- Line Quality: ${styleSpec.lineDescription}
- Best For: ${styleSpec.bestFor}
- Avoid: ${styleSpec.avoid}` : ''}

AUDIENCE: ${context.audience}
${audienceSpec ? `- Tone: ${audienceSpec.toneAdjustment}
- Prohibited: ${audienceSpec.prohibited.join(', ')}` : ''}

${complexitySpec ? `COMPLEXITY: ${context.complexity}
- Detail Level: ${complexitySpec.detailLevel}
- Regions: ${complexitySpec.regionCount}` : ''}

${context.heroName ? `HERO: "${context.heroName}" should be the clear protagonist.` : ''}

[AUDIENCE-SPECIFIC WORD LIMITS]:
- Toddlers/Preschool: Maximum 30 words, ONE distinct subject
- Kids: 40-50 words, medium complexity
- Adults/Seniors: 60-75 words, can include texture and pattern details
    `.trim() : '';

        const systemInstruction = pageCount > 1
            ? `
ROLE: Elite Prompt Engineer for Coloring Books (Multi-Page Collection).
TASK: Transform the user's theme into a cohesive ${pageCount}-page collection prompt.

${contextBlock}

[COLORING BOOK ENGINEERING]:
1. VARIETY: Ensure pages vary in composition (close-ups, wide shots, patterns)
2. CONSISTENCY: Keep the "universe" rules consistent throughout
3. CLARITY: Each scene must be distinct and printable as line art

[THINKING PROCESS]:
1. Identify core theme and potential sub-themes
2. Plan a progression (journey, season change, varying angles)
3. Ensure each page adds something new

OUTPUT FORMAT:
"A ${pageCount}-page collection exploring [theme]: Page 1 - [scene]. Page 2 - [scene]. ..." etc.

Return ONLY the formatted collection prompt. No explanations.
      `.trim()
            : `
ROLE: Elite Prompt Engineer for Coloring Books (Single Page).
TASK: Transform the user's simple idea into a professional image generation prompt.

${contextBlock}

[COLORING BOOK ENGINEERING]:
1. CLOSED SHAPES: Describe objects as having "distinct outlines". Avoid fog, mist, blur.
2. COMPOSITION: Center the main subject. Clear separation between foreground/background.
3. LIGHTING TRANSLATION: Don't describe "light" or "glow". Describe the LINES (radiating lines, sparkle shapes).
4. TEXTURE TRANSLATION: Don't say "furry". Say "texture lines representing fur".

[THINKING PROCESS]:
1. VISUALIZE the scene in black and white line art
2. PHYSICS CHECK: Are objects floating? Are liquids behaving correctly?
3. SIMPLIFY: Remove elements that rely on color to be understood
4. DESCRIBE: Write the final prompt

Keep the core idea of: "${rawPrompt}"
Focus on visual elements that translate well to black and white line art.

Return ONLY the improved prompt. No explanations.
      `.trim();

        try {
            const response = await this.ai!.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: rawPrompt,
                config: {
                    systemInstruction,
                    temperature: 0.85,
                },
            });

            return response.text?.trim() || rawPrompt;

        } catch (error) {
            console.error('Failed to brainstorm prompt:', error);
            return rawPrompt;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REFERENCE STYLE ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Analyze a reference image to extract its visual style DNA
     * for replication across generated pages.
     * 
     * Returns StyleDNA with fields aligned to our style system.
     */
    async analyzeReferenceStyle(
        imageBase64: string,
        mimeType: string,
        signal?: AbortSignal
    ): Promise<StyleDNA | null> {
        await this.ensureInitialized();

        const systemInstruction = `
ROLE: Expert Art Analyst specializing in coloring book illustration techniques.
TASK: Analyze this coloring page image and extract its visual style DNA for precise replication.

═══════════════════════════════════════════════════════════════════════════════
STYLE FAMILY REFERENCE (Match to ONE of these)
═══════════════════════════════════════════════════════════════════════════════

${Object.entries(STYLE_CHARACTERISTICS).map(([name, spec]) =>
            `- ${name}: ${spec.lineDescription}`
        ).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only, no markdown)
═══════════════════════════════════════════════════════════════════════════════

{
  "lineWeight": "[hairline|fine|medium|bold|ultra-bold]",
  "lineWeightMm": "[estimated thickness, e.g. '1.5mm-2mm']",
  "lineConsistency": "[uniform|variable|tapered]",
  "lineStyle": "[smooth-vector|hand-drawn|scratchy|brush-like]",
  "shadingTechnique": "[none|stippling|hatching|cross-hatch|solid-fills]",
  "density": "[sparse|moderate|dense|horror-vacui]",
  "whiteSpaceRatio": "[percentage, e.g. '40%']",
  "hasBorder": true/false,
  "borderStyle": "[thick-rounded|thin-rectangular|decorative|none]",
  "styleFamily": "[MUST be one of: ${VALID_STYLE_IDS.join(', ')}]",
  "temperature": [0.6-1.0],
  "promptFragment": "[2-3 sentences describing exact visual style for prompt injection]"
}

═══════════════════════════════════════════════════════════════════════════════
ANALYSIS GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

1. LINE WEIGHT:
   - hairline = nearly invisible, <0.3mm
   - fine = delicate, 0.3-0.5mm
   - medium = standard, 0.5-1mm
   - bold = clearly visible, 1-2mm
   - ultra-bold = very thick, 2mm+

2. LINE CONSISTENCY:
   - uniform = same thickness throughout (like Ligne Claire)
   - variable = natural hand-drawn variation
   - tapered = thick-to-thin calligraphic feel

3. SHADING TECHNIQUE:
   - "none" = pure black lines on white only (most common for coloring books)
   - Only mark stippling/hatching if actually present as texture indication

4. DENSITY:
   - sparse = lots of white space, simple subjects
   - moderate = balanced coverage
   - dense = most of page filled
   - horror-vacui = almost no white space

5. STYLE FAMILY:
   - MUST match one of the valid style IDs exactly
   - Choose the closest match based on line characteristics

6. TEMPERATURE:
   - 0.6-0.7 for styles needing precision (Geometric, Realistic, Bold & Easy)
   - 0.8-0.9 for organic/hand-drawn styles
   - 1.0 for maximum creative freedom

7. PROMPT FRAGMENT:
   - Write as instructions for an AI artist
   - Be specific about line qualities
   - Example: "Use bold 1.5mm uniform vector lines with smooth curves. No shading. Include thick rounded border with 5% padding."

RESPOND WITH JSON ONLY. No explanations.
`.trim();

        try {
            if (signal?.aborted) throw new Error('Aborted');

            const response = await this.ai!.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: {
                    parts: [
                        { text: 'Analyze this coloring page image and extract its style DNA:' },
                        {
                            inlineData: {
                                data: imageBase64,
                                mimeType,
                            },
                        },
                    ],
                },
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
                    temperature: 0.3, // Low temperature for consistent analysis
                },
            });

            if (signal?.aborted) throw new Error('Aborted');

            if (response.text) {
                try {
                    const parsed = JSON.parse(response.text) as StyleDNA;

                    // Validate styleFamily is a valid ID
                    if (parsed.styleFamily && !VALID_STYLE_IDS.includes(parsed.styleFamily as any)) {
                        console.warn(`Invalid styleFamily "${parsed.styleFamily}", defaulting to closest match`);
                        // Attempt to find closest match
                        const closestMatch = VALID_STYLE_IDS.find(id =>
                            parsed.styleFamily?.toLowerCase().includes(id.toLowerCase()) ||
                            id.toLowerCase().includes(parsed.styleFamily?.toLowerCase() || '')
                        );
                        parsed.styleFamily = closestMatch || 'Cartoon';
                    }

                    console.log('🔬 Style DNA extracted:', parsed);
                    return parsed;

                } catch (parseError) {
                    console.error('Failed to parse StyleDNA JSON:', parseError, response.text);
                    return null;
                }
            }

            return null;

        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'Aborted' || signal?.aborted) {
                throw new Error('Aborted');
            }
            console.error('Failed to analyze reference style:', error);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get style characteristics for UI display
     */
    getStyleInfo(styleId: StyleId): typeof STYLE_CHARACTERISTICS[string] | null {
        return STYLE_CHARACTERISTICS[styleId] || null;
    }

    /**
     * Get complexity characteristics for UI display
     */
    getComplexityInfo(complexityId: ComplexityId): typeof COMPLEXITY_CHARACTERISTICS[string] | null {
        return COMPLEXITY_CHARACTERISTICS[complexityId] || null;
    }

    /**
     * Get audience characteristics for UI display
     */
    getAudienceInfo(audienceId: AudienceId): typeof AUDIENCE_CHARACTERISTICS[string] | null {
        return AUDIENCE_CHARACTERISTICS[audienceId] || null;
    }

    /**
     * Check if a style/complexity/audience combination is valid
     */
    validateCombination(
        styleId: StyleId,
        complexityId: ComplexityId,
        audienceId: AudienceId
    ): { valid: boolean; warnings: string[]; effectiveComplexity: ComplexityId } {
        const warnings: string[] = [];
        const audienceSpec = AUDIENCE_CHARACTERISTICS[audienceId];

        const complexityOrder: ComplexityId[] = ['Very Simple', 'Simple', 'Moderate', 'Intricate', 'Extreme Detail'];
        const maxComplexityIndex = complexityOrder.indexOf(audienceSpec.maxComplexity);
        const requestedComplexityIndex = complexityOrder.indexOf(complexityId);

        let effectiveComplexity = complexityId;

        if (requestedComplexityIndex > maxComplexityIndex) {
            warnings.push(
                `Complexity "${complexityId}" exceeds maximum for "${audienceId}" audience. ` +
                `Will use "${audienceSpec.maxComplexity}" instead.`
            );
            effectiveComplexity = audienceSpec.maxComplexity;
        }

        // Style-specific warnings
        if (styleId === 'Gothic' && (audienceId === 'toddlers' || audienceId === 'preschool')) {
            warnings.push('Gothic style may be too intense for young children.');
        }

        if (styleId === 'Botanical' && complexityId === 'Very Simple') {
            warnings.push('Botanical style typically requires more detail than "Very Simple" allows.');
        }

        return {
            valid: warnings.length === 0,
            warnings,
            effectiveComplexity,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

let defaultInstance: ColoringStudioService | null = null;

/**
 * Get the default service instance (lazy initialization)
 */
export const getColoringStudioService = async (): Promise<ColoringStudioService> => {
    if (!defaultInstance) {
        defaultInstance = new ColoringStudioService();
        await defaultInstance.initialize();
    }
    return defaultInstance;
};

/**
 * Reset the default instance (useful for API key changes)
 */
export const resetColoringStudioService = (): void => {
    defaultInstance = null;
};
