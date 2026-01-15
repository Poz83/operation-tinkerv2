/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Part } from '@google/genai';

const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview';

export interface EditImageOptions {
    sourceImage: { base64: string; mimeType: string };
    maskImage?: { base64: string; mimeType: string };
    editPrompt: string;
    signal?: AbortSignal;
}

export interface EditImageResult {
    imageUrl: string | null;
    error?: string;
}

/**
 * System instruction for image editing tasks.
 * Focuses on preserving the original style while making targeted edits.
 */
const EDIT_SYSTEM_INSTRUCTION = `
You are an expert image editor specializing in coloring book illustrations.
Your task is to edit images while preserving their original style and line art quality.

STRICT RULES:
1. PRESERVE THE ORIGINAL STYLE: Maintain the same line weight, artistic style, and overall aesthetic.
2. MAKE TARGETED EDITS: Only modify what the user specifically requests.
3. MAINTAIN COLORING BOOK FORMAT: Keep output as clean black and white line art.
4. PRESERVE UNMASKED REGIONS: If a mask is provided, focus edits on the masked (white) regions.
5. MAINTAIN COMPOSITION: Don't drastically change the layout unless explicitly requested.
6. QUALITY CONSISTENCY: The edited result should look like it was part of the original drawing.
`;

/**
 * Edit an image using Gemini's image generation capabilities.
 * Supports optional masking for targeted edits.
 */
export async function editImageWithGemini(options: EditImageOptions): Promise<EditImageResult> {
    try {
        // Check if aborted before starting
        if (options.signal?.aborted) {
            throw new Error('Aborted');
        }

        // Initialize with current API key
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        // Construct the edit prompt
        let promptText = '';

        if (options.maskImage) {
            promptText = `Edit this coloring book image. I have marked specific regions with a blue highlight mask.
      
EDIT INSTRUCTION: ${options.editPrompt}

IMPORTANT: 
- Focus your edits on the masked/highlighted regions
- Preserve all unmasked areas exactly as they are
- Maintain the same line art style and weight
- Keep the output as clean black and white line art suitable for coloring`;
        } else {
            promptText = `Edit this coloring book image according to the following instruction:

EDIT INSTRUCTION: ${options.editPrompt}

IMPORTANT:
- Maintain the same overall style and line weight
- Keep the output as clean black and white line art suitable for coloring
- Make the edit blend naturally with the existing artwork`;
        }

        // Build the parts array with source image
        const parts: Part[] = [
            { text: promptText },
            {
                inlineData: {
                    data: options.sourceImage.base64,
                    mimeType: options.sourceImage.mimeType,
                },
            },
        ];

        // Add mask image if provided
        if (options.maskImage) {
            parts.push({
                inlineData: {
                    data: options.maskImage.base64,
                    mimeType: options.maskImage.mimeType,
                },
            });
        }

        const response = await ai.models.generateContent({
            model: GEMINI_IMAGE_MODEL,
            contents: { parts },
            config: {
                systemInstruction: EDIT_SYSTEM_INSTRUCTION,
                temperature: 0.8, // Balanced for edits
            },
        });

        // Extract the generated image
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const base64Data = part.inlineData.data;
            return { imageUrl: `data:${mimeType};base64,${base64Data}` };
        }

        return { imageUrl: null, error: 'No image data returned from API.' };

    } catch (error: any) {
        // Handle abort
        if (error.name === 'AbortError' || error.message === 'Aborted' || options.signal?.aborted) {
            throw new Error('Aborted');
        }

        console.error('Image Edit API Error:', error);

        let message = error instanceof Error ? error.message : 'Unknown error';

        // Friendly error messages
        if (message.includes('403')) message = 'Access Denied (403): Please check your API Key.';
        if (message.includes('400')) message = 'Bad Request (400): The model could not process this edit.';
        if (message.includes('429')) message = 'Rate Limited (429): Please wait a moment before trying again.';
        if (message.includes('503')) message = 'Service Unavailable (503): Gemini is temporarily unavailable.';

        return { imageUrl: null, error: message };
    }
}
