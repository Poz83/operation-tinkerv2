/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IDEA SERVICE v1.0 — Frontend Integration for Creative Services
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Frontend service layer for:
 * - IdeaExpander (10x brainstorming)
 * - EditSession (creative chat editing)
 * - SellableAudit (quality scoring)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { 
    expandIdeas, 
    quickExpand,
    ExpandIdeasRequest, 
    ExpandIdeasResult, 
    ExpandedIdea 
} from '../server/ai/IdeaExpander';

import { 
    createSession, 
    chat, 
    quickRefine,
    ChatRequest,
    ChatResponse,
    EditSessionState,
    EditMessage
} from '../server/ai/EditSession';

import { 
    runSellableAudit, 
    quickSellableCheck,
    SellableAuditResult 
} from '../server/ai/ArtEditor';

import { StyleId, ComplexityId, AudienceId } from '../server/ai/gemini-client';
import { getStoredApiKey } from '../lib/crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { 
    ExpandedIdea, 
    ExpandIdeasResult,
    EditSessionState,
    EditMessage,
    ChatResponse,
    SellableAuditResult 
};

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY HELPER
// ═══════════════════════════════════════════════════════════════════════════════

let cachedApiKey: string | null = null;

const getApiKey = async (): Promise<string> => {
    if (cachedApiKey) return cachedApiKey;

    // Use existing encrypted API key from localStorage
    const storedKey = await getStoredApiKey();
    if (storedKey) {
        cachedApiKey = storedKey;
        return storedKey;
    }

    throw new Error('No API key available. Please set your Gemini API key in Settings.');
};

// ═══════════════════════════════════════════════════════════════════════════════
// IDEA EXPANDER SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Expand a vague concept into multiple creative ideas
 */
export const brainstormIdeas = async (
    concept: string,
    options?: {
        count?: number;
        audienceId?: AudienceId;
        complexityId?: ComplexityId;
        signal?: AbortSignal;
    }
): Promise<ExpandIdeasResult> => {
    const apiKey = await getApiKey();
    
    return expandIdeas({
        concept,
        count: options?.count ?? 10,
        audienceId: options?.audienceId ?? 'adults',
        complexityId: options?.complexityId ?? 'Moderate',
        apiKey,
        signal: options?.signal,
    });
};

/**
 * Quick 5-idea expansion for previews
 */
export const quickBrainstorm = async (
    concept: string,
    audienceId: AudienceId = 'adults',
    complexityId: ComplexityId = 'Moderate'
): Promise<ExpandedIdea[]> => {
    const apiKey = await getApiKey();
    return quickExpand(concept, apiKey, audienceId, complexityId);
};

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT SESSION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Start a new creative edit session
 */
export const startEditSession = (
    originalPrompt: string,
    styleId: StyleId,
    complexityId: ComplexityId,
    audienceId: AudienceId,
    imageBase64?: string
): EditSessionState => {
    return createSession(originalPrompt, styleId, complexityId, audienceId, imageBase64);
};

/**
 * Send a message to refine the prompt
 */
export const sendEditMessage = async (
    message: string,
    session: EditSessionState,
    signal?: AbortSignal
): Promise<ChatResponse> => {
    const apiKey = await getApiKey();
    return chat({ message, session, apiKey, signal });
};

/**
 * Quick one-off refinement (no session tracking)
 */
export const refinePrompt = async (
    currentPrompt: string,
    userRequest: string,
    styleId: StyleId = 'Whimsical',
    complexityId: ComplexityId = 'Moderate',
    audienceId: AudienceId = 'adults'
): Promise<{ refinedPrompt: string; explanation: string }> => {
    const apiKey = await getApiKey();
    return quickRefine(currentPrompt, userRequest, apiKey, styleId, complexityId, audienceId);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SELLABLE AUDIT SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run a full sellable quality audit on an image
 */
export const auditImage = async (
    imageBase64: string,
    audienceId: AudienceId = 'adults',
    styleId: StyleId = 'Whimsical',
    signal?: AbortSignal
): Promise<SellableAuditResult> => {
    const apiKey = await getApiKey();
    return runSellableAudit(imageBase64, apiKey, audienceId, styleId, signal);
};

/**
 * Quick pass/fail check with score
 */
export const quickQualityCheck = async (
    imageBase64: string,
    minimumScore: number = 60
): Promise<{ passed: boolean; score: number; decision: string }> => {
    const apiKey = await getApiKey();
    return quickSellableCheck(imageBase64, apiKey, minimumScore);
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMBINED WORKFLOW: Brainstorm → Generate
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Full creative flow: brainstorm ideas, let user pick, then generate
 * This is a helper that combines multiple services
 */
export interface CreativeFlowState {
    concept: string;
    ideas: ExpandedIdea[];
    selectedIdea: ExpandedIdea | null;
    editSession: EditSessionState | null;
}

export const initCreativeFlow = async (
    concept: string,
    audienceId: AudienceId,
    complexityId: ComplexityId
): Promise<CreativeFlowState> => {
    const result = await brainstormIdeas(concept, { count: 10, audienceId, complexityId });
    
    return {
        concept,
        ideas: result.ideas,
        selectedIdea: null,
        editSession: null,
    };
};

export const selectIdea = (
    flow: CreativeFlowState,
    idea: ExpandedIdea,
    styleId: StyleId,
    complexityId: ComplexityId,
    audienceId: AudienceId
): CreativeFlowState => {
    return {
        ...flow,
        selectedIdea: idea,
        editSession: startEditSession(
            idea.visualDescription,
            styleId,
            complexityId,
            audienceId
        ),
    };
};
