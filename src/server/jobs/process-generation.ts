/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { DirectPromptService, BookPlanItem } from '../../services/direct-prompt-service';
import { generateWithGemini } from '../ai/gemini-client';
import { buildPrompt } from '../ai/prompts';

// Simple utility to pause between generations (anti-hallucination cool-down)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  signal?: AbortSignal;
}

export const processGeneration = async (
  params: ProcessGenerationParams,
  onPlanGenerated: (plan: BookPlanItem[]) => void,
  onPageComplete: (pageNumber: number, imageUrl: string) => void
) => {
  const directPromptService = new DirectPromptService();

  // Check before starting
  if (params.signal?.aborted) throw new Error('Aborted');

  // 1. Generate Book Plan
  let plan = await directPromptService.generateBookPlan(
    params.userIdea,
    params.pageCount,
    params.audience,
    params.style,
    params.hasHeroRef,
    params.includeText,
    params.complexity,
    params.signal
  );

  if (params.signal?.aborted) throw new Error('Aborted');

  // If AI fails to return a plan, create a default one so generation continues
  if (!plan || plan.length === 0) {
      // Check again in case it failed due to abort
      if (params.signal?.aborted) throw new Error('Aborted');

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
    if (params.signal?.aborted) throw new Error('Aborted');

    // HYBRID RESOLUTION: Determine base size (1K vs 2K) from complexity
    const isHighDetail = ['Moderate', 'Intricate', 'Extreme Detail'].includes(
      item.complexityDescription
    );
    const baseSize = isHighDetail ? 2048 : 1024;

    // DYNAMIC DIMENSIONS: Adjust width/height from aspect ratio
    let finalWidth = baseSize;
    let finalHeight = baseSize;
    if (params.aspectRatio === '3:4') {
      finalHeight = Math.round(baseSize * (4 / 3));
    }

    // PACING: Adaptive cool-down (longer for high detail)
    const coolDown = isHighDetail ? 8000 : 4000;
    if (item.pageNumber > 1) {
      await sleep(coolDown);
      if (params.signal?.aborted) throw new Error('Aborted');
    }

    const { fullPrompt, fullNegativePrompt } = buildPrompt(
      item.prompt,
      params.style,
      params.complexity,
      item.requiresText
    );

    // Trigger generation (per-page) after cool-down
    const result = await generateWithGemini({
      prompt: fullPrompt,
      negativePrompt: fullNegativePrompt,
      aspectRatio: params.aspectRatio,
      resolution: isHighDetail ? '2K' : '1K',
      width: finalWidth,
      height: finalHeight,
      referenceImage: params.hasHeroRef && params.heroImage ? params.heroImage : undefined,
      signal: params.signal
    });

    if (params.signal?.aborted) throw new Error('Aborted');

    if (result.imageUrl) {
      // Future: Add Vectorizer call here
      
      // Save output buffer/base64 to your database/storage (simulated by callback)
      onPageComplete(item.pageNumber, result.imageUrl);
    } else if (result.error) {
      console.error(`Failed to generate page ${item.pageNumber}:`, result.error);
    }
  }
};