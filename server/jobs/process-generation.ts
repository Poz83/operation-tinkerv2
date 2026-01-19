/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROCESS GENERATION JOB v2.0
 * myJoe Creative Suite - Backend Generation Pipeline
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Updated to use v5.0 AI pipeline:
 * - Uses generateColoringPage from gemini-client v3.0
 * - Prompt building handled internally by gemini-client
 * - Removed deprecated negative_prompt handling
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { generateColoringPage, StyleId, ComplexityId, AudienceId } from '../ai/gemini-client';
import { buildPromptForGemini3 } from '../ai/prompts';

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
 * Generate a book plan using the v5.0 prompt system
 */
const generateBookPlan = (
  userIdea: string,
  pageCount: number,
  style: StyleId,
  complexity: ComplexityId,
  audience: AudienceId,
  includeText: boolean
): BookPlanItem[] => {
  // Create a simple book plan
  // In production, this would call ColoringStudioService.generateBookPlan
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

  // 2. Iterate through the pages and generate each one
  for (const item of plan) {
    try {
      const result = await generateColoringPage({
        userPrompt: item.prompt,
        styleId: style,
        complexityId: complexity,
        audienceId: audience,
        aspectRatio: aspectRatio,
        imageSize: '2K',
        apiKey: apiKey,
        enableLogging: true,
      });

      if (result.success && result.imageUrl) {
        onPageComplete(item.pageNumber, result.imageUrl);
      } else {
        console.error(`Failed to generate page ${item.pageNumber}:`, result.error);
      }
    } catch (error: any) {
      console.error(`Error generating page ${item.pageNumber}:`, error.message);
    }
  }
};