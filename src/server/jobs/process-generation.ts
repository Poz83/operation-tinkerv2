/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { DirectPromptService, BookPlanItem } from '../../services/direct-prompt-service';
import { generateWithGemini } from '../ai/gemini-client';
import { evaluatePublishability, QaHardFailReason } from '../../utils/publishability-qa';
import { buildPrompt } from '../ai/prompts';
import { PageGenerationEvent } from '../../logging/events';

// Simple utility to pause between generations (anti-hallucination cool-down)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ProcessGenerationParams {
  batchId?: string;
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
  onPageComplete: (pageNumber: number, imageUrl: string) => void,
  onPageEvent?: (event: PageGenerationEvent) => void
) => {
  const directPromptService = new DirectPromptService();
  const qaResults: Array<{
    pageNumber: number;
    qaScore: number;
    hardFailReasons: QaHardFailReason[];
    hardFail: boolean;
    imageUrl?: string;
    fullPrompt: string;
    fullNegativePrompt: string;
    startedAt?: string;
    finishedAt?: string;
    resolution: '1K' | '2K';
    width: number;
    height: number;
  }> = [];

  const buildRepairSuffix = (reasons: QaHardFailReason[]): string => {
    const directives: string[] = [];
    if (reasons.includes('margin')) {
      directives.push('Leave a blank 10% border; keep all elements inside the safe margin.');
    }
    if (reasons.includes('midtones')) {
      directives.push('Use pure black lines on pure white; no gray, no texture, no speckles.');
    }
    if (reasons.includes('speckles')) {
      directives.push('Remove stray dots or dust; no scattered marks in the background.');
    }
    if (reasons.includes('micro_clutter')) {
      directives.push('Merge tiny regions; enlarge enclosed areas; avoid tiny enclosed loops and micro-lines.');
    }
    return directives.length ? ` [REPAIR]: ${directives.join(' ')}` : '';
  };

  const allowedFailures = params.pageCount < 20 ? 1 : Math.floor(0.05 * params.pageCount);
  const maxRetryPagesPerBatch = Math.max(1, Math.ceil(0.02 * params.pageCount));

  // Retry tracking
  let hardFailCount = 0;
  let totalRetriesDone = 0;

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

    // HYBRID RESOLUTION: Determine base size (1K vs 2K) from params.complexity (user selection)
    // Note: Use params.complexity, NOT item.complexityDescription (which is AI-generated text)
    const isHighDetail = ['Moderate', 'Intricate', 'Extreme Detail'].includes(
      params.complexity
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

    const startedAtIso = new Date().toISOString();
    const startTime = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

    onPageEvent?.({
      type: 'start',
      pageNumber: item.pageNumber,
      batchId: params.batchId || '',
      aspectRatio: params.aspectRatio,
      resolution: isHighDetail ? '2K' : '1K',
      width: finalWidth,
      height: finalHeight,
      fullPrompt,
      fullNegativePrompt,
    });

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

    const finishedAtIso = new Date().toISOString();
    const latencyMs = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - startTime;

    if (result.imageUrl) {
      // Future: Add Vectorizer call here

      // Run QA on the generated image
      let qaScore = 0;
      let qaHardFail = false;
      let qaHardReasons: QaHardFailReason[] = [];
      let currentImageUrl = result.imageUrl;
      let currentFullPrompt = fullPrompt;
      let qa: any = null;

      try {
        qa = await evaluatePublishability({
          dataUrl: result.imageUrl,
          complexity: params.complexity,
          aspectRatio: params.aspectRatio,
        });
        qaScore = qa.score0to100;
        qaHardFail = qa.hardFail;
        qaHardReasons = qa.hardFailReasons;
      } catch (err) {
        console.warn('QA evaluation failed; proceeding without score', err);
      }

      // Retry logic: if hard fail and we're beyond allowed failures and within retry budget
      if (qaHardFail) {
        hardFailCount++;
        const needsRetry = hardFailCount > allowedFailures && totalRetriesDone < maxRetryPagesPerBatch;

        if (needsRetry) {
          console.log(`Page ${item.pageNumber} hard failed (score: ${qaScore}). Retrying with repair directives...`);

          // Build repair directive
          const repairSuffix = buildRepairSuffix(qaHardReasons);
          const repairPrompt = `${fullPrompt}${repairSuffix}`;

          try {
            // Regenerate with repair directives
            const retryResult = await generateWithGemini({
              prompt: repairPrompt,
              negativePrompt: fullNegativePrompt,
              aspectRatio: params.aspectRatio,
              resolution: isHighDetail ? '2K' : '1K',
              width: finalWidth,
              height: finalHeight,
              referenceImage: params.hasHeroRef && params.heroImage ? params.heroImage : undefined,
              signal: params.signal
            });

            if (params.signal?.aborted) throw new Error('Aborted');

            if (retryResult.imageUrl) {
              // Re-evaluate the retry
              try {
                const retryQa = await evaluatePublishability({
                  dataUrl: retryResult.imageUrl,
                  complexity: params.complexity,
                  aspectRatio: params.aspectRatio,
                });

                // Use retry result
                currentImageUrl = retryResult.imageUrl;
                currentFullPrompt = repairPrompt;
                qaScore = retryQa.score0to100;
                qaHardFail = retryQa.hardFail;
                qaHardReasons = retryQa.hardFailReasons;
                qa = retryQa;
                totalRetriesDone++;

                console.log(`Retry complete. New score: ${qaScore}, hardFail: ${qaHardFail}`);
              } catch (err) {
                console.warn('Retry QA evaluation failed; using retry image anyway', err);
                currentImageUrl = retryResult.imageUrl;
                currentFullPrompt = repairPrompt;
                totalRetriesDone++;
              }
            }
          } catch (retryErr) {
            console.error(`Retry failed for page ${item.pageNumber}:`, retryErr);
            // Continue with original result
          }
        } else {
          console.log(`Page ${item.pageNumber} hard failed but ${needsRetry ? 'retry budget exhausted' : 'within allowed failures'} (hardFailCount=${hardFailCount}, allowed=${allowedFailures}, retries=${totalRetriesDone}/${maxRetryPagesPerBatch})`);
        }
      }

      qaResults.push({
        pageNumber: item.pageNumber,
        qaScore,
        hardFail: qaHardFail,
        hardFailReasons: qaHardReasons,
        imageUrl: currentImageUrl,
        fullPrompt: currentFullPrompt,
        fullNegativePrompt,
        startedAt: startedAtIso,
        finishedAt: finishedAtIso,
        resolution: isHighDetail ? '2K' : '1K',
        width: finalWidth,
        height: finalHeight,
      });

      // Construct PageQa object for logging
      const pageQa = qa ? {
        tags: qa.tags as any[], // Will be filtered to valid QaTag values by logging
        score: qa.score0to100,
        hardFail: qa.hardFail,
        reasons: qa.reasons,
        rubricBreakdown: qa.rubric,
        notes: qa.hardFail ? `Hard fail detected: ${qa.hardFailReasons.join(', ')}` : undefined,
      } : undefined;

      onPageEvent?.({
        type: 'success',
        pageNumber: item.pageNumber,
        batchId: params.batchId || '',
        imageUrl: currentImageUrl,
        aspectRatio: params.aspectRatio,
        resolution: isHighDetail ? '2K' : '1K',
        width: finalWidth,
        height: finalHeight,
        fullPrompt: currentFullPrompt,
        fullNegativePrompt,
        startedAt: startedAtIso,
        finishedAt: finishedAtIso,
        latencyMs,
        qa: pageQa,
      });

      // Save output buffer/base64 to your database/storage (simulated by callback)
      onPageComplete(item.pageNumber, currentImageUrl);
    } else if (result.error) {
      console.error(`Failed to generate page ${item.pageNumber}:`, result.error);
      onPageEvent?.({
        type: 'error',
        pageNumber: item.pageNumber,
        batchId: params.batchId || '',
        error: result.error,
        startedAt: startedAtIso,
        finishedAt: finishedAtIso,
        latencyMs,
      });
    }
  }
};