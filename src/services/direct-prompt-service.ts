/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from '@google/genai';
import { GEMINI_TEXT_MODEL } from '../server/ai/gemini-client';

export interface BookPlanItem {
  pageNumber: number;
  prompt: string;
  vectorMode: 'organic' | 'geometric' | 'standard';
  complexityDescription: string;
  requiresText: boolean;
}

export class DirectPromptService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateBookPlan(
    userIdea: string,
    pageCount: number,
    audience: string,
    style: string,
    hasHeroRef: boolean,
    includeText: boolean,
    complexity: string,
    signal?: AbortSignal
  ): Promise<BookPlanItem[]> {
    
    const textControlInstruction = includeText 
        ? "TEXT CONTROL: IF `includeText` is TRUE: You MAY include text if the user's idea asks for it (e.g. 'A birthday card'). Set `requiresText` to true for those pages."
        : "TEXT CONTROL: IF `includeText` is FALSE: You are STRICTLY FORBIDDEN from suggesting text. Set `requiresText` to false for ALL pages. Do not include words in the scene description.";

    const systemInstruction = `
      ROLE: Creative Director for a professional coloring book series.
      TASK: Create a coherent book plan based on the User's Idea.

      RESEARCH-BACKED DESIGN PHILOSOPHY:
      1. THE MANDALA EFFECT: For 'Very Simple' or 'Simple' complexity, the goal is ANXIETY REDUCTION. Use repetitive, symmetrical, or 'bounded' elements. Avoid chaotic or random scattering.
      2. FUNCTIONAL REALISM: Objects must make physical sense. A bicycle must have pedals. A clock must have numbers or hands. Avoid "AI Dream Logic" (e.g., stairs leading nowhere).
      3. VISUAL QUIET: Neurodivergent users need 'Visual Quiet'. Avoid 'noisy' textures. Every line must serve a purpose.
      4. THE COZY FACTOR: For 'Bold & Easy' styles, prioritize 'Nostalgia' and 'Safety'. Use soft, rounded terminology in prompts.

      INPUTS:
      - Idea: "${userIdea}"
      - Audience: ${audience} (determines TONE, not complexity)
      - Style: ${style}
      - Complexity: ${complexity} (determines DENSITY)
      - Pages: ${pageCount}

      LOGIC MATRIX (COMPOSITION RULES):

      1. IF Complexity is 'Very Simple' (Level 1):
         - GOAL: "Bold and Easy" / Instant Gratification.
         - COMPOSITION: Single, iconic subject. Centered. 
         - BACKGROUND: Pure white void.
         - PROMPT TRICK: "A sticker design of [Subject]", "A die-cut vector of [Subject]".
         - AVOID: "Scenes", "Backgrounds", "Perspective".

      2. IF Complexity is 'Simple' (Level 2):
         - GOAL: "Relaxed Flow".
         - COMPOSITION: Main subject + 1 framing element (e.g., a window frame, a circle border).
         - BACKGROUND: Minimal hints (e.g., "simple clouds").
         - PROMPT TRICK: "A clean line art illustration of [Subject] framed by [Element]".

      3. IF Complexity is 'Moderate' (Level 3):
         - GOAL: "Engagement".
         - COMPOSITION: Standard scene with foreground/midground.
         - BACKGROUND: Stylized but present.

      4. IF Complexity is 'Intricate'/'Extreme':
         - GOAL: "Mastery" / "Horror Vacui".
         - COMPOSITION: Edge-to-edge detail. Hidden objects.
         - PROMPT TRICK: "An immersive, highly detailed [Subject] with hidden patterns in the textures."

      AUDIENCE TUNING:
      - The 'Audience' setting controls the *Tone* (Cute vs Serious), but 'Complexity' controls the *Density*.
      - IF Audience is 'Toddlers': Keep subjects cute, round, and friendly. Recognition is key (e.g. "A Truck", not "A Vehicle").
      - IF Audience is 'Seniors': Prioritize NOSTALGIA and DIGNITY. Use themes like 'Vintage Objects', 'Nature', 'Travel'. Avoid 'childish' cartoons. Ensure distinct separation of elements for visibility.
      - IF Audience is 'Adults': Subjects can be architectural, abstract, or realistic.

      GUIDELINES:
      1. ${textControlInstruction}
      
      2. VECTOR MODE:
         - 'organic': for nature, animals, characters (Soft lines).
         - 'geometric': for buildings, mandalas, tech (Straight lines).
         - 'standard': for mixed scenes.

      3. NARRATIVE VARIATION: 
         - Don't just list objects. Give them a 'moment'. 
         - Bad: "A cat." 
         - Good: "A chubby cat sleeping inside a cardboard box." (Nostalgia/Cozy).

      4. OUTPUT: Return a JSON array of ${pageCount} items.
    `;

    try {
      if (signal?.aborted) {
        throw new Error('Aborted');
      }

      const response = await this.ai.models.generateContent({
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

  async brainstormPrompt(rawPrompt: string): Promise<string> {
    const systemInstruction = `
      You are a Prompt Engineer specialized in 'Bold and Easy' coloring books.
      TRANSFORM the user's idea into a 'Cozy', 'Nostalgic', or 'Clear' concept.
      
      RULES:
      1. If the idea is complex (e.g. "Cyberpunk City"), Simplify it to a focal point (e.g. "A futuristic vending machine").
      2. Focus on NOUNS (objects) over ADJECTIVES (moods).
      3. Keep it under 40 words.
    `;

    try {
      const response = await this.ai.models.generateContent({
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
}