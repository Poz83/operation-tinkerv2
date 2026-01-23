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
import { GEMINI_TEXT_MODEL, GEMINI_FLASH_MODEL, StyleId, ComplexityId, AudienceId, STYLE_SPECS } from '../server/ai/gemini-client';
import { getStoredApiKey } from '../lib/crypto';
import { Logger } from '../lib/logger';
import type { StyleDNA } from '../types';

/**
 * Style characteristics for book planning
 * Extracted from prompts-v5.0 for consistency
 */
const STYLE_CHARACTERISTICS: Record<string, {
    lineDescription: string;
    bestFor: string;
    avoid: string;
    vectorMode: 'organic' | 'geometric' | 'standard' | 'illustration';
}> = {
    'Cozy': {
        lineDescription: 'Organic hand-drawn ink lines with variable weight',
        bestFor: 'Reading nooks, Blankets, Cats, Hot drinks, Candles, Plants',
        avoid: 'Straight lines, Industrial, Minimalist, Cold, Sterile',
        vectorMode: 'organic',
    },
    'Kawaii': {
        lineDescription: 'uniform monoline weight (no variation), soft vector curves',
        bestFor: 'mascots, anthropomorphic food, sweets, desserts, stickers, 2-head characters',
        avoid: 'noses, elbows, knees, realism, sharp angles, variable line weight',
        vectorMode: 'organic',
    },
    'Whimsical': {
        lineDescription: 'flowing Art Nouveau lines, organic variable weight',
        bestFor: 'Storybook scenes, Anthropomorphic animals, Scale distortion, Magical realism',
        avoid: '3d render, photorealism, shading, grayscale, straight lines, modern technology',
        vectorMode: 'organic',
    },
    'Cartoon': {
        lineDescription: 'thick vector outlines, rubber hose limbs',
        bestFor: 'mascots, funny situations, anthropomorphic objects, dynamic action',
        avoid: 'anime, manga, hatching, detailed hair, realism, static poses',
        vectorMode: 'standard',
    },
    'Botanical': {
        lineDescription: 'fine technical pen (Micron 005), precise vector lines',
        bestFor: 'Scientific specimens, Florilegium plates, Latin named species, cross-sections',
        avoid: 'photorealism, 3d render, octane render, shading, grayscale, blurry lines, text (unless Latin label)',
        vectorMode: 'organic',
    },
    'Realistic': {
        lineDescription: 'High-fidelity cross-hatching, academic precision, engraving style',
        bestFor: 'Portraits, Animals, Architecture, Scientific Studies',
        avoid: 'Cartoons, thick outlines, blurry shading, sketchy loose lines',
        vectorMode: 'standard',
    },
    'Geometric': {
        lineDescription: 'perfectly straight 0.8mm ruler lines only',
        bestFor: 'low-poly designs, crystalline structures, abstract forms',
        avoid: 'ANY curves, organic shapes',
        vectorMode: 'geometric',
    },
    'Fantasy': {
        lineDescription: 'Heroic RPG concept art with variable line weight',
        bestFor: 'RPG Characters, Monsters, Maps, Inventory Layouts',
        avoid: 'Static Poses, Photorealism, Greyscale, Muddy details',
        vectorMode: 'illustration',
    },
    'Gothic': {
        lineDescription: 'Woodcut/Engraving style with hatching textures',
        bestFor: 'Architecture, Victorian Fashion, Macabre Nature, Dark Fantasy',
        avoid: 'Cute/Kawaii, Cartoons, Modern clothing, Solid blacks, Grayscale',
        vectorMode: 'illustration',
    },
    'StainedGlass': {
        lineDescription: 'Bold leaded lines (Tiffany style) with mosaic segmentation',
        bestFor: 'Mandalas, Religious themes, Floral patterns, Celestial bodies',
        avoid: 'Thin lines, Sketching, Shading, Gradients, Realism',
        vectorMode: 'geometric',
    },
    'Mandala': {
        lineDescription: 'mathematically precise vector lines, 0.5mm uniform',
        bestFor: 'Meditation, Sacred Geometry, Fractals, Kaleidoscopes',
        avoid: 'Asymmetry, sketching, shading, organic drift, broken lines, paper texture',
        vectorMode: 'geometric',
    },
    'Zentangle': {
        lineDescription: 'Micron pen precision, high-contrast ZIA',
        bestFor: 'Mindfulness, ZIA, Word Tangles, Pattern Studies',
        avoid: 'Sketching, Graphite, Doodling (messy), Realism, Shading',
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
    vectorMode: 'organic' | 'geometric' | 'standard' | 'illustration';
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
            Logger.warn('SYSTEM', 'ColoringStudioService: No API key available');
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
    // BOOK PLAN GENERATION (v3.0 - Lightweight)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Generate a cohesive book plan based on user parameters
     * 
     * v3.0: Lightweight text prompt instead of complex JSON schema.
     * Much faster response time (~0.5s vs ~2-3s) and lower token cost.
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

        // Get style spec for vectorMode
        const styleSpec = STYLE_CHARACTERISTICS[style] || STYLE_CHARACTERISTICS['Cartoon'];
        const audienceSpec = AUDIENCE_CHARACTERISTICS[audience] || AUDIENCE_CHARACTERISTICS['kids'];

        // Build simple prompt
        const heroInstruction = hasHeroRef && heroName
            ? `\nHero character: "${heroName}" should appear in ~${heroPresence}% of pages.`
            : '';

        const prompt = `You are planning a ${pageCount}-page coloring book.

═══════════════════════════════════════════════════════════════════════════════
USER'S VISION (PRESERVE THIS EXACTLY)
═══════════════════════════════════════════════════════════════════════════════
"${userIdea}"

This is the user's creative intent. Every page MUST capture this theme/tone.
${heroInstruction}

═══════════════════════════════════════════════════════════════════════════════
SETTINGS
═══════════════════════════════════════════════════════════════════════════════
Style: ${style} | Audience: ${audience} | Complexity: ${complexity}
${audienceSpec.toneAdjustment}

═══════════════════════════════════════════════════════════════════════════════
SCENE DESCRIPTION RULES
═══════════════════════════════════════════════════════════════════════════════
Each scene must be a SPECIFIC VISUAL MOMENT, not a vague concept:

✅ GOOD: "A man pokes a wasp nest with a stick while standing on a wobbly ladder, grinning obliviously"
❌ BAD: "The man stares intently as danger approaches"

✅ GOOD: "A chef tastes soup from a ladle, not noticing the fire engulfing his hat"  
❌ BAD: "The chef's eyes widen in shock"

For HUMOR themes: Capture the SETUP, not the punchline. Show the ironic moment BEFORE disaster.
For ACTION themes: Freeze the peak moment of movement.
For CALM themes: Show the serene environment with clear focal point.

MAKE IT VISUAL:
- What is the character DOING? (specific action, not "staring")
- What objects are in the scene? (name them specifically)
- What makes this scene FUNNY/INTERESTING/BEAUTIFUL?

Vary compositions: close-ups, wide shots, action scenes, calm moments.
${includeText ? 'Text is allowed if it fits the scene.' : 'No text on pages.'}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════════════════════
Return ONLY ${pageCount} numbered scene descriptions, one per line.
Each description: 20-40 words, SPECIFIC and VISUAL.

1. [Scene description]
2. [Scene description]`;

        try {
            if (signal?.aborted) {
                throw new Error('Aborted');
            }

            const response = await this.ai!.models.generateContent({
                model: GEMINI_FLASH_MODEL, // Use faster Flash model
                contents: prompt,
                config: {
                    temperature: 0.9,
                },
            });

            if (signal?.aborted) {
                throw new Error('Aborted');
            }

            if (response.text) {
                // Parse numbered list into BookPlanItems
                const lines = response.text.trim().split('\n').filter(line => line.trim());
                const plan: BookPlanItem[] = [];

                for (let i = 0; i < lines.length && plan.length < pageCount; i++) {
                    const line = lines[i].trim();
                    // Remove numbering like "1." or "1)" or just number
                    const promptText = line.replace(/^\d+[\.\):\-\s]*/, '').trim();

                    if (promptText) {
                        const shouldHaveHero = hasHeroRef && (
                            heroPresence === 100 ||
                            Math.random() * 100 < heroPresence
                        );

                        plan.push({
                            pageNumber: plan.length + 1,
                            prompt: promptText,
                            vectorMode: styleSpec.vectorMode,
                            complexityDescription: complexity,
                            requiresText: includeText,
                            sceneType: this.inferSceneType(promptText),
                            heroAppears: shouldHaveHero,
                        });
                    }
                }

                // Fill remaining pages if AI returned fewer than requested
                while (plan.length < pageCount) {
                    plan.push({
                        pageNumber: plan.length + 1,
                        prompt: `${userIdea} - scene ${plan.length + 1}`,
                        vectorMode: styleSpec.vectorMode,
                        complexityDescription: complexity,
                        requiresText: includeText,
                        sceneType: 'medium',
                        heroAppears: hasHeroRef,
                    });
                }

                return plan;
            }

            return [];

        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'Aborted' || signal?.aborted) {
                throw new Error('Aborted');
            }
            Logger.error('AI', 'Failed to generate book plan:', error);
            return [];
        }
    }

    /**
     * Infer scene type from prompt text for variety tracking
     */
    private inferSceneType(prompt: string): 'close-up' | 'medium' | 'wide' | 'pattern' | 'action' {
        const lower = prompt.toLowerCase();
        if (lower.includes('close-up') || lower.includes('closeup') || lower.includes('portrait') || lower.includes('face')) {
            return 'close-up';
        }
        if (lower.includes('panorama') || lower.includes('landscape') || lower.includes('wide') || lower.includes('establishing')) {
            return 'wide';
        }
        if (lower.includes('pattern') || lower.includes('mandala') || lower.includes('decorative') || lower.includes('border')) {
            return 'pattern';
        }
        if (lower.includes('action') || lower.includes('running') || lower.includes('flying') || lower.includes('jumping') || lower.includes('fighting')) {
            return 'action';
        }
        return 'medium';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLARIFYING QUESTIONS (for "Make it Better" flow)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Generate smart clarifying questions based on the user's prompt.
     * These help the AI understand the user's creative vision better.
     */
    async generateClarifyingQuestions(
        userPrompt: string,
        context?: { style?: string; audience?: string }
    ): Promise<{ id: string; question: string; options: string[]; freeTextPlaceholder?: string }[]> {
        await this.ensureInitialized();

        // Detect theme categories in the prompt
        const lower = userPrompt.toLowerCase();
        
        // Theme detection
        const isHumor = lower.includes('funny') || lower.includes('humor') || lower.includes('silly') || 
                        lower.includes('die') || lower.includes('death') || lower.includes('dumb');
        const isAction = lower.includes('fight') || lower.includes('battle') || lower.includes('chase') ||
                         lower.includes('run') || lower.includes('escape');
        const isNature = lower.includes('forest') || lower.includes('garden') || lower.includes('flower') ||
                         lower.includes('animal') || lower.includes('wildlife');
        const isFantasy = lower.includes('dragon') || lower.includes('wizard') || lower.includes('magic') ||
                          lower.includes('fairy') || lower.includes('castle');

        const questions: { id: string; question: string; options: string[]; freeTextPlaceholder?: string }[] = [];

        // Humor-specific questions
        if (isHumor) {
            questions.push({
                id: 'humor_style',
                question: "What's the comedic style?",
                options: ['Ironic (oblivious to danger)', 'Slapstick (exaggerated disaster)', 'Dark/Morbid (gallows humor)', 'Cute/Absurd']
            });
            questions.push({
                id: 'humor_moment',
                question: 'Show which moment?',
                options: ['BEFORE disaster (setup)', 'DURING (action)', 'AFTER (aftermath)']
            });
        }

        // Action-specific questions
        if (isAction) {
            questions.push({
                id: 'action_intensity',
                question: 'Action intensity?',
                options: ['Mild (playful)', 'Medium (dynamic)', 'Intense (epic)']
            });
        }

        // Nature-specific questions
        if (isNature) {
            questions.push({
                id: 'nature_mood',
                question: 'What mood?',
                options: ['Peaceful/Serene', 'Wild/Untamed', 'Magical/Enchanted', 'Realistic/Scientific']
            });
        }

        // Fantasy-specific questions
        if (isFantasy) {
            questions.push({
                id: 'fantasy_tone',
                question: 'Fantasy tone?',
                options: ['Heroic/Epic', 'Whimsical/Cute', 'Dark/Mysterious', 'Fairytale/Classic']
            });
        }

        // Universal questions if no specific theme detected or to round out
        if (questions.length < 2) {
            questions.push({
                id: 'composition',
                question: 'Preferred composition?',
                options: ['Close-up portrait', 'Full scene', 'Pattern/Decorative', 'Action shot']
            });
        }

        // Always add a free-text option for specific scenarios
        questions.push({
            id: 'specific_details',
            question: 'Any specific scenarios or details to include?',
            options: [],
            freeTextPlaceholder: 'e.g., "poking reactor with screwdriver", "standing on wobbly ladder"...'
        });

        return questions.slice(0, 3); // Max 3 questions
    }

    /**
     * Convert clarifying answers to context string for prompt enhancement
     */
    buildContextFromAnswers(answers: Record<string, string[]>): string {
        const parts: string[] = [];
        
        Object.entries(answers).forEach(([questionId, selectedOptions]) => {
            if (selectedOptions.length > 0) {
                const optionStr = selectedOptions.join(', ');
                
                switch (questionId) {
                    case 'humor_style':
                        parts.push(`Comedic style: ${optionStr}`);
                        break;
                    case 'humor_moment':
                        parts.push(`Show the moment: ${optionStr}`);
                        break;
                    case 'action_intensity':
                        parts.push(`Action level: ${optionStr}`);
                        break;
                    case 'nature_mood':
                        parts.push(`Mood: ${optionStr}`);
                        break;
                    case 'fantasy_tone':
                        parts.push(`Tone: ${optionStr}`);
                        break;
                    case 'composition':
                        parts.push(`Composition: ${optionStr}`);
                        break;
                    case 'specific_details':
                        parts.push(`Specific details: ${optionStr}`);
                        break;
                    default:
                        parts.push(optionStr);
                }
            }
        });
        
        return parts.join('. ');
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
TASK: Transform the user's theme into ${pageCount} DISTINCT scene descriptions.

${contentGuidance}

═══════════════════════════════════════════════════════════════════════════════
YOUR JOB: SCENE DESCRIPTIONS ONLY
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

VARIETY:
- Ensure ${pageCount} UNIQUE scenes. Do not repeat the same composition.
- Mix close-ups, medium shots, wide shots, and pattern compositions.
- If the subject is a single character, vary their activity and setting on every page.

OUTPUT FORMAT:
Return a numbered list from 1 to ${pageCount}.
Example:
1. [Scene description]
2. [Scene description]
...
${pageCount}. [Scene description]

CRITICAL: You MUST generate EXACTLY ${pageCount} items.
Return ONLY the numbered list. No intro. No outro.
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
                model: GEMINI_FLASH_MODEL,
                contents: rawPrompt,
                config: {
                    systemInstruction,
                    temperature: 0.9, // Higher creative temp for Flash
                },
            });

            return response.text?.trim() || rawPrompt;

        } catch (error) {
            Logger.error('AI', 'Failed to brainstorm prompt:', error);
            if (error instanceof Error) {
                Logger.debug('AI', 'Error details:', { message: error.message, stack: error.stack });
            }
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
  "styleFamily": "[MUST be one of: ${Object.keys(STYLE_SPECS).join(', ')}]",
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
   - 0.6-0.7 for styles needing precision (Geometric, Realistic, Hand Drawn Bold & Easy)
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

                    // Validate styleFamily is a valid ID from the known specs
                    // We use Object.keys(STYLE_SPECS) to check validity
                    const knownStyles = Object.keys(STYLE_SPECS);
                    if (parsed.styleFamily && !knownStyles.includes(parsed.styleFamily)) {
                        Logger.warn('AI', `Invalid styleFamily "${parsed.styleFamily}", defaulting to closest match`);
                        // Attempt to find closest match
                        const closestMatch = knownStyles.find(id =>
                            parsed.styleFamily?.toLowerCase().includes(id.toLowerCase()) ||
                            id.toLowerCase().includes(parsed.styleFamily?.toLowerCase() || '')
                        );
                        parsed.styleFamily = closestMatch || 'Cartoon';
                    }

                    Logger.info('AI', '🔬 Style DNA extracted:', parsed);
                    return parsed;

                } catch (parseError) {
                    Logger.error('AI', 'Failed to parse StyleDNA JSON', {
                        error: parseError,
                        text: response.text
                    });
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
