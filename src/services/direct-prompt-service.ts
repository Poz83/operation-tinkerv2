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
      console.warn("DirectPromptService initialized without API Key. Calls will fail if key is not provided later.");
    }

    // We initialize GoogleGenAI even with empty key if needed, or handle it.
    // The SDK might throw if key is missing, so we wrap it.
    if (key) {
      this.ai = new GoogleGenAI({ apiKey: key });
    } else {
      // @ts-ignore - Handle missing key case by creating a dummy or leaving undefined handling to methods
      this.ai = null;
    }
  }

  /**
   * Create a new instance with a specific API key
   */
  static createWithKey(apiKey: string): DirectPromptService {
    return new DirectPromptService(apiKey);
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
    this.ensureInitialized();

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

  async brainstormPrompt(rawPrompt: string, pageCount: number = 1): Promise<string> {
    this.ensureInitialized();

    // Different system instruction based on page count
    const singlePageInstruction = `
      You are a Creative Director for bestselling coloring books, specializing in evocative scene descriptions.
      
      Take the user's simple idea and expand it into a captivating coloring book scene.
      
      YOUR GOALS:
      1. ADD A VISUAL HOOK: What makes this image interesting to look at? A dramatic angle? An unusual setting? A heartwarming moment?
      2. SET THE MOOD: Use adjectives that evoke feeling (cozy, majestic, playful, serene).
      3. DESCRIBE A MOMENT: Instead of static objects, capture a narrative moment (a cat curling up for a nap, a flower unfolding at dawn).
      4. SPECIFY SETTING: Ground the subject in an environment (on a mossy rock, beside a crackling fireplace, in a sun-dappled forest).
      
      Keep it under 75 words.
      Focus on visual elements that translate well to black and white line art.
      Do NOT include style instructions (like "line art" or "coloring page") - just describe the scene itself.
    `;

    const multiPageInstruction = `
      You are a Creative Director for bestselling coloring books, planning a cohesive ${pageCount}-page collection.
      
      Take the user's theme and create a NARRATIVE ARC across ${pageCount} pages. Each page should be a distinct scene that builds on the theme.
      
      YOUR GOALS:
      1. VARIETY: Each page should show a different aspect, angle, or moment of the theme.
      2. PROGRESSION: Create a visual journey (e.g., morning to night, small to large, calm to exciting).
      3. COHESION: All pages should feel like they belong together in the same book.
      4. BALANCE: Mix close-up details with wider scenes. Include character moments and environmental scenes.
      
      FORMAT YOUR RESPONSE AS:
      "A ${pageCount}-page collection exploring [theme]: Page 1 - [brief scene]. Page 2 - [brief scene]. ..." etc.
      
      Keep each page description to 10-15 words.
      Focus on visual elements that translate well to black and white line art.
      Do NOT include style instructions - just describe the scenes.
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
  "styleFamily": "[Bold & Easy|Kawaii|Whimsical|Cartoon|Botanical|Mandala|Fantasy|Gothic|Cozy|Geometric|Wildlife|Floral|Abstract|Realistic]",
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