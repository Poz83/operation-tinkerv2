/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ColoringPage, PAGE_SIZES, VISUAL_STYLES, TARGET_AUDIENCES, CreativeVariation, CharacterDNA } from '../types';
import { processGeneration } from '../server/jobs/process-generation';
import { brainstormPrompt } from '../services/geminiService';
import { PageGenerationEvent } from '../logging/events';

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
            const enhanced = await brainstormPrompt(currentPrompt, pageCount, context);
            if (enhanced) {
                setUserPrompt(enhanced);
            }
        } catch (e) {
            console.error("Enhance failed", e);
            showToast('error', 'Failed to enhance prompt', '🪄');
        } finally {
            setIsEnhancing(false);
        }
    }, [validateApiKey, setUserPrompt, showToast]);

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
    }) => {
        if (!apiKey) return;

        // Reset previous controller
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsGenerating(true);
        setProgress(0);
        setPages([]);
        setCurrentSheetIndex(0);

        let completedTasks = 0;
        let totalTasks = 0;

        const updateProgress = () => {
            completedTasks++;
            const p = Math.round((completedTasks / totalTasks) * 100);
            setProgress(p);
        };

        try {
            const sizeConfig = PAGE_SIZES.find(s => s.id === params.pageSizeId);
            const aspectRatio = sizeConfig?.ratio || '1:1';
            const audienceLabel = TARGET_AUDIENCES.find(a => a.id === params.targetAudienceId)?.label || "General";

            let batchId: string | undefined;

            const handlePageEvent = async (event: PageGenerationEvent) => {
                switch (event.type) {
                    case 'start':
                        setPages(prev => prev.map(p =>
                            p.pageIndex === event.pageNumber - 1
                                ? { ...p, status: 'generating', statusMessage: 'Generating image...', startedAt: new Date() }
                                : p
                        ));
                        setActivePageNumber(event.pageNumber);
                        setGenerationPhase('generating');
                        break;
                    case 'success':
                        setPages(prev => prev.map(p =>
                            p.pageIndex === event.pageNumber - 1
                                ? {
                                    ...p,
                                    status: 'complete',
                                    completedAt: new Date(),
                                    qa: event.qa
                                }
                                : p
                        ));
                        break;
                    case 'error':
                        setPages(prev => prev.map(p =>
                            p.pageIndex === event.pageNumber - 1
                                ? { ...p, status: 'error', statusMessage: event.error }
                                : p
                        ));
                        break;
                    case 'cooldown_start':
                        setPages(prev => prev.map(p =>
                            p.pageIndex === event.pageNumber - 1
                                ? {
                                    ...p,
                                    status: 'cooldown',
                                    statusMessage: `Waiting ${Math.ceil(event.cooldownMs / 1000)}s before next page`,
                                    cooldownRemaining: Math.ceil(event.cooldownMs / 1000)
                                }
                                : p
                        ));
                        break;
                    case 'cooldown_progress':
                        setPages(prev => prev.map(p =>
                            p.pageIndex === event.pageNumber - 1
                                ? {
                                    ...p,
                                    cooldownRemaining: Math.ceil(event.remainingMs / 1000),
                                    statusMessage: `${Math.ceil(event.remainingMs / 1000)}s remaining...`
                                }
                                : p
                        ));
                        break;
                    case 'qa_start':
                        setPages(prev => prev.map(p =>
                            p.pageIndex === event.pageNumber - 1
                                ? { ...p, status: 'qa_checking', statusMessage: 'Running quality checks...' }
                                : p
                        ));
                        break;
                    case 'retry_start':
                        setPages(prev => prev.map(p =>
                            p.pageIndex === event.pageNumber - 1
                                ? { ...p, status: 'retrying', statusMessage: 'Quality issue detected, retrying...' }
                                : p
                        ));
                        break;
                    case 'retry_complete':
                        setPages(prev => prev.map(p =>
                            p.pageIndex === event.pageNumber - 1
                                ? { ...p, statusMessage: `Retry complete (score: ${event.newScore})` }
                                : p
                        ));
                        break;
                }
            };

            await processGeneration(
                {
                    batchId,
                    userIdea: params.userPrompt,
                    pageCount: params.pageAmount,
                    audience: audienceLabel,
                    style: params.visualStyle,
                    complexity: params.complexity,
                    hasHeroRef: params.hasHeroRef,
                    heroImage: (params.hasHeroRef && params.heroImage) ? params.heroImage : undefined,
                    aspectRatio: aspectRatio,
                    includeText: params.includeText,
                    creativeVariation: params.creativeVariation,
                    characterDNA: params.characterDNA || undefined,
                    autoConsistency: params.autoConsistency,
                    heroPresence: params.heroPresence,
                    cinematics: params.cinematics,
                    signal: controller.signal
                },
                // 1. On Plan Generated
                (plan) => {
                    let finalPlan = plan;
                    if (!finalPlan || finalPlan.length === 0) {
                        finalPlan = Array.from({ length: params.pageAmount }).map((_, i) => ({
                            pageNumber: i + 1,
                            prompt: `${params.userPrompt} (Scene ${i + 1})`,
                            vectorMode: 'standard',
                            complexityDescription: "Standard coloring book style",
                            requiresText: false
                        }));
                    }

                    const newPages: ColoringPage[] = [];
                    finalPlan.forEach((item) => {
                        newPages.push({
                            id: `page-${item.pageNumber}`,
                            prompt: item.prompt,
                            isLoading: true,
                            pageIndex: item.pageNumber - 1,
                            status: 'queued',
                            statusMessage: 'Queued'
                        });
                    });

                    setPages(newPages);
                    totalTasks = newPages.length;
                },
                // 2. On Page Complete
                (pageNumber, imageUrl) => {
                    setPages(prev => prev.map(p => p.pageIndex === pageNumber - 1 ? { ...p, imageUrl, isLoading: false } : p));
                    updateProgress();
                },
                // 3. Page Event
                (event) => {
                    handlePageEvent(event).catch((err) => console.error('Logging failed', err));
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
