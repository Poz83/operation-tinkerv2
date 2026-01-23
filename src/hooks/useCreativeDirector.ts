/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE CREATIVE DIRECTOR HOOK — React Integration
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import {
    planBook,
    quickPlan,
    getPromptsForGeneration,
    estimateBookCost,
    compareTiers,
    CreativeDirectorResult,
    GeneratedPrompt,
    QualityTier,
} from '../services/creativeDirectorService';
import { AudienceId, ComplexityId, StyleId } from '../server/ai/gemini-client';

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK STATE
// ═══════════════════════════════════════════════════════════════════════════════

export interface UseCreativeDirectorState {
    /** Full result from Creative Director */
    result: CreativeDirectorResult | null;
    /** Just the prompts for convenience */
    prompts: GeneratedPrompt[];
    /** Current phase */
    currentPhase: string;
    /** Current phase message */
    phaseMessage: string;
    /** Progress percentage */
    progress: number;
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
}

export interface UseCreativeDirectorReturn extends UseCreativeDirectorState {
    /** Create a book plan */
    createPlan: (
        concept: string,
        totalPages: number,
        options?: {
            audienceId?: AudienceId;
            complexityId?: ComplexityId;
            styleId?: StyleId;
            tier?: QualityTier;
        }
    ) => Promise<CreativeDirectorResult | null>;
    /** Quick plan with defaults */
    quickPlanBook: (concept: string, totalPages?: number) => Promise<CreativeDirectorResult | null>;
    /** Get prompts ready for image generation */
    getImagePrompts: () => { pageNumber: number; prompt: string; title: string }[];
    /** Estimate cost before generating */
    estimateCost: (tier: QualityTier, pageCount: number) => { tokens: number; estimatedDollars: number; tierName: string };
    /** Compare both tiers */
    compareTierCosts: (pageCount: number) => ReturnType<typeof compareTiers>;
    /** Reset state */
    reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

export const useCreativeDirector = (): UseCreativeDirectorReturn => {
    const [result, setResult] = useState<CreativeDirectorResult | null>(null);
    const [currentPhase, setCurrentPhase] = useState<string>('');
    const [phaseMessage, setPhaseMessage] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const createPlan = useCallback(async (
        concept: string,
        totalPages: number,
        options?: {
            audienceId?: AudienceId;
            complexityId?: ComplexityId;
            styleId?: StyleId;
            tier?: QualityTier;
        }
    ): Promise<CreativeDirectorResult | null> => {
        if (!concept.trim()) {
            setError('Please enter a book concept');
            return null;
        }

        setIsLoading(true);
        setError(null);
        setProgress(0);

        try {
            const planResult = await planBook({
                concept,
                totalPages,
                audienceId: options?.audienceId ?? 'adults',
                complexityId: options?.complexityId ?? 'Moderate',
                styleId: options?.styleId ?? 'Whimsical',
                tier: options?.tier ?? 'studio',
                onProgress: (phase, message, percent) => {
                    setCurrentPhase(phase);
                    setPhaseMessage(message);
                    setProgress(percent);
                },
            });

            if (planResult.success) {
                setResult(planResult);
            } else {
                setError(planResult.error || 'Failed to create book plan');
            }

            return planResult;
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const quickPlanBook = useCallback(async (
        concept: string,
        totalPages: number = 40
    ): Promise<CreativeDirectorResult | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const planResult = await quickPlan(concept, totalPages);
            if (planResult.success) {
                setResult(planResult);
            } else {
                setError(planResult.error || 'Failed to create book plan');
            }
            return planResult;
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getImagePrompts = useCallback(() => {
        if (!result) return [];
        return getPromptsForGeneration(result);
    }, [result]);

    const reset = useCallback(() => {
        setResult(null);
        setCurrentPhase('');
        setPhaseMessage('');
        setProgress(0);
        setError(null);
    }, []);

    return {
        result,
        prompts: result?.prompts || [],
        currentPhase,
        phaseMessage,
        progress,
        isLoading,
        error,
        createPlan,
        quickPlanBook,
        getImagePrompts,
        estimateCost: estimateBookCost,
        compareTierCosts: compareTiers,
        reset,
    };
};

export default useCreativeDirector;
