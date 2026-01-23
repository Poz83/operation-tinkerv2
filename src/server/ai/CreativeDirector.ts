/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CREATIVE DIRECTOR v1.0 — Human-Like Book Planning System
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Transform a simple book concept into 40 unique, sellable coloring page prompts
 * using a 6-phase creative pipeline that mimics how a human creative director thinks.
 *
 * THE 6 PHASES:
 * 1. Research Brief → Market analysis, niche positioning
 * 2. Buyer Persona → Target audience profile
 * 3. Combinatorial Matrix → Settings × Characters × Actions grid
 * 4. Narrative Arc → Book flow structure (intro → peak → finale)
 * 5. Bulk Generation → Expand matrix to N prompts
 * 6. Self-Critique → Edit, dedupe, curate final list
 *
 * MODEL: Gemini 3 Flash Preview (for all phases)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { GoogleGenAI } from '@google/genai';
import { Logger } from '../../lib/logger';
import { AudienceId, ComplexityId, StyleId } from './gemini-client';

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Gemini 3 Flash - Fast, intelligent, "frontier intelligence" */
export const CREATIVE_DIRECTOR_MODEL = 'gemini-3-flash-preview';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Market research and niche analysis */
export interface CreativeBrief {
    nicheAnalysis: string;
    topSellingThemes: string[];
    themesThatSell: string[];
    themesToAvoid: string[];
    targetDemographic: string;
    toneAndStyle: string;
    uniqueAngle: string;
}

/** Target buyer profile */
export interface BuyerPersona {
    name: string;
    ageRange: string;
    occupation: string;
    personality: string;
    whyTheyBuy: string;
    whatMakesThemLaugh: string;
    painPoints: string[];
    desiredOutcome: string;
}

/** Combinatorial grid for guaranteed uniqueness */
export interface CombinatorialMatrix {
    settings: string[];      // 10 unique locations/environments
    characters: string[];    // 8 unique character types
    actions: string[];       // 10 unique actions/scenarios
    twists: string[];        // 5 unique ironic twists
}

/** Book structure with emotional arc */
export interface NarrativeArc {
    opening: { pageRange: [number, number]; theme: string; description: string };
    escalation: { pageRange: [number, number]; theme: string; description: string };
    peak: { pageRange: [number, number]; theme: string; description: string };
    meta: { pageRange: [number, number]; theme: string; description: string };
    finale: { pageRange: [number, number]; theme: string; description: string };
}

/** A single generated prompt with metadata */
export interface GeneratedPrompt {
    pageNumber: number;
    title: string;
    visualDescription: string;
    arcPhase: 'opening' | 'escalation' | 'peak' | 'meta' | 'finale';
    matrixCombo: {
        setting: string;
        character: string;
        action: string;
        twist?: string;
    };
    whyItWorks: string;
}

/** Self-critique results */
export interface CritiqueResult {
    keptPrompts: GeneratedPrompt[];
    cutPrompts: { prompt: GeneratedPrompt; reason: string }[];
    mergedPrompts: { original: GeneratedPrompt[]; merged: GeneratedPrompt }[];
    issues: string[];
    improvements: string[];
}

/** Final output from the Creative Director */
export interface CreativeDirectorResult {
    success: boolean;
    brief: CreativeBrief;
    persona: BuyerPersona;
    matrix: CombinatorialMatrix;
    arc: NarrativeArc;
    prompts: GeneratedPrompt[];
    critique: CritiqueResult;
    totalDurationMs: number;
    phaseDurations: {
        research: number;
        persona: number;
        matrix: number;
        arc: number;
        generation: number;
        critique: number;
    };
    error?: string;
}

/** Request to create a book plan */
export interface CreateBookPlanRequest {
    /** The book concept (e.g., "dumb ways to die", "cats doing yoga") */
    concept: string;
    /** Total number of pages to generate */
    totalPages: number;
    /** Target audience */
    audienceId: AudienceId;
    /** Complexity level */
    complexityId: ComplexityId;
    /** Visual style */
    styleId: StyleId;
    /** API key */
    apiKey: string;
    /** Abort signal */
    signal?: AbortSignal;
    /** Progress callback */
    onProgress?: (phase: string, message: string, percent: number) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════════════════════

const RESEARCH_BRIEF_PROMPT = `
You are a market research analyst specializing in Amazon KDP coloring books.
Your job is to analyze a book concept and provide strategic insights.

Given a book concept, analyze:
1. What similar books sell well on Amazon?
2. What themes resonate with buyers?
3. What themes to AVOID (oversaturated, offensive, etc.)?
4. Who is the target demographic?
5. What tone/style fits this concept?
6. What's the UNIQUE ANGLE that makes this book stand out?

OUTPUT FORMAT (JSON):
{
  "nicheAnalysis": "Brief market overview",
  "topSellingThemes": ["theme1", "theme2", "theme3"],
  "themesThatSell": ["specific themes that work"],
  "themesToAvoid": ["themes to skip"],
  "targetDemographic": "Who buys this",
  "toneAndStyle": "Humor style, visual approach",
  "uniqueAngle": "What makes this book special"
}

Return ONLY valid JSON.
`;

const BUYER_PERSONA_PROMPT = `
You are a marketing strategist creating a detailed buyer persona.
Based on the research brief, create a vivid, specific person who represents the ideal buyer.

This persona should feel REAL - give them a name, personality, specific preferences.
The goal is to have a "person" in mind when creating content.

OUTPUT FORMAT (JSON):
{
  "name": "First name only",
  "ageRange": "e.g., 28-42",
  "occupation": "Their job or life situation",
  "personality": "Key personality traits",
  "whyTheyBuy": "Why they want this book",
  "whatMakesThemLaugh": "Their sense of humor",
  "painPoints": ["What frustrates them", "What they need relief from"],
  "desiredOutcome": "What they want to feel after coloring"
}

Return ONLY valid JSON.
`;

const MATRIX_PROMPT = `
You are a creative brainstorming expert building a COMBINATORIAL MATRIX.
This matrix ensures every page idea is UNIQUE by combining different elements.

For the given concept, create:
- 10 unique SETTINGS (locations, environments)
- 8 unique CHARACTERS (types of people, creatures, objects)
- 10 unique ACTIONS (what's happening, the scenario)
- 5 unique TWISTS (ironic elements, unexpected angles)

The matrix should support generating at least 40 unique combinations.
Ensure variety - no two settings should be too similar.

OUTPUT FORMAT (JSON):
{
  "settings": ["setting1", "setting2", ...10 total],
  "characters": ["character1", "character2", ...8 total],
  "actions": ["action1", "action2", ...10 total],
  "twists": ["twist1", "twist2", ...5 total]
}

Return ONLY valid JSON.
`;

const NARRATIVE_ARC_PROMPT = `
You are a book editor designing the NARRATIVE FLOW of a coloring book.
Even a coloring book should have a satisfying arc - a beginning, middle, and end.

For a book with N pages, design an arc with 5 phases:
1. OPENING (first ~12%): Relatable, accessible intro scenes
2. ESCALATION (next ~25%): Increasing absurdity/complexity
3. PEAK (~25%): The most elaborate, wild, creative scenes
4. META (~25%): Self-aware, fourth-wall-breaking, callbacks
5. FINALE (~13%): Grand finale, most memorable scenes

OUTPUT FORMAT (JSON):
{
  "opening": { "pageRange": [1, N], "theme": "Theme name", "description": "What happens" },
  "escalation": { ... },
  "peak": { ... },
  "meta": { ... },
  "finale": { ... }
}

Return ONLY valid JSON. Page ranges must cover all N pages with no gaps.
`;

const BULK_GENERATION_PROMPT = `
You are a professional coloring book illustrator creating page concepts.
Using the combinatorial matrix and narrative arc, generate unique page ideas.

For each page, create:
- A short, catchy TITLE
- A detailed VISUAL DESCRIPTION (for AI image generation)
- The ARC PHASE it belongs to
- The MATRIX COMBINATION used
- WHY IT WORKS (appeal to the buyer persona)

CRITICAL RULES:
- Every page must be UNIQUE - no duplicate themes
- Visual descriptions must be 50-100 words
- Descriptions should be COLORABLE (line art, clear shapes)
- Match the tone to the buyer persona

OUTPUT FORMAT (JSON array):
[
  {
    "pageNumber": 1,
    "title": "Short catchy title",
    "visualDescription": "Detailed scene for image generation",
    "arcPhase": "opening|escalation|peak|meta|finale",
    "matrixCombo": { "setting": "...", "character": "...", "action": "...", "twist": "..." },
    "whyItWorks": "Appeal explanation"
  }
]

Return ONLY valid JSON array.
`;

const SELF_CRITIQUE_PROMPT = `
You are a senior editor reviewing page concepts before publication.
Your job is to CRITIQUE the generated pages and improve quality.

Review each page for:
1. DUPLICATES: Are any pages too similar? Merge or cut.
2. WEAK IDEAS: Does every page have strong appeal? Cut weak ones.
3. TONE CONSISTENCY: Does every page match the book's tone?
4. COLORABILITY: Can each description work as line art?
5. NARRATIVE FLOW: Does the arc feel satisfying?

OUTPUT FORMAT (JSON):
{
  "keptPrompts": [...pages that pass review, unchanged],
  "cutPrompts": [{ "prompt": {...}, "reason": "Why it was cut" }],
  "mergedPrompts": [{ "original": [...], "merged": {...} }],
  "issues": ["Overall issues found"],
  "improvements": ["Suggestions for the final list"]
}

Be RUTHLESS. Quality over quantity.
Return ONLY valid JSON.
`;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Phase 1: Generate Research Brief
 */
const generateResearchBrief = async (
    ai: GoogleGenAI,
    concept: string,
    audienceId: AudienceId,
    signal?: AbortSignal
): Promise<CreativeBrief> => {
    if (signal?.aborted) throw new Error('Aborted');

    const userPrompt = `
BOOK CONCEPT: "${concept}"
TARGET AUDIENCE: ${audienceId}

Analyze this coloring book concept and provide market insights.
`;

    const response = await ai.models.generateContent({
        model: CREATIVE_DIRECTOR_MODEL,
        contents: userPrompt,
        config: {
            systemInstruction: RESEARCH_BRIEF_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.7,
        } as any,
    });

    const result = JSON.parse(response.text || '{}');
    return result as CreativeBrief;
};

/**
 * Phase 2: Create Buyer Persona
 */
const createBuyerPersona = async (
    ai: GoogleGenAI,
    brief: CreativeBrief,
    audienceId: AudienceId,
    signal?: AbortSignal
): Promise<BuyerPersona> => {
    if (signal?.aborted) throw new Error('Aborted');

    const userPrompt = `
RESEARCH BRIEF:
${JSON.stringify(brief, null, 2)}

TARGET AUDIENCE: ${audienceId}

Create a detailed buyer persona for this coloring book.
`;

    const response = await ai.models.generateContent({
        model: CREATIVE_DIRECTOR_MODEL,
        contents: userPrompt,
        config: {
            systemInstruction: BUYER_PERSONA_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.8,
        } as any,
    });

    const result = JSON.parse(response.text || '{}');
    return result as BuyerPersona;
};

/**
 * Phase 3: Build Combinatorial Matrix
 */
const buildCombinatorialMatrix = async (
    ai: GoogleGenAI,
    concept: string,
    brief: CreativeBrief,
    totalPages: number,
    signal?: AbortSignal
): Promise<CombinatorialMatrix> => {
    if (signal?.aborted) throw new Error('Aborted');

    const userPrompt = `
BOOK CONCEPT: "${concept}"
TOTAL PAGES NEEDED: ${totalPages}
UNIQUE ANGLE: ${brief.uniqueAngle}
THEMES THAT SELL: ${brief.themesThatSell.join(', ')}
THEMES TO AVOID: ${brief.themesToAvoid.join(', ')}

Build a combinatorial matrix that can generate ${totalPages}+ unique page ideas.
`;

    const response = await ai.models.generateContent({
        model: CREATIVE_DIRECTOR_MODEL,
        contents: userPrompt,
        config: {
            systemInstruction: MATRIX_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.9, // High creativity for variety
        } as any,
    });

    const result = JSON.parse(response.text || '{}');
    return result as CombinatorialMatrix;
};

/**
 * Phase 4: Design Narrative Arc
 */
const designNarrativeArc = async (
    ai: GoogleGenAI,
    concept: string,
    totalPages: number,
    brief: CreativeBrief,
    signal?: AbortSignal
): Promise<NarrativeArc> => {
    if (signal?.aborted) throw new Error('Aborted');

    const userPrompt = `
BOOK CONCEPT: "${concept}"
TOTAL PAGES: ${totalPages}
TONE: ${brief.toneAndStyle}
UNIQUE ANGLE: ${brief.uniqueAngle}

Design a narrative arc for this ${totalPages}-page coloring book.
`;

    const response = await ai.models.generateContent({
        model: CREATIVE_DIRECTOR_MODEL,
        contents: userPrompt,
        config: {
            systemInstruction: NARRATIVE_ARC_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.6,
        } as any,
    });

    const result = JSON.parse(response.text || '{}');
    return result as NarrativeArc;
};

/**
 * Phase 5: Generate All Prompts
 */
const generateAllPrompts = async (
    ai: GoogleGenAI,
    concept: string,
    matrix: CombinatorialMatrix,
    arc: NarrativeArc,
    persona: BuyerPersona,
    totalPages: number,
    styleId: StyleId,
    complexityId: ComplexityId,
    signal?: AbortSignal
): Promise<GeneratedPrompt[]> => {
    if (signal?.aborted) throw new Error('Aborted');

    const userPrompt = `
BOOK CONCEPT: "${concept}"
TOTAL PAGES: ${totalPages}
VISUAL STYLE: ${styleId}
COMPLEXITY: ${complexityId}

BUYER PERSONA:
${JSON.stringify(persona, null, 2)}

COMBINATORIAL MATRIX:
${JSON.stringify(matrix, null, 2)}

NARRATIVE ARC:
${JSON.stringify(arc, null, 2)}

Generate exactly ${totalPages} unique page concepts.
Distribute them across the narrative arc phases.
Use different matrix combinations for each page.
`;

    const response = await ai.models.generateContent({
        model: CREATIVE_DIRECTOR_MODEL,
        contents: userPrompt,
        config: {
            systemInstruction: BULK_GENERATION_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.85,
            maxOutputTokens: 8000, // Enough for 40 pages
        } as any,
    });

    const result = JSON.parse(response.text || '[]');
    return result as GeneratedPrompt[];
};

/**
 * Phase 6: Self-Critique and Curate
 */
const selfCritique = async (
    ai: GoogleGenAI,
    prompts: GeneratedPrompt[],
    persona: BuyerPersona,
    targetCount: number,
    signal?: AbortSignal
): Promise<CritiqueResult> => {
    if (signal?.aborted) throw new Error('Aborted');

    const userPrompt = `
TARGET PAGE COUNT: ${targetCount}
BUYER PERSONA: ${persona.name} (${persona.ageRange}, ${persona.whyTheyBuy})

GENERATED PAGES TO REVIEW:
${JSON.stringify(prompts, null, 2)}

Critique these pages. Cut weak ones, merge duplicates, ensure quality.
The final list should have exactly ${targetCount} strong pages.
`;

    const response = await ai.models.generateContent({
        model: CREATIVE_DIRECTOR_MODEL,
        contents: userPrompt,
        config: {
            systemInstruction: SELF_CRITIQUE_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.4, // Lower for analytical work
            maxOutputTokens: 8000,
        } as any,
    });

    const result = JSON.parse(response.text || '{}');
    return result as CritiqueResult;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a complete book plan using the 6-phase Creative Director pipeline.
 */
export const createBookPlan = async (
    request: CreateBookPlanRequest
): Promise<CreativeDirectorResult> => {
    const startTime = Date.now();
    const { concept, totalPages, audienceId, complexityId, styleId, apiKey, signal, onProgress } = request;

    const phaseDurations = {
        research: 0,
        persona: 0,
        matrix: 0,
        arc: 0,
        generation: 0,
        critique: 0,
    };

    try {
        const ai = new GoogleGenAI({ apiKey });

        // Phase 1: Research Brief
        onProgress?.('research', 'Analyzing market and niche...', 10);
        const researchStart = Date.now();
        const brief = await generateResearchBrief(ai, concept, audienceId, signal);
        phaseDurations.research = Date.now() - researchStart;
        Logger.info('AI', `Creative Director: Research complete (${phaseDurations.research}ms)`);

        // Phase 2: Buyer Persona
        onProgress?.('persona', `Creating buyer persona for ${audienceId}...`, 25);
        const personaStart = Date.now();
        const persona = await createBuyerPersona(ai, brief, audienceId, signal);
        phaseDurations.persona = Date.now() - personaStart;
        Logger.info('AI', `Creative Director: Persona "${persona.name}" created (${phaseDurations.persona}ms)`);

        // Phase 3: Combinatorial Matrix
        onProgress?.('matrix', 'Building idea matrix...', 40);
        const matrixStart = Date.now();
        const matrix = await buildCombinatorialMatrix(ai, concept, brief, totalPages, signal);
        phaseDurations.matrix = Date.now() - matrixStart;
        Logger.info('AI', `Creative Director: Matrix built (${matrix.settings.length} settings × ${matrix.characters.length} characters)`);

        // Phase 4: Narrative Arc
        onProgress?.('arc', 'Designing book flow...', 55);
        const arcStart = Date.now();
        const arc = await designNarrativeArc(ai, concept, totalPages, brief, signal);
        phaseDurations.arc = Date.now() - arcStart;
        Logger.info('AI', `Creative Director: Narrative arc designed (${phaseDurations.arc}ms)`);

        // Phase 5: Bulk Generation
        onProgress?.('generation', `Generating ${totalPages} unique ideas...`, 70);
        const genStart = Date.now();
        const rawPrompts = await generateAllPrompts(ai, concept, matrix, arc, persona, totalPages, styleId, complexityId, signal);
        phaseDurations.generation = Date.now() - genStart;
        Logger.info('AI', `Creative Director: Generated ${rawPrompts.length} raw prompts (${phaseDurations.generation}ms)`);

        // Phase 6: Self-Critique
        onProgress?.('critique', 'Reviewing and refining...', 90);
        const critiqueStart = Date.now();
        const critique = await selfCritique(ai, rawPrompts, persona, totalPages, signal);
        phaseDurations.critique = Date.now() - critiqueStart;
        Logger.info('AI', `Creative Director: Critique complete - ${critique.keptPrompts.length} pages kept, ${critique.cutPrompts.length} cut`);

        // Finalize
        onProgress?.('complete', 'Book plan ready!', 100);

        return {
            success: true,
            brief,
            persona,
            matrix,
            arc,
            prompts: critique.keptPrompts,
            critique,
            totalDurationMs: Date.now() - startTime,
            phaseDurations,
        };

    } catch (error: any) {
        if (error.message === 'Aborted') {
            throw error;
        }

        Logger.error('AI', 'Creative Director failed', { error: error.message });

        return {
            success: false,
            brief: {} as CreativeBrief,
            persona: {} as BuyerPersona,
            matrix: {} as CombinatorialMatrix,
            arc: {} as NarrativeArc,
            prompts: [],
            critique: {} as CritiqueResult,
            totalDurationMs: Date.now() - startTime,
            phaseDurations,
            error: error.message,
        };
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick book plan with defaults
 */
export const quickBookPlan = async (
    concept: string,
    totalPages: number,
    apiKey: string
): Promise<CreativeDirectorResult> => {
    return createBookPlan({
        concept,
        totalPages,
        audienceId: 'adults',
        complexityId: 'Moderate',
        styleId: 'Whimsical',
        apiKey,
    });
};

/**
 * Extract just the visual descriptions for image generation
 */
export const extractPromptsForGeneration = (
    result: CreativeDirectorResult
): { pageNumber: number; prompt: string; title: string }[] => {
    return result.prompts.map(p => ({
        pageNumber: p.pageNumber,
        prompt: p.visualDescription,
        title: p.title,
    }));
};
