
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
    includeText: boolean
  ): Promise<BookPlanItem[]> {
    
    const textControlInstruction = includeText 
        ? "TEXT CONTROL: IF `includeText` is TRUE: You MAY include text if the user's idea asks for it (e.g. 'A birthday card'). Set `requiresText` to true for those pages."
        : "TEXT CONTROL: IF `includeText` is FALSE: You are STRICTLY FORBIDDEN from suggesting text. Set `requiresText` to false for ALL pages. Do not include words in the scene description.";

    const systemInstruction = `
      ROLE: Creative Director for a professional coloring book series.
      TASK: Create a coherent book plan based on the User's Idea.

      STYLE GUIDE (ANTI-AI LOOK):
      - AVOID generic descriptions (e.g., 'A dog sitting').
      - USE ARTISTIC keywords: 'Woodcut style', 'Stippling texture', 'Cross-hatching suggestions', 'Organic ink flow', 'Whimsical storybook illustration'.
      - COMPOSITION: Avoid 'centered floating objects'. Suggest backgrounds with 'distinct separation' but 'immersive framing'.
      
      OBJECT LOGIC & INTEGRITY:
      - FUNCTIONAL REALISM: If an object has a function (e.g., 'a chair', 'a bicycle', 'a house'), describe its key structural parts (e.g., 'legs', 'wheels', 'roof') to prevent abstract blobs.
      - INTERACTION: Ensure characters interact logically with their environment (e.g., feet planted on ground, hands gripping objects firmly).
      - SPECIFICITY: Avoid generic labels. Instead of 'a toy', say 'a teddy bear with stitched seams'. Instead of 'a plant', say 'a potted fern with fronds'.

      INPUTS:
      - Idea: "${userIdea}"
      - Audience: ${audience}
      - Style: ${style}
      - Pages: ${pageCount}
      - Hero Reference Available: ${hasHeroRef}

      INTUITION RULES:
      
      COMPLEXITY:
      - IF Audience is 'Toddlers': Force 'Extra thick lines, large isolated shapes, no background noise'.
      - IF Audience is 'Seniors': Force 'High contrast, large clear sections, distinct outlines (vision accessible)'.
      - IF Audience is 'S.E.N.': Force 'Calming simple patterns, predictable shapes, avoidance of over-stimulating details'.
      - IF Audience is 'Adults' OR 'Teens': Allow 'Intricate details, fine lines, complex shading suggestions'.
      - ELSE: Standard playful complexity, clear lines, storytelling elements.

      CHARACTER LOYALTY:
      - RESPECT THE USER'S SUBJECT: If user says 'Man', draw an ADULT. If user says 'Girl', draw a CHILD. Do not default to 'child characters' just because the Audience is 'Kids'.
      - AUDIENCE IMPACT: The 'Audience' setting controls the *complexity of the lines*, not the *age of the hero*.

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
    } catch (e) {
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
