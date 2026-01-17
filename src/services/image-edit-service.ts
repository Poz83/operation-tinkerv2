/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Part } from '@google/genai';
import { getStoredApiKey } from '../lib/crypto';

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
export async function editImageWithGemini(options: EditImageOptions & { subject?: string }): Promise<EditImageResult> {
    try {
        if (options.signal?.aborted) {
            throw new Error('Aborted');
        }

        const apiKey = await getStoredApiKey();
        if (!apiKey) throw new Error('API Key not found');

        const ai = new GoogleGenAI({ apiKey });
        const subject = options.subject || "a coloring book image";

        // Google-recommended template for editing:
        // "Using the provided image of [subject], please [add/remove/modify] [element]..."
        // We wrap the user's specific request (options.editPrompt) into this structure.
        let promptText = '';

        if (options.maskImage) {
            promptText = `Using the provided image of ${subject}, please perform this edit: ${options.editPrompt}.
            
Focus ONLY on the masked (blue) regions. Preserve the unmasked areas exactly.`;
        } else {
            promptText = `Using the provided image of ${subject}, please perform this edit: ${options.editPrompt}.`;
        }

        // Add style enforcement to the prompt to ensure consistency even in micro-edits
        promptText += `\n\nSTYLE RULES:
- Maintain the original line art style (black and white, no shading).
- Ensure the edit blends seamlessly with the existing drawing.
- Do not introduce colors or grayscales.`;

        const parts: Part[] = [
            { text: promptText },
            {
                inlineData: {
                    data: options.sourceImage.base64,
                    mimeType: options.sourceImage.mimeType,
                },
            },
        ];

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
                temperature: 0.8,
            },
        });

        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            return { imageUrl: `data:${mimeType};base64,${part.inlineData.data}` };
        }

        return { imageUrl: null, error: 'No image data returned from API.' };

    } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'Aborted' || options.signal?.aborted) {
            throw new Error('Aborted');
        }

        console.error('Image Edit API Error:', error);
        let message = error instanceof Error ? error.message : 'Unknown error';

        if (message.includes('403')) message = 'Access Denied (403): Check API Key.';
        if (message.includes('400')) message = 'Bad Request (400): Model rejected edit.';
        if (message.includes('429')) message = 'Rate Limited (429): Please wait.';
        if (message.includes('503')) message = 'Service Unavailable (503).';

        return { imageUrl: null, error: message };
    }
}
