/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { getStoredApiKey } from '../lib/crypto';
import { DirectPromptService } from './direct-prompt-service';

export const brainstormPrompt = async (prompt: string): Promise<string> => {
  try {
    // Retrieve BYOK key if available
    const apiKey = await getStoredApiKey() || undefined;

    // Lazy instantiate service with the specific key
    const backendService = new DirectPromptService(apiKey);

    return await backendService.brainstormPrompt(prompt);
  } catch (error) {
    console.error("Failed to enhance prompt:", error);
    // Fail gracefully by returning original prompt
    return prompt;
  }
};