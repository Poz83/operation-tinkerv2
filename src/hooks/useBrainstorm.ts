/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE BRAINSTORM HOOK — 10x Idea Generation for React
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { 
    brainstormIdeas, 
    ExpandedIdea, 
    ExpandIdeasResult 
} from '../services/ideaService';
import { AudienceId, ComplexityId } from '../server/ai/gemini-client';

export interface UseBrainstormState {
    /** Generated ideas */
    ideas: ExpandedIdea[];
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** Last generation time in ms */
    lastDurationMs: number | null;
}

export interface UseBrainstormReturn extends UseBrainstormState {
    /** Generate ideas from a concept */
    brainstorm: (concept: string, count?: number) => Promise<void>;
    /** Select an idea (returns the selected idea) */
    selectIdea: (index: number) => ExpandedIdea | null;
    /** Clear all ideas */
    clear: () => void;
    /** Regenerate with same concept */
    regenerate: () => Promise<void>;
}

export const useBrainstorm = (
    defaultAudience: AudienceId = 'adults',
    defaultComplexity: ComplexityId = 'Moderate'
): UseBrainstormReturn => {
    const [ideas, setIdeas] = useState<ExpandedIdea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
    const [lastConcept, setLastConcept] = useState<string>('');
    const [lastCount, setLastCount] = useState<number>(10);

    const brainstorm = useCallback(async (
        concept: string,
        count: number = 10
    ): Promise<void> => {
        if (!concept.trim()) {
            setError('Please enter a concept to brainstorm');
            return;
        }

        setIsLoading(true);
        setError(null);
        setLastConcept(concept);
        setLastCount(count);

        try {
            const result: ExpandIdeasResult = await brainstormIdeas(concept, {
                count,
                audienceId: defaultAudience,
                complexityId: defaultComplexity,
            });

            if (result.success) {
                setIdeas(result.ideas);
                setLastDurationMs(result.durationMs);
            } else {
                setError(result.error || 'Failed to generate ideas');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [defaultAudience, defaultComplexity]);

    const selectIdea = useCallback((index: number): ExpandedIdea | null => {
        if (index >= 0 && index < ideas.length) {
            return ideas[index];
        }
        return null;
    }, [ideas]);

    const clear = useCallback(() => {
        setIdeas([]);
        setError(null);
        setLastDurationMs(null);
    }, []);

    const regenerate = useCallback(async (): Promise<void> => {
        if (lastConcept) {
            await brainstorm(lastConcept, lastCount);
        }
    }, [lastConcept, lastCount, brainstorm]);

    return {
        ideas,
        isLoading,
        error,
        lastDurationMs,
        brainstorm,
        selectIdea,
        clear,
        regenerate,
    };
};

export default useBrainstorm;
