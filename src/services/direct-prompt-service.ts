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

      STYLE GUIDE (HUMAN DESIGNER LOGIC):
      - VISUAL CLARITY: A coloring page is about *shapes*, not just *lines*. Ensure every object described has a clear, closed silhouette.
      - AVOID CLUTTER: Do not describe "busy" or "chaotic" scenes unless the Complexity is 'Extreme'.
      - FUNCTIONAL REALISM: If an object has a function (e.g., 'a bicycle'), describe its key structural parts (e.g., 'wheels', 'handlebars') to prevent abstract blobs.
      - SPECIFICITY: Avoid generic labels. Instead of 'a toy', say 'a teddy bear with stitched seams'. 

      INPUTS:
      - Idea: "${userIdea}"
      - Audience: ${audience}
      - Style: ${style}
      - Complexity: ${complexity}
      - Pages: ${pageCount}

      LOGIC MATRIX (COMPOSITION RULES):

      1. IF Complexity is 'Very Simple' (Level 1):
         - COMPOSITION: Single, isolated subject. Centered. 
         - BACKGROUND: NONE. White void.
         - DETAIL: Focus on large, distinct shapes. No tiny details.
         - EXAMPLE: Instead of "A forest full of animals", ask for "A single cute fox sitting."

      2. IF Complexity is 'Simple' (Level 2):
         - COMPOSITION: Main subject with 1-2 minor props.
         - BACKGROUND: Minimal hints (e.g., "a simple cloud," "a ground line").
         - DETAIL: Clear separation between objects.

      3. IF Complexity is 'Moderate' (Level 3):
         - COMPOSITION: Balanced scene. Subject + Environment.
         - BACKGROUND: Standard scenic elements but keep it open.

      4. IF Complexity is 'Intricate' or 'Extreme Detail':
         - COMPOSITION: "Horror Vacui" (Fear of empty space). Lush, full scenes.
         - BACKGROUND: Fully immersive textures and patterns.

      AUDIENCE TUNING:
      - The 'Audience' setting controls the *Tone* (Cute vs Serious), but 'Complexity' controls the *Density*.
      - IF Audience is 'Toddlers': Keep subjects cute, round, and friendly.
      - IF Audience is 'Adults': Subjects can be architectural, abstract, or realistic.

      GUIDELINES:
      1. ${textControlInstruction}
      
      2. VECTOR MODE:
         - 'organic': for nature, animals, characters.
         - 'geometric': for buildings, mandalas, tech, objects.
         - 'standard': for mixed scenes.

      3. VARIATION: Ensure each page is distinct but thematic.
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
      You are a Prompt Engineer specialized in generative AI for coloring books. 
      Take the user's simple idea and expand it into a descriptive coloring book scene. 
      Add details about setting, mood, and specific elements to draw. 
      Keep it under 40 words.
      Focus on visual elements that translate well to black and white line art.
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