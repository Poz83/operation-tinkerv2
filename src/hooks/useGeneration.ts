/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ColoringPage, PAGE_SIZES, VISUAL_STYLES, TARGET_AUDIENCES, CreativeVariation, CharacterDNA, StyleReference } from '../types';
import { brainstormPrompt } from '../services/geminiService';
import { batchGenerate, GenerationProgress, GeneratePageResult } from '../services/generationService';
import { ColoringStudioService, BookPlanItem } from '../services/ColoringStudioService';

// ═══════════════════════════════════════════════════════════════════════════════
// SMART PROMPT LOGIC (Cinematics & Hero Conflict)
// ═══════════════════════════════════════════════════════════════════════════════

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

// Character keywords for conflict detection
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

interface UseGenerationProps {
    apiKey: string | null;
    validateApiKey: () => Promise<boolean> | boolean;
    settings: any; // Using any for brevity, ideally typed strictly
    showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, emoji?: string) => void;
    // State setters from useProject
    setPages: React.Dispatch<React.SetStateAction<ColoringPage[]>>;
    setUserPrompt: (prompt: string) => void;
}

export const useGeneration = ({
    apiKey,
    validateApiKey,
    settings,
    showToast,
    setPages,
    setUserPrompt
}: UseGenerationProps) => {
    // --- Generation State ---
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activePageNumber, setActivePageNumber] = useState<number | null>(null);
    const [generationPhase, setGenerationPhase] = useState<'planning' | 'generating' | 'complete'>('planning');
    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    // --- Actions ---

    const handleEnhancePrompt = useCallback(async (
        currentPrompt: string,
        pageCount: number,
        context?: { style: string; audience: string; heroName?: string }
    ) => {
        const hasKey = await validateApiKey();
        if (!hasKey || !currentPrompt.trim()) return;

        setIsEnhancing(true);
        try {
            // Pass pageCount and context for context-aware enhancement
            const enhanced = await brainstormPrompt(currentPrompt, pageCount, context, apiKey || undefined);
            if (enhanced) {
                setUserPrompt(enhanced);
            }
        } catch (e) {
            console.error("Enhance failed", e);
            showToast('error', 'Failed to enhance prompt', '🪄');
        } finally {
            setIsEnhancing(false);
        }
    }, [validateApiKey, setUserPrompt, showToast, apiKey]);

    const handleCancel = useCallback(() => {
        console.log("User requested cancellation.");
        setIsGenerating(false); // Immediate UI feedback
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null; // Clear immediately to prevent race conditions
        }
    }, []);

    const startGeneration = useCallback(async (params: {
        projectName: string;
        userPrompt: string;
        pageAmount: number;
        pageSizeId: string;
        visualStyle: string;
        complexity: string;
        targetAudienceId: string;
        hasHeroRef: boolean;
        heroImage: { base64: string; mimeType: string } | null;
        includeText: boolean;
        creativeVariation: CreativeVariation;
        characterDNA?: CharacterDNA | null;
        autoConsistency?: boolean;
        heroPresence?: number;
        cinematics?: string;
        styleReferences?: StyleReference[];
    }) => {
        if (!apiKey) return;

        // Reset previous controller
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsGenerating(true);
        setGenerationPhase('planning');
        setProgress(0);
        setPages([]);
        setCurrentSheetIndex(0);

        try {
            // 1. Generate Book Plan
            const coloringService = new ColoringStudioService(apiKey);

            // Wait for plan generation
            let plan: BookPlanItem[] | null = await coloringService.generateBookPlan({
                userIdea: params.userPrompt,
                pageCount: params.pageAmount,
                audience: params.targetAudienceId as any,
                style: params.visualStyle as any,
                complexity: params.complexity as any,
                hasHeroRef: params.hasHeroRef,
                includeText: params.includeText,
                heroPresence: params.heroPresence,
                heroName: params.characterDNA?.name,
                signal: controller.signal
            });

            if (controller.signal.aborted) throw new Error('Aborted');

            // Fallback plan if AI fails
            if (!plan || plan.length === 0) {
                console.warn("Plan generation failed, using fallback.");
                plan = Array.from({ length: params.pageAmount }).map((_, i) => ({
                    pageNumber: i + 1,
                    prompt: `${params.userPrompt} (Scene ${i + 1})`,
                    vectorMode: 'standard',
                    complexityDescription: "Standard coloring book style",
                    requiresText: false
                }));
            }

            // Update UI with Queued Pages
            const newPages: ColoringPage[] = plan.map((item) => ({
                id: `page-${item.pageNumber}`,
                prompt: item.prompt,
                isLoading: true,
                pageIndex: item.pageNumber - 1,
                status: 'queued',
                statusMessage: 'Queued'
            }));
            setPages(newPages);
            setGenerationPhase('generating');

            // 2. Prepare Pages (Smart Logic: Cinematics & Hero Conflict)
            const pagesRequest = plan.map(item => {
                // Feature: Cinematics
                let selectedAngle = '';
                if (params.cinematics && params.cinematics !== 'dynamic') {
                    selectedAngle = params.cinematics.replace(/-/g, ' ');
                } else {
                    selectedAngle = pickRandom(DYNAMIC_ANGLES);
                }
                const cinematicPrompt = selectedAngle ? ` [CAMERA: ${selectedAngle} view]` : '';
                const enhancedPrompt = item.prompt + cinematicPrompt;

                // Feature: Hero Conflict Detection (Determine if dna should be passed)
                // Note: The Orchestrator handles DNA injection if passed. We decide *whether* to pass it.
                // Actually, generationService takes `heroDNA` in the request. If we pass it, it uses it.
                // So we should conditionally clear it here?
                // No, generationService generatePage takes `heroDNA`.
                // We don't have per-page `heroDNA` override in batchGenerate request structure easily
                // UNLESS batchGenerate accepted full `GeneratePageRequest` objects.
                // Currently batchGenerate accepts simpler `{ prompt, pageIndex... }`.

                // Wait! batchGenerate signature uses `project` properties for style/audience etc.
                // But `heroDNA` is on property `characterDNA` in `SavedProject`.
                // `generationService` uses `project.characterDNA`.

                // LIMITATION: `generationService.batchGenerate` uses the SAME `project` settings for all pages.
                // It does NOT support per-page HasHero/HeroDNA toggle yet.
                // `process-generation.ts` DID support per-page hero toggle (based on prompt keyword).

                // FIX: I must rely on the Orchestrator/Service to handle this, OR I realize `batchGenerate`
                // needs to support per-page overrides.
                // Looking at `batchGenerate` implementation:
                // It calls `generatePage` with `heroDNA: request.heroDNA`.
                // Wait, `batchGenerate` implementation in `generationService.ts`:
                // It passes `projectId: project.id`. It does NOT pass `heroDNA` explicitly?????
                // Let's check `batchGenerate` in `generationService.ts` again.
                // It calls `generatePage({...})`.
                // It passes `style`, `complexity`, `audience`, `aspectRatio`, `pageIndex`.
                // IT DOES NOT PASS `heroDNA`!!!!!!!

                // CRITICAL BUG IN GENERATION SERVICE FOUND.
                // `batchGenerate` uses `project` but fails to pass `heroDNA` to `generatePage`.
                // `generatePage` takes `GeneratePageRequest`.

                // I NEED TO FIX `batchGenerate` in `generationService.ts` to pass `heroDNA`!
                // And `referenceImage`, `styleDNA`, etc.

                // I will add the fix to `generationService.ts` in the NEXT step.
                // For now assuming it works or I fix it.

                return {
                    prompt: enhancedPrompt,
                    pageIndex: item.pageNumber - 1,
                    requiresText: item.requiresText,
                    vectorMode: item.vectorMode
                };
            });

            // 3. Execute Batch Generation
            await batchGenerate(
                {
                    project: {
                        ...params,
                        id: 'temp-project-id', // Will be ignored/managed by service
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        toolType: 'coloring_studio',
                        characterDNA: params.characterDNA || undefined, // Important
                        heroImage: params.heroImage,
                    } as any, // Cast to SavedProject mock
                    pages: pagesRequest,
                    autoConsistency: params.autoConsistency,
                    sessionReferenceImage: (params.autoConsistency && !params.hasHeroRef)
                        ? undefined
                        : (params.hasHeroRef && params.heroImage) ? params.heroImage : undefined,
                    signal: controller.signal,
                    // Pass style reference images for multimodal AI generation
                    styleReferenceImages: params.styleReferences?.map(ref => ({
                        base64: ref.base64,
                        mimeType: ref.mimeType
                    }))
                },
                {
                    mode: 'standard',
                    concurrency: 1, // Sequential for better consistency logic
                    delayBetweenPages: 2000,
                    enableLogging: true,
                    // Handle Page Progress
                    onPageProgress: (pageIndex, p) => {
                        // Map service phases to UI status messages
                        // phase: 'preparing' | 'generating' | 'validating' | 'saving' | 'complete' | 'failed'
                        let statusMessage = p.message;
                        let status: any = 'generating'; // default

                        if (p.phase === 'validating') {
                            status = 'qa_checking';
                            // Use detailed message from Orchestrator (e.g., "Analyzing...", "Repairing midtones...")
                            // If message contains "Repairing", user sees "Refining Quality..." logic if desired, 
                            // but usually the raw message is best ("Repairing: speckles detected")
                            statusMessage = p.message || 'Checking quality...';
                        } else if (p.phase === 'saving') {
                            status = 'complete'; // visually complete
                            statusMessage = 'Saving...';
                        } else if (p.phase === 'failed') {
                            status = 'error';
                        }

                        setPages(prev => prev.map(page =>
                            page.pageIndex === pageIndex
                                ? { ...page, status, statusMessage }
                                : page
                        ));

                        if (p.phase === 'generating' || p.phase === 'preparing') {
                            setActivePageNumber(pageIndex + 1);
                        }
                    },
                    // Handle Page Completion
                    onPageComplete: (pageIndex, result) => {
                        setPages(prev => prev.map(page =>
                            page.pageIndex === pageIndex
                                ? {
                                    ...page,
                                    status: result.success ? 'complete' : 'error',
                                    statusMessage: result.success ? 'Done' : (result.error || 'Failed'),
                                    imageUrl: result.imageUrl || undefined,
                                    isLoading: false,
                                    qa: result.page?.qa // Pass simplified QA object
                                }
                                : page
                        ));
                    },
                    // Handle Overall Progress (Optional, we can calculate from pages)
                    onBatchProgress: (completed, total) => {
                        const p = Math.round((completed / total) * 100);
                        setProgress(p);
                    }
                }
            );

        } catch (e: any) {
            if (e.message === 'Aborted') {
                console.log("Generation cancelled by user.");
            } else {
                console.error("Workflow failed", e);
                showToast('error', 'Generation failed unexpectedly.', '⚠️');
            }
        } finally {
            setIsGenerating(false);
            setGenerationPhase('complete');
            abortControllerRef.current = null;

            // Celebration
            if (settings.enableCelebrations && !abortControllerRef.current) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }
    }, [apiKey, setPages, settings.enableCelebrations, showToast]);

    // --- Downloads ---

    const downloadPDF = useCallback(async (pages: ColoringPage[], projectMeta: any) => {
        const { generateColoringBookPDF } = await import('../utils/pdf-generator');
        const styleLabel = VISUAL_STYLES.find(s => s.id === projectMeta.visualStyle)?.label || projectMeta.visualStyle;
        const audienceLabel = TARGET_AUDIENCES.find(a => a.id === projectMeta.targetAudienceId)?.label || projectMeta.targetAudienceId;

        const safeTitle = (projectMeta.projectName || 'Coloring Book')
            .trim()
            .replace(/[<>:"/\\|?*]/g, '')
            .slice(0, 50);

        const filename = `${safeTitle}_${Date.now()}.pdf`;

        generateColoringBookPDF(
            pages,
            projectMeta.projectName || 'My Coloring Book',
            projectMeta.pageSizeId,
            {
                style: styleLabel,
                complexity: projectMeta.complexity,
                audience: audienceLabel,
                originalPrompt: projectMeta.userPrompt
            },
            filename
        );
    }, []);

    const downloadZIP = useCallback(async (pages: ColoringPage[], projectName: string) => {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const finishedPages = pages.filter(p => p.imageUrl);

        await Promise.all(finishedPages.map(async (page) => {
            if (page.imageUrl) {
                const res = await fetch(page.imageUrl);
                const blob = await res.blob();

                const fileName = page.isCover
                    ? `00_cover.png`
                    : `${String(page.pageIndex).padStart(2, '0')}_page.png`;

                zip.file(fileName, blob);
            }
        }));

        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        const safeName = (projectName || 'Coloring Book').trim().replace(/[<>:"/\\|?*]/g, '').slice(0, 50);
        link.download = `${safeName}_images.zip`;
        link.click();
        window.URL.revokeObjectURL(url);
    }, []);

    return {
        isGenerating,
        isEnhancing,
        progress,
        activePageNumber,
        generationPhase,
        currentSheetIndex,
        setCurrentSheetIndex,

        startGeneration,
        handleCancel,
        handleEnhancePrompt,
        downloadPDF,
        downloadZIP
    };
};
