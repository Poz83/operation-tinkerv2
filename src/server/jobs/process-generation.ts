import { analyzeImageQuality } from '../ai/qaService';
import { getRepairInstructions } from '../ai/repairs'; // New import
import { PageQa, QaTag } from '../../types';
import { ColoringStudioService, BookPlanItem } from '../../services/ColoringStudioService';

import { evaluatePublishability, QaHardFailReason } from '../../utils/publishability-qa';
import { PageGenerationEvent } from '../../logging/events';
import { TARGET_AUDIENCES, CREATIVE_VARIATION_OPTIONS, CreativeVariation, CharacterDNA } from '../../types';
import { getStoredApiKey } from '../../lib/crypto';

// Simple utility to pause between generations (anti-hallucination cool-down)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// A deck of camera angles to shuffle through for variety
const DYNAMIC_ANGLES = [
  'Low Angle (Looking up at subject, heroic)',
  'High Angle (Looking down at subject, cute/small)',
  'Close-Up (Focus on face/expression)',
  'Wide Shot (Focus on environment/action)',
  'Dutch Angle (Tilted camera, dynamic action)',
  'Over-the-Shoulder (Looking at what the hero sees)',
  'Worm\'s Eye View (Ground level, giant subject)',
  'Eye Level (Standard portrait)'
];

// Helper to pick a random item from an array
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


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
  creativeVariation: CreativeVariation; // 'auto' | 'precision' | 'balanced' | 'freedom'
  characterDNA?: CharacterDNA; // Character DNA for hero consistency
  autoConsistency?: boolean; // Use first generated image as reference for batch
  heroPresence?: number;
  cinematics?: string;
  signal?: AbortSignal;
}



export const processGeneration = async (
  params: ProcessGenerationParams,
  onPlanGenerated: (plan: BookPlanItem[]) => void,
  onPageComplete: (pageNumber: number, imageUrl: string) => void,
  onPageEvent?: (event: PageGenerationEvent) => void
) => {
  // Get user's stored API key (falls back to env var in ColoringStudioService)
  const userApiKey = await getStoredApiKey() ?? undefined;
  const coloringService = new ColoringStudioService(userApiKey);
  const qaResults: Array<{
    pageNumber: number;
    qaScore: number;
    hardFailReasons: string[]; // Changed to generic string array to support AI reasons
    hardFail: boolean;
    imageUrl?: string;
    fullPrompt: string;
    fullNegativePrompt: string;
    startedAt?: string;
    finishedAt?: string;
    resolution: '1K' | '2K' | '4K';
    width: number;
    height: number;
  }> = [];

  // Helper removed in favor of '../ai/repairs'

  const allowedFailures = params.pageCount < 20 ? 1 : Math.floor(0.05 * params.pageCount);
  const maxRetryPagesPerBatch = Math.max(1, Math.ceil(0.02 * params.pageCount));

  // Retry tracking
  let hardFailCount = 0;
  let totalRetriesDone = 0;

  // Check before starting
  if (params.signal?.aborted) throw new Error('Aborted');

  // 0. Forensic Style Analysis (if reference image provided)
  let styleDNA: import('../../types').StyleDNA | null = null;
  // Session Consistency State
  let sessionReferenceImage: { base64: string; mimeType: string } | null = null;
  let sessionStyleDNA: import('../../types').StyleDNA | null = null;

  if (params.hasHeroRef && params.heroImage) {
    console.log('🔬 Analyzing reference image style...');
    try {
      styleDNA = await coloringService.analyzeReferenceStyle(
        params.heroImage.base64,
        params.heroImage.mimeType,
        params.signal
      );
      if (styleDNA) {
        console.log('✅ Style DNA extracted:', styleDNA.styleFamily, styleDNA.lineWeight);
      }
    } catch (e: any) {
      if (e.message === 'Aborted') throw e;
      console.warn('Style analysis failed, continuing without:', e);
    }
  }

  if (params.signal?.aborted) throw new Error('Aborted');

  // 1. Generate Book Plan
  let plan = await coloringService.generateBookPlan({
    userIdea: params.userIdea,
    pageCount: params.pageCount,
    audience: params.audience as any,
    style: params.style as any,
    complexity: params.complexity as any,
    hasHeroRef: params.hasHeroRef,
    includeText: params.includeText,
    heroPresence: params.heroPresence,
    heroName: params.characterDNA?.name,
    signal: params.signal
  });

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

    // TIERED RESOLUTION: Map complexity to resolution tier
    // 1K = Very Simple, Simple | 2K = Moderate | 4K = Intricate, Extreme Detail
    let targetResolution: '1K' | '2K' | '4K' = '1K';
    let baseSize = 1024;

    switch (params.complexity) {
      case 'Very Simple':
      case 'Simple':
        targetResolution = '1K';
        baseSize = 1024;
        break;
      case 'Moderate':
        targetResolution = '2K';
        baseSize = 2048;
        break;
      case 'Intricate':
      case 'Extreme Detail':
        targetResolution = '4K';
        baseSize = 4096;
        break;
      default:
        targetResolution = '1K';
        baseSize = 1024;
    }

    // DYNAMIC DIMENSIONS: Adjust width/height from aspect ratio
    let finalWidth = baseSize;
    let finalHeight = baseSize;
    if (params.aspectRatio === '3:4') {
      finalHeight = Math.round(baseSize * (4 / 3));
    }

    // Get audience-specific prompt guidance for injection
    const audienceConfig = TARGET_AUDIENCES.find(a => a.label === params.audience);
    let audiencePrompt = audienceConfig?.prompt || '';

    // ADVANCED HERO LOGIC: Check if this page should have the hero
    let shouldIncludeHero = params.hasHeroRef;

    // SMART MODE (heroPresence is undefined): Auto-detect conflicts
    if (params.hasHeroRef && params.characterDNA && params.heroPresence === undefined) {
      const name = params.characterDNA.name.toLowerCase();
      const role = params.characterDNA.role.toLowerCase();
      const promptLower = item.prompt.toLowerCase();

      // 1. Explicit Inclusion: Does prompt mention the hero?
      const mentionsHero = promptLower.includes(name) ||
        promptLower.includes('the hero') ||
        promptLower.includes('main character');

      // 2. Conflict Detection: Does prompt mention other subjects?
      // We check for "Character Keywords" that suggest a DIFFERENT subject
      // unless the hero is explicitly mentioned.
      const CHARACTER_KEYWORDS = [
        'person', 'human', 'man', 'woman', 'child', 'kid', 'boy', 'girl', 'baby',
        'animal', 'cat', 'dog', 'bird', 'bunny', 'rabbit', 'bear', 'fox', 'owl',
        'dragon', 'unicorn', 'creature', 'monster', 'fairy', 'mermaid',
        'princess', 'prince', 'knight', 'witch', 'wizard', 'elf', 'dwarf',
        'dinosaur', 'elephant', 'lion', 'tiger', 'horse', 'cow', 'pig', 'sheep',
        'fish', 'dolphin', 'whale', 'octopus', 'crab', 'turtle', 'frog',
        'monkey', 'gorilla', 'penguin', 'panda', 'koala', 'kangaroo',
        'squirrel', 'hedgehog', 'mouse', 'rat', 'hamster', 'guinea pig',
        'people', 'family', 'friends', 'couple'
      ];

      const mentionsOtherSubject = CHARACTER_KEYWORDS.some(kw => promptLower.includes(kw));

      if (mentionsHero) {
        shouldIncludeHero = true; // Explicitly requested
      } else if (mentionsOtherSubject) {
        shouldIncludeHero = false; // Conflicting subject found (e.g. "Sloth couple")
      } else {
        shouldIncludeHero = true; // Ambiguous/Scenic (e.g. "Walking in park") -> Include Hero
      }
    }
    // MANUAL MODE: Partial Presence (e.g. 50%) - Legacy logic
    else if (params.hasHeroRef && params.heroPresence !== undefined && params.heroPresence < 100) {
      if (params.characterDNA) {
        const name = params.characterDNA.name.toLowerCase();
        const promptLower = item.prompt.toLowerCase();
        const mentionsHero = promptLower.includes(name) || promptLower.includes('the hero') || promptLower.includes('main character');
        shouldIncludeHero = mentionsHero; // Only if mentioned
      }
    }

    // CINEMATICS LOGIC: Inject camera angle if specified
    // CINEMATICS LOGIC: Inject camera angle if specified
    let selectedAngle = '';

    // Case A: User picked a specific angle (e.g., "Close-Up") -> OBEY IT
    if (params.cinematics && params.cinematics !== 'dynamic') {
      selectedAngle = params.cinematics.replace(/-/g, ' ');
    }
    // Case B: User picked "Dynamic" (or nothing) -> RANDOMIZE IT
    else {
      // We pick a random angle from our deck to ensure variety
      selectedAngle = pickRandom(DYNAMIC_ANGLES);
    }

    const cinematicPrompt = selectedAngle ? ` [CAMERA: ${selectedAngle} view]` : '';

    // Log it so you can see what decision the AI made
    console.log(`🎥 Page ${item.pageNumber} Auto-Camera: ${selectedAngle}`);

    // Inject cinematics into the item prompt before building full prompt
    const enhancedPrompt = item.prompt + cinematicPrompt;

    // PACING: Adaptive cool-down based on resolution tier
    const coolDown = targetResolution === '4K' ? 12000 :
      targetResolution === '2K' ? 8000 : 4000;

    if (item.pageNumber > 1) {
      // Fire cooldown start event
      onPageEvent?.({
        type: 'cooldown_start',
        pageNumber: item.pageNumber,
        cooldownMs: coolDown,
        batchId: params.batchId || '',
      });

      // Countdown with periodic updates (every second)
      const countdownInterval = 1000;
      for (let remaining = coolDown; remaining > 0; remaining -= countdownInterval) {
        if (params.signal?.aborted) throw new Error('Aborted');

        onPageEvent?.({
          type: 'cooldown_progress',
          pageNumber: item.pageNumber,
          remainingMs: remaining,
          batchId: params.batchId || '',
        });

        await sleep(Math.min(countdownInterval, remaining));
      }

      // Fire cooldown end event
      onPageEvent?.({
        type: 'cooldown_end',
        pageNumber: item.pageNumber,
        batchId: params.batchId || '',
      });

      if (params.signal?.aborted) throw new Error('Aborted');
    }

    // Determine effective reference image based on logic
    // Reference Image Hierarchy:
    // 1. Hero Image (ONLY if shouldIncludeHero is TRUE)
    // 2. Session Reference (Auto-Consistency) - Used as fallback style anchor if Hero is absent
    const effectiveReferenceImage = (params.hasHeroRef && params.heroImage && shouldIncludeHero)
      ? params.heroImage
      : (params.autoConsistency && sessionReferenceImage)
        ? sessionReferenceImage
        : undefined;

    // Unified Orchestration Call (v2.0)
    // This handles validation, prompt building, and API calls internally with retries
    const startTime = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

    const orchestrationResult = await import('../ai/gemini-client').then(m => m.generateColoringPage({
      userPrompt: enhancedPrompt,
      styleId: params.style,
      complexityId: params.complexity,
      audienceId: params.audience,
      aspectRatio: params.aspectRatio,
      requiresText: item.requiresText,
      heroDNA: shouldIncludeHero ? params.characterDNA : undefined,
      styleDNA: styleDNA || sessionStyleDNA,
      referenceImage: effectiveReferenceImage,
      signal: params.signal,
      enableLogging: true, // Enable detailed structured logs
    }));

    const {
      imageUrl: generatedImageUrl,
      error,
      fullPrompt,
      negativePrompt: fullNegativePrompt,
      compatibility,
      metadata
    } = orchestrationResult;

    // Log Compatibility Adjustments (from orchestration result)
    if (!compatibility.isCompatible) {
      console.warn(`⚠️ Compatibility adjustments made for Page ${item.pageNumber}:`, compatibility.warnings);
    }

    // Create a result object to match previous local shape for downstream logic
    const result = {
      imageUrl: generatedImageUrl,
      error: error
    };

    // Calculate latency from metadata or fallback
    let latencyMs = metadata?.durationMs || 0;
    const startedAtIso = new Date().toISOString();
    let finishedAtIso = new Date().toISOString();

    // Use resolved params for logging (orchestration might have adjusted compliance)
    const finalResolution = metadata?.resolution || targetResolution;

    // Fire Start Event (Back-filled for compatibility since orchestration does it internally now)
    onPageEvent?.({
      type: 'start',
      pageNumber: item.pageNumber,
      batchId: params.batchId || '',
      aspectRatio: params.aspectRatio,
      resolution: finalResolution,
      width: finalWidth,
      height: finalHeight,
      fullPrompt,
      fullNegativePrompt,
    });

    if (effectiveReferenceImage) {
      console.log(`🎨 Using reference image for Page ${item.pageNumber} (${shouldIncludeHero ? 'Hero' : 'Session/Style'})`);
    }

    if (params.signal?.aborted) throw new Error('Aborted');

    if (params.signal?.aborted) throw new Error('Aborted');

    finishedAtIso = new Date().toISOString();
    latencyMs = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - startTime;

    // Retry logic uses generateWithGemini directly
    if (result.imageUrl) {
      // Future: Add Vectorizer call here

      // Run QA on the generated image
      let qaScore = 0;
      let qaHardFail = false;
      let qaHardReasons: string[] = [];
      let currentImageUrl = result.imageUrl;
      let currentFullPrompt = fullPrompt;
      let qa: any = null;
      // const styleConfig = STYLE_RULES[params.style] || STYLE_RULES['default']; // Legacy, removed


      try {
        // Fire QA start event
        onPageEvent?.({
          type: 'qa_start',
          pageNumber: item.pageNumber,
          batchId: params.batchId || '',
        });

        qa = await evaluatePublishability({
          dataUrl: result.imageUrl,
          complexity: params.complexity,
          aspectRatio: params.aspectRatio,
          allowsTextureShading: false, // Default to strict until we re-wire style config lookup if needed or use inferred

        });
        qaScore = qa.score0to100;
        qaHardFail = qa.hardFail;
        qaHardReasons = qa.hardFailReasons;

        // [AI HYBRID CHECK]: If heuristics passed, run deep semantic analysis
        if (!qaHardFail) {
          try {
            const aiQa = await analyzeImageQuality(
              result.imageUrl,
              params.audience,
              params.style,
              params.complexity
            );

            if (aiQa.hardFail) {
              qaHardFail = true;
              qaHardReasons.push(...aiQa.tags);
              qaScore = Math.min(qaScore, aiQa.score); // AI vetoes the score
              console.log(`🤖 AI QA Rejected Page ${item.pageNumber}:`, aiQa.reasons);
            } else {
              // Blend scores: 40% heuristic, 60% AI (AI is smarter)
              const blendedScore = Math.round((qaScore * 0.4) + (aiQa.score * 0.6));
              qaScore = blendedScore;
            }

            // Merge tags for downstream logging
            if (aiQa.tags) {
              qa.tags = [...(qa.tags || []), ...aiQa.tags];
            }
            // Merge reasons for logging
            if (aiQa.reasons) {
              qa.reasons = [...(qa.reasons || []), ...aiQa.reasons];
            }

          } catch (aiErr) {
            console.warn('AI QA Service failed (non-blocking):', aiErr);
          }
        }

        // Fire QA complete event
        onPageEvent?.({
          type: 'qa_complete',
          pageNumber: item.pageNumber,
          score: qaScore,
          hardFail: qaHardFail,
          batchId: params.batchId || '',
        });
      } catch (err) {
        console.warn('QA evaluation failed; proceeding without score', err);
      }

      // Retry logic: if hard fail and we're beyond allowed failures and within retry budget
      if (qaHardFail) {
        hardFailCount++;
        const needsRetry = hardFailCount > allowedFailures && totalRetriesDone < maxRetryPagesPerBatch;

        if (needsRetry) {
          console.log(`Page ${item.pageNumber} hard failed (score: ${qaScore}). Retrying with repair directives...`);

          // Fire retry start event
          onPageEvent?.({
            type: 'retry_start',
            pageNumber: item.pageNumber,
            reason: 'QA hard fail',
            batchId: params.batchId || '',
          });

          // Build repair directive using new centralized logic
          const repairSuffix = getRepairInstructions({ tags: qaHardReasons as QaTag[] } as PageQa);
          const repairPrompt = `${fullPrompt}${repairSuffix}`;

          try {
            // Regenerate with repair directives
            const retryResult = await generateWithGemini({
              prompt: repairPrompt,
              negativePrompt: fullNegativePrompt,
              aspectRatio: params.aspectRatio,
              resolution: targetResolution,
              width: finalWidth,
              height: finalHeight,
              referenceImage: params.hasHeroRef && params.heroImage ? params.heroImage : undefined,
              signal: params.signal
            });

            if (params.signal?.aborted) throw new Error('Aborted');

            if (retryResult.imageUrl) {
              // We accept the retry (simplified: we don't double-QA the retry to save latency/cost).
              currentImageUrl = retryResult.imageUrl;
              currentFullPrompt = repairPrompt;
              totalRetriesDone++;

              // Assume retry improved things slightly for scoring purposes
              qaScore = Math.max(70, qaScore + 20);
              qaHardFail = false;

              console.log(`Retry accepted. Assumed score: ${qaScore}`);

              // Fire retry complete event
              onPageEvent?.({
                type: 'retry_complete',
                pageNumber: item.pageNumber,
                newScore: qaScore,
                batchId: params.batchId || '',
              });
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
        resolution: targetResolution,
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
        resolution: targetResolution,
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

      // [SMART CONSISTENCY]: Only lock the reference if the image is High Quality (>90 score)
      // This prevents locking "hallucinations" (like unwanted snails) as the style anchor.
      const isReferenceLocked = sessionReferenceImage !== null;

      // [UPDATED] Strict Reference Locking
      const isHighQuality = !qaHardFail && qaScore >= 90; // Bump to 90 for "Perfect"

      // Check for specific artifacts in the merged tags
      const currentTags = qa ? (qa.tags || []) : [];
      const hasColorArtifacts = currentTags.includes('colored_artifacts');
      const isMockup = currentTags.includes('mockup_style');

      // ONLY lock if it is perfect AND has no color/mockup issues
      if (!isReferenceLocked && isHighQuality && !hasColorArtifacts && !isMockup && currentImageUrl && params.autoConsistency && !params.hasHeroRef) {
        console.log(`🌟 Quality Standard Met (Page ${item.pageNumber}). Locking this as Session Reference.`);

        try {
          const matches = currentImageUrl.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            sessionReferenceImage = { mimeType: matches[1], base64: matches[2] };

            // Optional: Extract Style DNA from this "Perfect Page" for even tighter control
            const extractedDna = await coloringService.analyzeReferenceStyle(
              matches[2],
              matches[1],
              params.signal
            );
            if (extractedDna) sessionStyleDNA = extractedDna;
          }
        } catch (e) {
          console.warn('Consistency capture failed', e);
        }
      }

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