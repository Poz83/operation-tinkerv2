/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Part } from '@google/genai';
import { SYSTEM_INSTRUCTION } from './prompts';
import { getStoredApiKey } from '../../lib/crypto';

export const GEMINI_TEXT_MODEL = 'gemini-3-pro-preview';
export const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview';

interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  referenceImage?: { base64: string; mimeType: string };
  aspectRatio: string;
  resolution?: '1K' | '2K' | '4K'; // Tiered: 1K (simple), 2K (moderate), 4K (intricate)
  width?: number;
  height?: number;
  temperature?: number; // 0.7-1.2 recommended range for coloring pages
  signal?: AbortSignal;
  apiKey?: string; // Optional: pass directly if available
}

export interface GenerateImageResult {
  imageUrl: string | null;
  error?: string;
}

/**
 * Helper to map aspect ratios to dimensions and API config.
 * While specific pixel dimensions (e.g. 896x1152 for 3:4) are conceptually calculated here,
 * the Gemini 3 Pro Image model in @google/genai SDK v1.27.0 utilizes 'imageSize' and 'aspectRatio' enums.
 * We ensure the passed configuration maps strictly to these supported values.
 */
const getSmartDimensionConfig = (
  aspectRatio: string,
  resolution: '1K' | '2K' | '4K' | undefined,
  width?: number,
  height?: number
) => {
  // Derive imageSize from explicit resolution first; otherwise infer from dimensions.
  if (!resolution) {
    const maxDim = Math.max(width ?? 0, height ?? 0);
    // Tiered resolution inference based on dimensions
    if (maxDim >= 3000) resolution = '4K';
    else if (maxDim >= 1536) resolution = '2K';
    else resolution = '1K';
  }

  return {
    imageSize: resolution,
    aspectRatio: aspectRatio,
  };
};

export const generateWithGemini = async (options: GenerateImageOptions): Promise<GenerateImageResult> => {
  try {
    // Check if aborted before starting
    if (options.signal?.aborted) {
      throw new Error('Aborted');
    }

    // Priority: 1) Passed apiKey, 2) User's stored key, 3) Environment variable
    let apiKey = options.apiKey;
    if (!apiKey) {
      apiKey = await getStoredApiKey() ?? undefined;
    }
    if (!apiKey) {
      return { imageUrl: null, error: "Configuration Error: Gemini API Key is missing. Please add your API key in Settings." };
    }
    const ai = new GoogleGenAI({ apiKey });

    const promptText = options.negativePrompt
      ? `${options.prompt}\n\nNEGATIVE PROMPT: ${options.negativePrompt}`
      : options.prompt;

    const parts: Part[] = [
      { text: promptText }
    ];

    if (options.referenceImage) {
      parts.push({
        inlineData: {
          data: options.referenceImage.base64,
          mimeType: options.referenceImage.mimeType,
        },
      });
    }

    const imageConfig = getSmartDimensionConfig(
      options.aspectRatio,
      options.resolution,
      options.width,
      options.height
    );

    // Wrap API call in a race with the abort signal to ensure immediate cancellation
    const generatePromise = ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        imageConfig: imageConfig,
        temperature: options.temperature ?? 1.0,
      },
    });

    const abortPromise = new Promise<never>((_, reject) => {
      if (options.signal?.aborted) reject(new Error('Aborted'));
      options.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
    });

    // @ts-ignore - Promise.race types can be tricky with SDK returns
    const response = await Promise.race([generatePromise, abortPromise]);

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || 'image/png';
      const base64Data = part.inlineData.data;
      // Construct a valid Data URI for the <img> tag
      return { imageUrl: `data:${mimeType};base64,${base64Data}` };
    }

    return { imageUrl: null, error: "No image data returned from API." };

  } catch (error: any) {
    // If aborted, rethrow so the caller handles it as a cancellation
    if (error.name === 'AbortError' || error.message === 'Aborted' || options.signal?.aborted) {
      throw new Error('Aborted');
    }

    console.error("Gemini API Error:", error);

    let message = error instanceof Error ? error.message : "Unknown error";

    // Provide friendlier messages for common error codes
    if (message.includes('403')) message = "Access Denied (403): Please check your API Key and billing status.";
    if (message.includes('400')) message = "Bad Request (400): The model refused the prompt or parameters.";
    if (message.includes('429')) message = "Quota Exceeded (429): You are generating too fast.";
    if (message.includes('503')) message = "Service Unavailable (503): Gemini is temporarily down.";

    return { imageUrl: null, error: message };
  }
};