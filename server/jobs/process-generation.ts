/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { DirectPromptService, BookPlanItem } from '../../services/direct-prompt-service';
import { generateWithGemini } from '../ai/gemini-client';
import { buildPrompt } from '../ai/prompts';

export interface ProcessGenerationParams {
  userIdea: string;
  pageCount: number;
  audience: string;
  style: string;
  complexity: string;
  hasHeroRef: boolean;
  heroImage?: { base64: string; mimeType: string } | null;
  aspectRatio: string;
  includeText: boolean;
}

export const processGeneration = async (
  params: ProcessGenerationParams,
  onPlanGenerated: (plan: BookPlanItem[]) => void,
  onPageComplete: (pageNumber: number, imageUrl: string) => void
) => {
  const directPromptService = new DirectPromptService();

  // 1. Generate Book Plan
  let plan = await directPromptService.generateBookPlan(
    params.userIdea,
    params.pageCount,
    params.audience,
    params.style,
    params.hasHeroRef,
    params.includeText
  );

  // If AI fails to return a plan, create a default one so generation continues
  if (!plan || plan.length === 0) {
      console.warn("Plan generation failed, using fallback.");
      plan = Array.from({ length: params.pageCount }).map((_, i) => ({
          pageNumber: i + 1,
          prompt: `${params.userIdea} (Scene ${i + 1})`,
          vectorMode: 'standard',
          complexityDescription: "Standard coloring book style",
          requiresText: false
      }));
  }

  // Notify caller of the plan
  onPlanGenerated(plan);

  // 2. Iterate through the pages
  for (const item of plan) {
    const { fullPrompt, fullNegativePrompt } = buildPrompt(
      item.prompt,
      params.style,
      params.complexity,
      item.requiresText
    );

    // Combine positive and negative prompts for the model
    // Note: While some APIs support a distinct negative_prompt field, 
    // passing it explicitly in the text usually works best for general prompt adherence in this context.
    const finalPrompt = `${fullPrompt}\n\nNEGATIVE PROMPT: ${fullNegativePrompt}`;

    const result = await generateWithGemini({
      prompt: finalPrompt,
      aspectRatio: params.aspectRatio,
      resolution: '1K',
      referenceImage: (params.hasHeroRef && params.heroImage) ? params.heroImage : undefined 
    });

    if (result.imageUrl) {
      // Future: Add Vectorizer call here
      
      // Save output buffer/base64 to your database/storage (simulated by callback)
      onPageComplete(item.pageNumber, result.imageUrl);
    } else if (result.error) {
      console.error(`Failed to generate page ${item.pageNumber}:`, result.error);
    }
  }
};