/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { getStoredApiKey } from '../lib/crypto';
import { ColoringStudioService } from './ColoringStudioService';

export const brainstormPrompt = async (prompt: string, pageCount: number = 1): Promise<string> => {
  try {
    // Retrieve BYOK key if available
    const apiKey = await getStoredApiKey() || undefined;

    // Lazy instantiate service with the specific key
    const backendService = new ColoringStudioService(apiKey);

    return await backendService.brainstormPrompt(prompt, pageCount);
  } catch (error) {
    console.error("Failed to enhance prompt:", error);
    // Fail gracefully by returning original prompt
    return prompt;
  }
};