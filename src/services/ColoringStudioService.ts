/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COLORING STUDIO SERVICE v2.0
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Handles all AI text operations for the Coloring Book Studio:
 * - generateBookPlan(): Creates page-by-page plans for coloring books
 * - brainstormPrompt(): Expands simple ideas into detailed scene descriptions
 * - analyzeReferenceStyle(): Extracts StyleDNA from reference images
 *
 * v2.0 Changes:
 * - Integrated with prompts-v5.0 style/complexity/audience specifications
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
// STYLE SPECIFICATIONS (Aligned with prompts-v5.0)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valid style IDs - must match prompts-v5.0 exactly
 */
export const VALID_STYLE_IDS = [
    'Cozy Hand-Drawn',
    'Bold & Easy',
    'Kawaii',
    'Whimsical',
    'Cartoon',
    'Botanical',
    'Realistic',
    'Geometric',
    'Fantasy',
    'Gothic',
    'Mandala',
    'Zentangle',
] as const;

export type StyleId = typeof VALID_STYLE_IDS[number];

/**
 * Valid complexity IDs - must match prompts-v5.0 exactly
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
 * Valid audience IDs - must match prompts-v5.0 exactly
 */
export const VALID_AUDIENCE_IDS = [
    'toddlers',
    'preschool',
    'kids',
    'teens',
    'adults',
    'seniors',
] as const;

export type AudienceId = typeof VALID_AUDIENCE_IDS[number];

/**
 * Style characteristics for book planning
 * Extracted from prompts-v5.0 for consistency
 */
const STYLE_CHARACTERISTICS: Record<string, {
    lineDescription: string;
    bestFor: string;
    avoid: string;
    vectorMode: 'organic' | 'geometric' | 'standard';
}> = {
    'Cozy Hand-Drawn': {
        lineDescription: 'organic, wobbly 0.5-1mm lines with hand-drawn charm',
        bestFor: 'domestic scenes, comfort objects, gentle subjects',
        avoid: 'geometric precision, sharp angles',
        vectorMode: 'organic',
    },
    'Bold & Easy': {
        lineDescription: 'thick 4mm+ uniform lines, maximum simplicity',
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
        lineDescription: 'fine 0.3-0.5mm precise lines',
        bestFor: 'plants, flowers, scientific illustration subjects',
        avoid: 'solid fills, dense rendering',
        vectorMode: 'organic',
    },
    'Realistic': {
        lineDescription: 'uniform 0.6mm Ligne Claire contours',
        bestFor: 'accurate anatomy, technical illustration',
        avoid: 'line weight variation, hatching, stylization',
        vectorMode: 'standard',
    },
    'Geometric': {
        lineDescription: 'perfectly straight 0.8mm ruler lines only',
        bestFor: 'low-poly designs, crystalline structures, abstract forms',
        avoid: 'ANY curves, organic shapes',
        vectorMode: 'geometric',
    },
    'Fantasy': {
        lineDescription: 'detailed ink work with dramatic line weight variation',
        bestFor: 'epic scenes, mythical creatures, heroic characters',
        avoid: 'modern elements, casual poses',
        vectorMode: 'standard',
    },
    'Gothic': {
        lineDescription: 'fine to medium varied lines with ornate details',
        bestFor: 'medieval themes, dramatic atmospheric compositions',
        avoid: 'cheerful subjects, simple forms',
        vectorMode: 'standard',
    },
    'Mandala': {
        lineDescription: 'precise 0.5mm geometric lines with radial symmetry',
        bestFor: 'meditative patterns, symmetrical designs',
        avoid: 'asymmetry, organic variation',
        vectorMode: 'geometric',
    },
    'Zentangle': {
        lineDescription: 'consistent 0.5mm lines with pattern fills',
        bestFor: 'abstract patterns, structured doodling',
        avoid: 'representational imagery, tiny enclosed spaces',
        vectorMode: 'geometric',
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
        regionCount: '3-8 large colorable regions',
        backgroundAllowed: false,
        detailLevel: 'Single iconic subject with minimal internal detail',
        promptTrick: 'A sticker design of [Subject], A die-cut vector of [Subject]',
    },
    'Simple': {
        regionCount: '10-25 colorable regions',
        backgroundAllowed: true,
        detailLevel: 'Main subject with 1-2 supporting elements',
        promptTrick: 'A clean line art illustration of [Subject] framed by [Element]',
    },
    'Moderate': {
        regionCount: '40-80 colorable regions',
        backgroundAllowed: true,
        detailLevel: 'Complete scene with balanced detail distribution',
        promptTrick: 'A balanced scene with [Subject] including 4-6 rest areas',
    },
    'Intricate': {
        regionCount: '80-120 colorable regions',
        backgroundAllowed: true,
        detailLevel: 'Rich detailed scene with patterns and textures as shapes',
        promptTrick: 'A detailed illustration with [Subject] requiring fine motor control',
    },
    'Extreme Detail': {
        regionCount: '120-150+ colorable regions',
        backgroundAllowed: true,
        detailLevel: 'Expert-level complexity with shapes within shapes',
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
 * Integrated with prompts-v5.0 specifications for consistency.
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
        // Check sources in order: 1. Passed arg, 2. Storage, 3. Env variable
        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        const key = apiKey || await getStoredApiKey() || (envKey && envKey.startsWith('AIza') ? envKey : undefined);

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
SPECIFICATION CONSTRAINTS (From Style System v5.0)
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
     * Expand a simple idea into a detailed scene description.
     * 
     * IMPORTANT: This is a SCENE DESCRIPTION WRITER, not a prompt engineer.
     * All technical coloring book instructions (line styles, constraints, etc.)
     * are added later by buildPromptForGemini3() in prompts.ts.
     * 
     * This prevents double-instruction conflicts where both the enhancer
     * AND the prompt assembler tell the image gen the same things differently.
     */
    async brainstormPrompt(
        rawPrompt: string,
        pageCount: number = 1,
        context?: BrainstormContext
    ): Promise<string> {
        await this.ensureInitialized();

        // Get specifications if context provided (used for CONTENT decisions only)
        const audienceSpec = context?.audience
            ? AUDIENCE_CHARACTERISTICS[context.audience]
            : null;
        const complexitySpec = context?.complexity
            ? COMPLEXITY_CHARACTERISTICS[context.complexity]
            : null;

        // Build context for CONTENT guidance only (no technical instructions)
        const contentGuidance = context ? `
═══════════════════════════════════════════════════════════════════════════════
CONTENT GUIDANCE (Use for scene appropriateness, NOT technical style)
═══════════════════════════════════════════════════════════════════════════════

AUDIENCE: ${context.audience}
${audienceSpec ? `- Tone: ${audienceSpec.toneAdjustment}
- Prohibited Content: ${audienceSpec.prohibited.join(', ')}
- Required Characteristics: ${audienceSpec.required.join(', ')}` : ''}

${complexitySpec ? `SCENE DENSITY: ${context.complexity}
- ${complexitySpec.detailLevel}
- Approximately ${complexitySpec.regionCount}` : ''}

${context.heroName ? `PROTAGONIST: "${context.heroName}" should be the clear main character in the scene.` : ''}
`.trim() : '';

        // Word limits based on audience and complexity
        const wordLimits = audienceSpec
            ? (context?.audience === 'toddlers' || context?.audience === 'preschool')
                ? 'Maximum 30 words. Describe ONE clear subject.'
                : (context?.audience === 'kids')
                    ? 'Maximum 50 words. Medium scene complexity.'
                    : 'Maximum 75 words. Rich scene detail allowed.'
            : 'Maximum 60 words.';

        const systemInstruction = pageCount > 1
            ? `
ROLE: Scene Description Writer for a ${pageCount}-page illustrated collection.
TASK: Transform the user's theme into vivid scene descriptions.

${contentGuidance}

═══════════════════════════════════════════════════════════════════════════════
YOUR JOB: DESCRIBE SCENES ONLY
═══════════════════════════════════════════════════════════════════════════════

OUTPUT: Pure visual descriptions of what appears in each scene.

✅ INCLUDE:
- What subjects/characters are in the scene
- Their poses, expressions, actions
- Composition (what's in foreground, background, focal point)
- Setting and environment details
- Objects and props

❌ DO NOT INCLUDE (another system adds these):
- Art style instructions ("coloring book", "line art", "black and white")
- Technical requirements ("clean outlines", "closed shapes", "no shading")
- Texture descriptions ("outlined sections", "distinct outlines")
- Any mention of lines, strokes, or drawing technique
- Negative instructions ("no color", "avoid grey")

WORD LIMIT: ${wordLimits}

VARIETY: Mix close-ups, medium shots, wide shots, and pattern compositions.

OUTPUT FORMAT:
"Page 1: [scene description]. Page 2: [scene description]. ..." etc.

Return ONLY the scene descriptions. No explanations. No style instructions.
`.trim()
            : `
ROLE: Scene Description Writer.
TASK: Transform a simple idea into a vivid, detailed scene description.

${contentGuidance}

═══════════════════════════════════════════════════════════════════════════════
YOUR JOB: DESCRIBE THE SCENE ONLY
═══════════════════════════════════════════════════════════════════════════════

Think of yourself as a SCREENPLAY WRITER describing a shot, not a prompt engineer.

✅ INCLUDE:
- What is the main subject? Describe it vividly.
- What pose/expression/action are they in?
- What is the composition? (centered, off-center, close-up, wide shot)
- What is in the foreground?
- What is in the background?
- What supporting elements or props are visible?
- What is the setting/environment?

❌ DO NOT INCLUDE (another system adds these later):
- Art style instructions ("coloring book page", "line art", "illustration")
- Technical requirements ("clean outlines", "closed shapes")
- Texture descriptions ("outlined sections", "distinct outlines")
- Line descriptions ("bold lines", "fine lines", "smooth curves")
- Color mentions ("black and white", "no color", "pure white")
- Shading mentions ("no shading", "no gradients")
- Any negative instructions about what NOT to include

PRESERVE USER INTENT:
- Keep specific subjects the user mentioned (don't substitute)
- Keep named characters or species exactly as stated
- Keep explicit composition directions
- Keep quantity/number specifications

WORD LIMIT: ${wordLimits}

INPUT: "${rawPrompt}"

Return ONLY the enhanced scene description. No explanations. No technical instructions.
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
