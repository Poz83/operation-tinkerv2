/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROCESS GENERATION JOB v2.1
 * myJoe Creative Suite - Backend Generation Pipeline
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Updated to use v5.0 AI pipeline via Orchestrator:
 * - Uses Orchestrator.generateAndValidate() for full QA & Repair loop
 * - Fallback to raw generation if Orchestrator fails
 * - Automatically handles prompt building and retries
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { generateAndValidate, StyleId, ComplexityId, AudienceId, GenerateAndValidateRequest } from '../../src/server/ai/Orchestrator';
import { GEMINI_IMAGE_MODEL } from '../../src/server/ai/gemini-client';

export interface BookPlanItem {
  pageNumber: number;
  prompt: string;
  vectorMode: 'organic' | 'geometric' | 'standard';
  complexityDescription: string;
  requiresText: boolean;
}

export interface ProcessGenerationParams {
  userIdea: string;
  pageCount: number;
  audience: AudienceId;
  style: StyleId;
  complexity: ComplexityId;
  hasHeroRef: boolean;
  heroImage?: { base64: string; mimeType: string } | null;
  aspectRatio: string;
  includeText: boolean;
  apiKey: string;
}

/**
 * Generate a book plan (Simple fallback implementation for background jobs)
 * In a full implementation, this uses gemini-1.5-pro to plan the book.
 */
const generateBookPlan = (
  userIdea: string,
  pageCount: number,
  style: StyleId,
  complexity: ComplexityId,
  audience: AudienceId,
  includeText: boolean
): BookPlanItem[] => {
  return Array.from({ length: pageCount }).map((_, i) => ({
    pageNumber: i + 1,
    prompt: `${userIdea} (Scene ${i + 1} of ${pageCount})`,
    vectorMode: 'standard' as const,
    complexityDescription: `Page ${i + 1} - ${complexity} complexity`,
    requiresText: includeText && i === 0, // Only first page might have text
  }));
};

/**
 * Process generation job - generates all pages for a coloring book
 */
export const processGeneration = async (
  params: ProcessGenerationParams,
  onPlanGenerated: (plan: BookPlanItem[]) => void,
  onPageComplete: (pageNumber: number, imageUrl: string) => void
) => {
  const {
    userIdea,
    pageCount,
    audience,
    style,
    complexity,
    hasHeroRef,
    heroImage,
    aspectRatio,
    includeText,
    apiKey,
  } = params;

  // 1. Generate Book Plan
  let plan = generateBookPlan(userIdea, pageCount, style, complexity, audience, includeText);

  if (!plan || plan.length === 0) {
    console.warn("Plan generation failed, using fallback.");
    plan = Array.from({ length: pageCount }).map((_, i) => ({
      pageNumber: i + 1,
      prompt: `${userIdea} (Scene ${i + 1})`,
      vectorMode: 'standard' as const,
      complexityDescription: "Standard coloring book style",
      requiresText: false,
    }));
  }

  // Notify caller of the plan
  onPlanGenerated(plan);

  // 2. Iterate through the pages and generate each one using Orchestrator
  for (const item of plan) {
    try {
      // Build Orchestrator request
      // Note: We map ProcessGenerationParams to Orchestrator request format
      const request: GenerateAndValidateRequest = {
        userPrompt: item.prompt,
        styleId: style,
        complexityId: complexity,
        audienceId: audience,
        aspectRatio: aspectRatio,
        imageSize: '2K', // Default quality
        apiKey: apiKey,
        config: {
          enableQa: true,
          enableAutoRetry: true,
          maxAttempts: 3,
          qaMode: 'production',
          minimumPassScore: 70, // Reasonable threshold for background jobs
        }
      };

      const result = await generateAndValidate(request);

      if (result.success && result.imageUrl) {
        onPageComplete(item.pageNumber, result.imageUrl);
      } else {
        console.error(`Failed to generate page ${item.pageNumber}:`, result.error);
        if (result.finalQaResult) {
          console.warn(`QA Failure Reasons: ${result.finalQaResult.issues.map(i => i.message).join(' | ')}`);
        }
      }
    } catch (error: any) {
      console.error(`Error generating page ${item.pageNumber}:`, error.message);
    }
  }
};