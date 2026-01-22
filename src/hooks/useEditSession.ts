/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE EDIT SESSION HOOK — Creative Chat for React
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { 
    startEditSession, 
    sendEditMessage,
    EditSessionState, 
    ChatResponse 
} from '../services/ideaService';
import { StyleId, ComplexityId, AudienceId } from '../server/ai/gemini-client';

export interface UseEditSessionReturn {
    /** Current session state */
    session: EditSessionState | null;
    /** Current refined prompt (latest) */
    currentPrompt: string;
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** Number of refinements made */
    refinementCount: number;
    /** Start a new session */
    startSession: (
        originalPrompt: string,
        styleId: StyleId,
        complexityId: ComplexityId,
        audienceId: AudienceId,
        imageBase64?: string
    ) => void;
    /** Send an edit request */
    sendMessage: (message: string) => Promise<ChatResponse | null>;
    /** Reset session */
    reset: () => void;
}

export const useEditSession = (): UseEditSessionReturn => {
    const [session, setSession] = useState<EditSessionState | null>(null);
    const [currentPrompt, setCurrentPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startSession = useCallback((
        originalPrompt: string,
        styleId: StyleId,
        complexityId: ComplexityId,
        audienceId: AudienceId,
        imageBase64?: string
    ) => {
        const newSession = startEditSession(
            originalPrompt,
            styleId,
            complexityId,
            audienceId,
            imageBase64
        );
        setSession(newSession);
        setCurrentPrompt(originalPrompt);
        setError(null);
    }, []);

    const sendMessage = useCallback(async (message: string): Promise<ChatResponse | null> => {
        if (!session) {
            setError('No active session. Start a session first.');
            return null;
        }

        if (!message.trim()) {
            setError('Please enter a message');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await sendEditMessage(message, session);

            if (response.success) {
                setSession(response.session);
                setCurrentPrompt(response.refinedPrompt);
            } else {
                setError(response.error || 'Failed to refine prompt');
            }

            return response;
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    const reset = useCallback(() => {
        setSession(null);
        setCurrentPrompt('');
        setError(null);
    }, []);

    return {
        session,
        currentPrompt,
        isLoading,
        error,
        refinementCount: session?.refinementCount || 0,
        startSession,
        sendMessage,
        reset,
    };
};

export default useEditSession;
