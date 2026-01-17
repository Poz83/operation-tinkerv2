/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite/client" />

import { GoogleGenAI } from '@google/genai';
import { GEMINI_TEXT_MODEL } from '../server/ai/gemini-client';

/**
 * HeroLabService - Handles all AI text operations for the Hero Lab.
 * 
 * Methods:
 * - extractCharacterDNA(): Analyzes uploaded character images to extract DNA profile
 */
export class HeroLabService {

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
            console.warn("HeroLabService initialized without API Key. Calls will fail if key is not provided later.");
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
    static createWithKey(apiKey: string): HeroLabService {
        return new HeroLabService(apiKey);
    }

    /**
     * Extract Character DNA from an uploaded image.
     * Uses AI vision to analyze the character and populate DNA fields.
     * Used in "Replicate" mode to auto-fill the DNA form.
     */
    async extractCharacterDNA(
        imageBase64: string,
        mimeType: string,
        signal?: AbortSignal
    ): Promise<import('../types').CharacterDNA | null> {
        this.ensureInitialized();

        const systemInstruction = `
ROLE: Expert Character Analyst for coloring book illustrations.

TASK: Analyze this character image and extract a detailed "Character DNA" profile.
This DNA will be used to maintain consistency when generating the character in different poses/scenes.

OUTPUT FORMAT (JSON only, no markdown):
{
  "name": "[Suggest a fitting name based on the character's appearance/vibe, or 'Unknown Hero' if unclear]",
  "role": "[Character's apparent role: e.g., 'Space Explorer', 'Forest Guardian', 'Young Wizard']",
  "age": "[Apparent age range: e.g., 'Child (8-10)', 'Young Adult', 'Middle-aged']",
  "face": "[Detailed face description: jaw shape, cheekbones, nose, any distinctive features]",
  "eyes": "[Eye details: shape, size, expression, any unique marks]",
  "hair": "[Hair description: length, style, texture, any accessories like bows/clips]",
  "skin": "[Skin tone description if visible, or art style note]",
  "body": "[Body type and proportions: athletic, slim, round, chibi, etc.]",
  "signatureFeatures": "[CRITICAL - List ALL distinctive features: scars, birthmarks, accessories, jewelry, tattoos, unique clothing elements that MUST appear in every image]",
  "outfitCanon": "[Detailed outfit description: main clothing, colors (described not shown), accessories, footwear]",
  "styleLock": "[Art style: 'Cozy Hand-Drawn', 'Bold & Easy', 'Kawaii', 'Realistic', 'Cartoon', etc.]"
}

ANALYSIS GUIDELINES:
1. Be SPECIFIC about signature features - these are the anchors for consistency
2. Describe what you SEE, not what you imagine
3. For styleLock, match to the closest category: Cozy Hand-Drawn, Bold & Easy, Kawaii, Whimsical, Cartoon, Botanical, Mandala, Fantasy, Gothic, Cozy, Geometric, Wildlife, Floral, Abstract, Realistic
4. If the character has text/name visible, use it for the name field
5. Focus on VISUAL elements that can be replicated in line art

RESPOND WITH JSON ONLY. No explanations.
`;

        try {
            if (signal?.aborted) throw new Error('Aborted');

            const response = await this.ai!.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: {
                    parts: [
                        { text: "Analyze this character image and extract its DNA profile:" },
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
                    console.log('🧬 Character DNA extracted:', parsed);
                    return parsed as import('../types').CharacterDNA;
                } catch (parseError) {
                    console.error('Failed to parse CharacterDNA JSON:', parseError, response.text);
                    return null;
                }
            }
        } catch (e: any) {
            if (e.name === 'AbortError' || e.message === 'Aborted' || signal?.aborted) {
                throw new Error('Aborted');
            }
            console.error("Failed to extract character DNA", e);
        }

        return null;
    }
}
