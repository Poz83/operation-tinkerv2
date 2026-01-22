/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IDEA EXPANDER v1.0 — "10x Creative Brain"
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Transform vague user concepts into 10 distinct, market-ready coloring book ideas.
 * Each idea is creative, sellable, and includes a "Why it Sells" rationale.
 *
 * ARCHITECTURE:
 * - Uses Gemini 2.0 Flash for fast brainstorming
 * - Applies "Blue Ocean" creativity principles (unique niches, unexpected combos)
 * - Ensures ideas match audience & complexity constraints
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { GoogleGenAI } from '@google/genai';
import { Logger } from '../../lib/logger';
import { GEMINI_FLASH_MODEL, AudienceId, ComplexityId, StyleId } from './gemini-client';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExpandedIdea {
    /** Short, catchy title for the idea */
    title: string;
    /** Detailed visual description for prompt generation */
    visualDescription: string;
    /** Why this idea is marketable */
    whyItSells: string;
    /** Suggested style for this idea */
    suggestedStyle: StyleId;
    /** Unique hook or angle */
    uniqueAngle: string;
}

export interface ExpandIdeasRequest {
    /** User's vague concept (e.g., "cats", "space", "flowers") */
    concept: string;
    /** Number of ideas to generate (default: 10) */
    count?: number;
    /** Target audience for ideas */
    audienceId: AudienceId;
    /** Target complexity */
    complexityId: ComplexityId;
    /** API key */
    apiKey: string;
    /** Abort signal */
    signal?: AbortSignal;
}

export interface ExpandIdeasResult {
    success: boolean;
    ideas: ExpandedIdea[];
    error?: string;
    durationMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT - "BLUE OCEAN CREATIVE"
// ═══════════════════════════════════════════════════════════════════════════════

const BLUE_OCEAN_SYSTEM_PROMPT = `
You are a "10x Idea Generator" for professional coloring books sold on Amazon KDP and Etsy.

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Transform a simple concept into 10 DISTINCT, CREATIVE, SELLABLE coloring page ideas.
Each idea must be unique enough to stand alone as a compelling product.

═══════════════════════════════════════════════════════════════════════════════
BLUE OCEAN CREATIVITY PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

1. UNEXPECTED COMBINATIONS
   - Merge unrelated concepts: "Cat + Steampunk Clock", "Dragon + Sushi Chef"
   - Cross genres: Fantasy meets Everyday, Nature meets Technology

2. NICHE GOLDMINES
   - Target specific interests: "Cats for Plant Lovers", "Cats for Coffee Addicts"
   - Seasonal hooks: "Cats in Autumn Leaves", "Cats Celebrating Diwali"

3. EMOTIONAL RESONANCE
   - Cozy/Comfort themes (hygge vibes)
   - Nostalgia triggers (vintage, retro)
   - Aspirational (travel, adventure)

4. VISUAL UNIQUENESS
   - Unusual perspectives (bird's eye, worm's eye)
   - Scale play (tiny character in giant scene)
   - Frame-within-frame compositions

5. MARKET GAPS
   - Underserved audiences (seniors, left-handed, specific hobbies)
   - Trending themes (cottagecore, dark academia, goblincore)

═══════════════════════════════════════════════════════════════════════════════
WHAT MAKES A SELLABLE COLORING PAGE
═══════════════════════════════════════════════════════════════════════════════

- Clear subject and focal point (not cluttered chaos)
- Balance of detailed areas and "rest areas" (open spaces)
- Closed, colorable shapes (not scribbles)
- Appropriate difficulty for target audience
- Emotionally engaging (cute, dramatic, serene, etc.)
- Line art friendly (no gradients, no shading concepts)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ARRAY)
═══════════════════════════════════════════════════════════════════════════════

Return ONLY a valid JSON array with this structure:
[
  {
    "title": "Short catchy title",
    "visualDescription": "Detailed scene description for image generation (50-100 words)",
    "whyItSells": "Market appeal in one sentence",
    "suggestedStyle": "One of: Cozy, Kawaii, Whimsical, Cartoon, Botanical, Realistic, Geometric, Fantasy, Gothic, StainedGlass, Mandala, Zentangle",
    "uniqueAngle": "What makes this different from generic versions"
  }
]

CRITICAL: Return ONLY the JSON array. No markdown, no explanation, no preamble.
`;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Expand a vague concept into multiple creative, sellable ideas
 */
export const expandIdeas = async (
    request: ExpandIdeasRequest
): Promise<ExpandIdeasResult> => {
    const startTime = Date.now();
    const { concept, count = 10, audienceId, complexityId, apiKey, signal } = request;

    if (signal?.aborted) {
        throw new Error('Aborted');
    }

    // Build the user prompt with context
    const userPrompt = `
CONCEPT: ${concept}
TARGET AUDIENCE: ${audienceId}
COMPLEXITY LEVEL: ${complexityId}
NUMBER OF IDEAS NEEDED: ${count}

Generate ${count} unique, creative, sellable coloring page ideas based on this concept.
Remember: Each idea must be DISTINCT and have a clear "Why it Sells" angle.
`.trim();

    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: GEMINI_FLASH_MODEL,
            contents: userPrompt,
            config: {
                systemInstruction: BLUE_OCEAN_SYSTEM_PROMPT,
                temperature: 1.0, // High creativity
                maxOutputTokens: 2000,
            } as any,
        });

        if (signal?.aborted) {
            throw new Error('Aborted');
        }

        const rawText = response.text?.trim() || '[]';

        // Parse JSON response
        let ideas: ExpandedIdea[] = [];
        try {
            // Clean up potential markdown wrapping
            let jsonText = rawText;
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            ideas = JSON.parse(jsonText);

            // Validate structure
            ideas = ideas.filter(idea =>
                idea.title &&
                idea.visualDescription &&
                idea.whyItSells
            );

        } catch (parseError) {
            Logger.warn('AI', 'Failed to parse ideas JSON, using fallback');
            // Fallback: create a single idea from the concept
            ideas = [{
                title: `${concept} Coloring Page`,
                visualDescription: `A beautiful ${concept} scene perfect for coloring`,
                whyItSells: 'Classic appeal',
                suggestedStyle: 'Whimsical' as StyleId,
                uniqueAngle: 'Timeless design',
            }];
        }

        Logger.info('AI', `Generated ${ideas.length} ideas for "${concept}" in ${Date.now() - startTime}ms`);

        return {
            success: true,
            ideas,
            durationMs: Date.now() - startTime,
        };

    } catch (error: any) {
        if (error.message === 'Aborted') {
            throw error;
        }

        Logger.error('AI', 'Idea expansion failed', { error: error.message });

        return {
            success: false,
            ideas: [],
            error: error.message,
            durationMs: Date.now() - startTime,
        };
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick expand with defaults (for previews)
 */
export const quickExpand = async (
    concept: string,
    apiKey: string,
    audienceId: AudienceId = 'adults',
    complexityId: ComplexityId = 'Moderate'
): Promise<ExpandedIdea[]> => {
    const result = await expandIdeas({
        concept,
        count: 5,
        audienceId,
        complexityId,
        apiKey,
    });
    return result.ideas;
};

/**
 * Expand with specific count
 */
export const expandWithCount = async (
    concept: string,
    count: number,
    apiKey: string,
    audienceId: AudienceId = 'adults',
    complexityId: ComplexityId = 'Moderate'
): Promise<ExpandIdeasResult> => {
    return expandIdeas({
        concept,
        count: Math.min(count, 20), // Cap at 20 to avoid token limits
        audienceId,
        complexityId,
        apiKey,
    });
};
