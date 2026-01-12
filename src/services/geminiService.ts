/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { DirectPromptService } from './direct-prompt-service';

// Mocking a backend instance since we are running client-side
const backendService = new DirectPromptService();

export const brainstormPrompt = async (prompt: string): Promise<string> => {
  try {
    // In a production environment, this would be:
    // const response = await fetch('/api/brainstorm', { method: 'POST', body: JSON.stringify({ prompt }) });
    // const data = await response.json();
    // return data.enhancedPrompt;
    
    return await backendService.brainstormPrompt(prompt);
  } catch (error) {
    console.error("Failed to enhance prompt:", error);
    return prompt;
  }
};