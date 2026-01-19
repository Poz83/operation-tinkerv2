/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { getStoredApiKey } from '../lib/crypto';
import { ColoringStudioService } from './ColoringStudioService';

export interface EnhanceContext {
  style: string;
  audience: string;
  heroName?: string;
}

export const brainstormPrompt = async (
  prompt: string,
  pageCount: number = 1,
  context?: EnhanceContext,
  apiKey?: string
): Promise<string> => {
  try {
    // Use provided key or retrieve stored one
    const validKey = apiKey || await getStoredApiKey() || undefined;

    // Lazy instantiate service with the specific key
    const backendService = new ColoringStudioService(validKey);

    // Pass pageCount and context for context-aware enhancement
    return await backendService.brainstormPrompt(prompt, pageCount, context ? {
      style: context.style as any,
      audience: context.audience as any,
      heroName: context.heroName
    } : undefined);
  } catch (error) {
    console.error("Failed to enhance prompt:", error);
    // Fail gracefully by returning original prompt
    return prompt;
  }
};