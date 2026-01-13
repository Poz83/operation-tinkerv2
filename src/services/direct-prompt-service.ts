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
      1. THE MANDALA EFFECT: For 'Very Simple' or 'Simple' complexity, the goal is ANXIETY REDUCTION. Use repetitive, symmetrical, or 'bounded' elements. Avoid chaotic scattering.
      2. FUNCTIONAL REALISM: Objects must make physical sense. A bicycle must have pedals. A clock must have numbers or hands. Avoid "AI Dream Logic" (e.g., stairs leading nowhere).
      3. VISUAL QUIET: Neurodivergent users need 'Visual Quiet'. Avoid 'noisy' textures or random scribbles. Every line must serve a purpose.
      4. THE COZY FACTOR: For 'Bold & Easy' styles, prioritize 'Nostalgia' and 'Safety'. Use soft, rounded terminology in prompts.

      INPUTS:
      - Idea: "${userIdea}"
      - Audience: ${audience} (determines TONE, THEMING, and SUBJECT MATTER - e.g., cute vs. dignified, child-friendly vs. adult themes)
      - Style: ${style}
      - Complexity: ${complexity} (determines TECHNICAL SPECS: line weight, object density, background detail - these are independent of audience)
      - Pages: ${pageCount}

      IMPORTANT: Audience and Complexity work TOGETHER, not in conflict:
      - Audience controls WHAT subjects/themes to use and HOW to present them (tone)
      - Complexity controls HOW MANY elements and HOW THICK the lines are (technical specs)
      - Example: "Toddlers" audience + "Intricate" complexity = intricate detailed scenes with cute, child-friendly subjects
      - Example: "Seniors" audience + "Very Simple" complexity = bold, simple shapes with nostalgic, dignified themes

      LOGIC MATRIX (COMPOSITION RULES):
      - COMPOSITION RULE: Ensure all essential details are described as being in the 'center' or 'middle-ground'. Leave a 10% empty margin around edges to prevent cropping during PDF assembly.
      - REST AREAS: REST AREAS = empty white space OR simple solid shapes with minimal lines. NOT decorative motifs like clouds, flowers, or stars. For Moderate: include 4-6 REST AREAS. For Intricate: include 2-4 REST AREAS. Balance dense clusters with breathing space.
      - SEPARATION: Ensure 3-5mm separation between unrelated lines to avoid tangents.
      - SCALE: All objects must have realistic proportions relative to each other. A phone should not be larger than a lamp. Anchor scene with primary subject and scale everything else appropriately.

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
         - COMPOSITION: Standard scene with foreground/midground plus 4-6 REST AREAS. REST AREAS = empty white space or simple solid shapes, NOT decorative motifs like clouds/flowers/stars. Maintain 3-5mm separation.
         - BACKGROUND: Stylized but present; avoid wall-to-wall micro texture. Keep some areas intentionally empty.

      4. IF Complexity is 'Intricate'/'Extreme':
         - GOAL: "Mastery" / "Horror Vacui".
         - COMPOSITION: High detail with patterns/objects AND 2-4 REST AREAS (empty white space or simple anchor shapes). Maintain clear separation between elements.
         - PROMPT TRICK: "An immersive, highly detailed [Subject] with 2-4 calm empty regions for coloring comfort."

      AUDIENCE TUNING (TONE & THEMING ONLY - does NOT override complexity technical specs):
      - IF Audience is 'Toddlers': Keep subjects cute, round, and friendly. Use child-appropriate themes.
      - IF Audience is 'Seniors': Prioritize NOSTALGIA and DIGNITY. Use themes like 'Vintage Objects', 'Nature', 'Travel'. Avoid 'childish' cartoons.
      - IF Audience is 'Adults': Subjects can be architectural, abstract, or realistic. Allow mature themes.
      - IF Audience is 'S.E.N.' (Sensory Friendly): Use calming, predictable subjects. Avoid over-stimulating themes.
      - Note: The Complexity setting still controls line weight, density, and technical details regardless of audience choice.

      GUIDELINES:
      1. ${textControlInstruction}
      
      2. VECTOR MODE:
         - 'organic': for nature, animals, characters (Soft lines).
         - 'geometric': for buildings, mandalas, tech (Straight lines).
         - 'standard': for mixed scenes.

      3. NARRATIVE VARIATION: 
         - Don't just list objects. Give them a 'moment'. 
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