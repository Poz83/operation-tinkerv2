/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Part } from '@google/genai';

export const GEMINI_TEXT_MODEL = 'gemini-3-pro-preview';
export const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview';

interface GenerateImageOptions {
  prompt: string;
  referenceImage?: { base64: string; mimeType: string };
  aspectRatio: string;
  resolution?: '1K' | '2K'; // Default to '1K'
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
const getSmartDimensionConfig = (aspectRatio: string, resolution: '1K' | '2K' = '1K') => {
  return {
    imageSize: resolution,
    aspectRatio: aspectRatio,
  };
};

export const generateWithGemini = async (options: GenerateImageOptions): Promise<GenerateImageResult> => {
  try {
    // Always initialize with the current API key from environment
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: Part[] = [
      { text: options.prompt }
    ];

    if (options.referenceImage) {
      parts.push({
        inlineData: {
          data: options.referenceImage.base64,
          mimeType: options.referenceImage.mimeType,
        },
      });
    }

    const imageConfig = getSmartDimensionConfig(options.aspectRatio, options.resolution);

    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: { parts },
      config: {
        imageConfig: imageConfig,
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || 'image/png';
      const base64Data = part.inlineData.data;
      // Construct a valid Data URI for the <img> tag
      return { imageUrl: `data:${mimeType};base64,${base64Data}` };
    }
    
    return { imageUrl: null, error: "No image data returned from API." };

  } catch (error: any) {
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