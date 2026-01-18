/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite/client" />

import { GoogleGenAI, Type } from '@google/genai';
import { GEMINI_TEXT_MODEL } from '../server/ai/gemini-client';

export interface BookPlanItem {
    pageNumber: number;
    prompt: string;
    vectorMode: 'organic' | 'geometric' | 'standard';
    complexityDescription: string;
    requiresText: boolean;
}

/**
 * ColoringStudioService - Handles all AI text operations for the Coloring Book Studio.
 * 
 * Methods:
 * - generateBookPlan(): Creates page-by-page plans for coloring books
 * - brainstormPrompt(): Expands simple ideas into detailed scene descriptions
 * - analyzeReferenceStyle(): Extracts StyleDNA from reference images
 */
export class ColoringStudioService {

    private ai: GoogleGenAI | null;

    private ensureInitialized(): void {
        if (!this.ai) {
            throw new Error("Gemini API Key is not configured. Please add your key in Settings.");
        }
    }

    constructor(apiKey?: string) {
        // Check multiple sources for the key
        const key = apiKey ||
            (typeof process !== 'undefined' ? process.env?.API_KEY : undefined) ||
            (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_API_KEY : undefined);

        if (!key) {
            console.warn("ColoringStudioService initialized without API Key. Calls will fail if key is not provided later.");
        }

        if (key) {
            this.ai = new GoogleGenAI({ apiKey: key });
        } else {
            this.ai = null;
        }
    }

    /**
     * Create a new instance with a specific API key
     */
    static createWithKey(apiKey: string): ColoringStudioService {
        return new ColoringStudioService(apiKey);
    }

    async generateBookPlan(
        userIdea: string,
        pageCount: number,
        audience: string,
        style: string,
        hasHeroRef: boolean,
        includeText: boolean,
        complexity: string,
        heroPresence: number = 100,
        signal?: AbortSignal
    ): Promise<BookPlanItem[]> {
        this.ensureInitialized();

        const textControlInstruction = includeText
            ? "TEXT CONTROL: IF `includeText` is TRUE: You MAY include text if the user's idea asks for it (e.g. 'A birthday card'). Set `requiresText` to true for those pages."
            : "TEXT CONTROL: IF `includeText` is FALSE: You are STRICTLY FORBIDDEN from suggesting text. Set `requiresText` to false for ALL pages. Do not include words in the scene description.";

        const systemInstruction = `
      ROLE: Creative Director for a professional coloring book series.
      TASK: Create a coherent book plan based on the User's Idea.

      [AUDIENCE ADJUSTMENT RULES]:
      - 'toddlers/preschool': Rewrite ALL scary/action themes to be "Cute", "Safe", and "Happy". NO conflict.
      - 'kids': Allow "Cartoon Spooky" and "Adventure". No gore or realistic danger.
      - 'teens/adults': Allow darker, moodier, or more complex themes as requested.

      [THINKING PROCESS DIRECTIVES]:
      1. ANALYZE: First, think about the Audience (${audience}).
      2. ADAPT: Rewrite the user's idea ("${userIdea}") to match the [AUDIENCE ADJUSTMENT RULES] above.
         (Example: If User says "Haunted House" and Audience is "Toddler", plan a "Cute Pumpkin House" instead).
      3. PLAN STAGES: Plan a narrative arc for the ${pageCount} pages. Ensure there is a start, middle, and end.
      4. VARIETY CHECK: Verify that no two pages are too similar. Ensure a mix of close-ups, wide shots, and character moments.
      5. GENERATE: Output the final plan as a JSON array.

      RESEARCH-BACKED DESIGN PHILOSOPHY:
      1. THE MANDALA EFFECT: For 'Very Simple' or 'Simple' complexity, the goal is ANXIETY REDUCTION. Use repetitive, symmetrical, or 'bounded' elements. Avoid chaotic scattering.
      2. FUNCTIONAL REALISM: Objects must make physical sense. A bicycle must have pedals. A clock must have numbers or hands. Avoid "AI Dream Logic" (e.g., stairs leading nowhere).
      3. VISUAL QUIET: Neurodivergent users need 'Visual Quiet'. Avoid 'noisy' textures or random scribbles. Every line must serve a purpose.
      4. THE COZY FACTOR: For 'Bold & Easy' or 'Cozy Hand-Drawn' styles, prioritize 'Nostalgia' and 'Safety'. Use soft, rounded terminology in prompts.

      INPUTS:
      - Idea: "${userIdea}"
      - Audience: ${audience} (determines TONE, THEMING, and SUBJECT MATTER - e.g., cute vs. dignified, child-friendly vs. adult themes)
      - Style: ${style}
      - Complexity: ${complexity} (determines TECHNICAL SPECS: line weight, object density, background detail - these are independent of audience)
      - Pages: ${pageCount}
      
      IMPORTANT: Audience and Complexity work TOGETHER:
      - Audience controls WHAT subjects/themes to use.
      - Complexity controls HOW MANY elements and HOW THICK the lines are.

      LOGIC MATRIX (COMPOSITION RULES):
      - COMPOSITION RULE: Ensure all essential details are described as being in the 'center' or 'middle-ground'. Leave a 10% empty margin around edges to prevent cropping during PDF assembly.
      - REST AREAS: For Moderate: include 4-6 REST AREAS. For Intricate: include 2-4 REST AREAS. Balance dense clusters with breathing space.
      - SCALE: All objects must have realistic proportions relative to each other.

      1. IF Complexity is 'Very Simple' (Level 1):
         - GOAL: "Bold and Easy" / Instant Gratification.
         - COMPOSITION: Single, iconic subject. Centered. Pure white void background.
         - PROMPT TRICK: "A sticker design of [Subject]", "A die-cut vector of [Subject]".

      2. IF Complexity is 'Simple' (Level 2):
         - GOAL: "Relaxed Flow".
         - COMPOSITION: Main subject + 1 framing element. Minimal background hints.
         - PROMPT TRICK: "A clean line art illustration of [Subject] framed by [Element]".

      3. IF Complexity is 'Moderate' (Level 3):
         - GOAL: "Engagement".
         - COMPOSITION: Standard scene with foreground/midground plus 4-6 REST AREAS (empty white space).
         - BACKGROUND: Stylized but present; avoid wall-to-wall micro texture.

      4. IF Complexity is 'Intricate'/'Extreme':
         - GOAL: "Mastery" / "Horror Vacui".
         - COMPOSITION: High detail with patterns/objects AND 2-4 REST AREAS.
         - PROMPT TRICK: "An immersive, highly detailed [Subject] with 2-4 calm empty regions for coloring comfort."

      GUIDELINES:
      1. ${textControlInstruction}
      
      2. VECTOR MODE:
         - 'organic': for nature, animals, characters (Soft lines).
         - 'geometric': for buildings, mandalas, tech (Straight lines).
         - 'standard': for mixed scenes.

       3. NARRATIVE VARIATION: 
          - Don't just list objects. Give them a 'moment'. 
          - Good: "A chubby cat sleeping inside a cardboard box." (Nostalgia/Cozy).

       4. HERO PRESENCE DIRECTIVE:
          - The user wants the Main Hero to appear in approx ${heroPresence}% of the pages.
          - IF heroPresence < 100%: Plan the narrative arc so that the hero enters/exits the scenes to match this frequency.
          - Non-hero pages should focus on the SETTING, PROPS, or SECONDARY CHARACTERS, maintaining the same visual world but without the main character.
          - IMPORTANT: If a page is INTENDED to have the hero, explicitly mention "The Hero" or the character's name in the prompt. If it is NOT, do not mention them.

       5. OUTPUT: Return a JSON array of ${pageCount} items.
    `;

        try {
            if (signal?.aborted) {
                throw new Error('Aborted');
            }

            const response = await this.ai!.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: "Generate the book plan now.",
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                pageNumber: { type: Type.INTEGER },
                                prompt: { type: Type.STRING },
                                vectorMode: { type: Type.STRING, enum: ['organic', 'geometric', 'standard'] },
                                complexityDescription: { type: Type.STRING },
                                requiresText: { type: Type.BOOLEAN },
                            },
                            required: ['pageNumber', 'prompt', 'vectorMode', 'complexityDescription', 'requiresText'],
                        },
                    },
                },
            });

            if (response.text) {
                return JSON.parse(response.text) as BookPlanItem[];
            }
        } catch (e: any) {
            if (e.name === 'AbortError' || e.message === 'Aborted' || signal?.aborted) {
                throw new Error('Aborted');
            }
            console.error("Failed to generate book plan", e);
        }

        return [];
    }

    async brainstormPrompt(
        rawPrompt: string,
        pageCount: number = 1,
        context?: { style: string; audience: string; heroName?: string }
    ): Promise<string> {
        this.ensureInitialized();

        // Build context-aware system instruction
        const contextBlock = context ? `
    [CURRENT SETTINGS]
    - Target Audience: ${context.audience} (Adjust vocabulary and complexity to match).
    - Art Style: ${context.style} (Include specific keywords for this style).
    - Hero Character: ${context.heroName || 'None'} (If present, ensure they are the focus).

    [CONTEXT-AWARE RULES]
    1. If Audience is 'Toddlers' or 'Preschool': Keep the prompt SIMPLE with ONE distinct subject. Use gentle, happy tones. Maximum 30 words.
    2. If Audience is 'Kids': Allow adventure and fun. Medium complexity. 40-50 words.
    3. If Audience is 'Adults' or 'Seniors': Add details about texture, pattern complexity, and background elements. 60-75 words.
    4. If Style is 'Bold & Easy': Emphasize "thick lines, no tiny details, sticker-style".
    5. If Style is 'Botanical' or 'Mandala': Add "intricate patterns, fine details, symmetry".
    6. If Style is 'Kawaii': Add "chibi style, cute expressions, sparkles".
    7. If Hero is specified: Make them the clear protagonist of every scene.
        ` : '';

        // Different system instruction based on page count
        const singlePageInstruction = `
      ROLE: Elite Prompt Engineer for Coloring Books.
      TASK: Rewrite the user's simple idea into a professional image generation prompt.
      ${contextBlock}
      
      [THINKING PROCESS DIRECTIVES]:
      1. VISUALIZE: Imagine the scene in black and white line art.
      2. PHYSICS CHECK: Are simple objects floating? Are liquids behaving correctly? Ensure physical logic.
      3. SIMPLIFY: Remove any elements that rely on color to be understood (e.g. "a red apple" -> "a shiny apple with a leaf").
      4. DESCRIBE: Write the final description.

      Keep the core idea of: "${rawPrompt}".
      Focus on visual elements that translate well to black and white line art.
      
      OUTPUT: Return ONLY the raw improved prompt string. No conversational filler or explanations.
    `;

        const multiPageInstruction = `
      ROLE: Elite Prompt Engineer for Coloring Books, planning a cohesive ${pageCount}-page collection.
      TASK: Rewrite the user's theme into a professional multi-page collection prompt.
      ${contextBlock}
      
      [THINKING PROCESS DIRECTIVES]:
      1. THEME ANALYSIS: Identify the core theme and potential sub-themes.
      2. ARC PLANNING: Plan a progression (e.g. season change, journey, or varying angles).
      3. FORMATTING: Ensure the output matches the required format string exactly.

      Take the user's theme and create a NARRATIVE ARC across ${pageCount} pages. Each page should be a distinct scene that builds on the theme.
      Keep the core idea of: "${rawPrompt}".
      
      FORMAT YOUR RESPONSE AS:
      "A ${pageCount}-page collection exploring [theme]: Page 1 - [brief scene]. Page 2 - [brief scene]. ..." etc.
      
      OUTPUT: Return ONLY the formatted collection prompt. No explanations.
    `;

        const systemInstruction = pageCount > 1 ? multiPageInstruction : singlePageInstruction;

        try {
            const response = await this.ai!.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: rawPrompt,
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            return response.text?.trim() || rawPrompt;
        } catch (e) {
            console.error("Failed to brainstorm prompt", e);
            return rawPrompt;
        }
    }

    /**
     * Forensic Style Analysis - Analyzes a reference image to extract its visual style DNA
     * for replication across all generated pages.
     */
    async analyzeReferenceStyle(
        imageBase64: string,
        mimeType: string,
        signal?: AbortSignal
    ): Promise<import('../types').StyleDNA | null> {
        this.ensureInitialized();

        const systemInstruction = `
ROLE: Expert Art Analyst specializing in coloring book illustration techniques.

TASK: Analyze this coloring page image and extract its visual style DNA for precise replication.

OUTPUT FORMAT (JSON only, no markdown):
{
  "lineWeight": "[hairline|fine|medium|bold|ultra-bold]",
  "lineWeightMm": "[estimated thickness range, e.g. '1.5mm-2mm']",
  "lineConsistency": "[uniform|variable|tapered]",
  "lineStyle": "[smooth-vector|hand-drawn|scratchy|brush-like]",
  "shadingTechnique": "[none|stippling|hatching|cross-hatch|solid-fills]",
  "density": "[sparse|moderate|dense|horror-vacui]",
  "whiteSpaceRatio": "[percentage, e.g. '40%']",
  "hasBorder": [true|false],
  "borderStyle": "[thick-rounded|thin-rectangular|decorative|none]",
  "styleFamily": "[Cozy Hand-Drawn|Bold & Easy|Kawaii|Whimsical|Cartoon|Botanical|Mandala|Fantasy|Gothic|Cozy|Geometric|Wildlife|Floral|Abstract|Realistic]",
  "temperature": [0.7-1.2],
  "promptFragment": "[2-3 sentences describing the exact visual style for prompt injection]"
}

ANALYSIS GUIDELINES:
1. LINE WEIGHT: 
   - hairline = nearly invisible, requires close inspection
   - fine = delicate, 0.3-0.5mm
   - medium = standard, 0.5-1mm  
   - bold = clearly visible, 1-2mm
   - ultra-bold = very thick, 2mm+

2. LINE CONSISTENCY:
   - uniform = same thickness throughout
   - variable = natural hand-drawn variation
   - tapered = thick-to-thin with calligraphic feel

3. SHADING: Look for texture techniques. "none" = pure black lines on white only.

4. DENSITY: How much of the page is covered?
   - sparse = lots of white space, single subject
   - moderate = balanced coverage
   - dense = most of page filled
   - horror-vacui = almost no white space

5. TEMPERATURE: Lower (0.7) for styles needing precision, higher (1.2) for creative freedom.

6. PROMPT FRAGMENT: Write this as if instructing an AI artist. Be specific about line qualities, avoid vague terms. Example: "Use bold 1.5mm uniform vector lines with smooth curves. No shading techniques. Include thick rounded border frame with 5% internal padding."

RESPOND WITH JSON ONLY. No explanations.
`;

        try {
            if (signal?.aborted) throw new Error('Aborted');

            const response = await this.ai!.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: {
                    parts: [
                        { text: "Analyze this coloring page image and extract its style DNA:" },
                        {
                            inlineData: {
                                data: imageBase64,
                                mimeType: mimeType,
                            },
                        },
                    ],
                },
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                },
            });

            if (signal?.aborted) throw new Error('Aborted');

            if (response.text) {
                try {
                    const parsed = JSON.parse(response.text);
                    console.log('🔬 Style DNA extracted:', parsed);
                    return parsed as import('../types').StyleDNA;
                } catch (parseError) {
                    console.error('Failed to parse StyleDNA JSON:', parseError, response.text);
                    return null;
                }
            }
        } catch (e: any) {
            if (e.name === 'AbortError' || e.message === 'Aborted' || signal?.aborted) {
                throw new Error('Aborted');
            }
            console.error("Failed to analyze reference style", e);
        }

        return null;
    }
}
