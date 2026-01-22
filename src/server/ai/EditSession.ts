/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EDIT SESSION v1.0 — "Creative Partner Chat"
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Enable back-and-forth creative editing of generated coloring pages.
 * Users can say "make it more whimsical" or "fix the hands" and get refinements.
 *
 * ARCHITECTURE:
 * - Stateful session tracking (history of edits)
 * - Uses Gemini 2.0 Flash for understanding intent
 * - Generates new prompts based on user feedback
 * - Preserves style consistency via reference images
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { GoogleGenAI } from '@google/genai';
import { Logger } from '../../lib/logger';
import { GEMINI_FLASH_MODEL, StyleId, ComplexityId, AudienceId } from './gemini-client';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EditMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface EditSessionState {
    /** Unique session ID */
    sessionId: string;
    /** Original prompt that created the image */
    originalPrompt: string;
    /** Current refined prompt */
    currentPrompt: string;
    /** Style settings */
    styleId: StyleId;
    complexityId: ComplexityId;
    audienceId: AudienceId;
    /** Conversation history */
    history: EditMessage[];
    /** Base64 of current image (for reference) */
    currentImageBase64?: string;
    /** Number of refinements made */
    refinementCount: number;
    /** When session was created */
    createdAt: number;
}

export interface ChatRequest {
    /** User's edit request (e.g., "make it cuter", "add more flowers") */
    message: string;
    /** Current session state */
    session: EditSessionState;
    /** API key */
    apiKey: string;
    /** Abort signal */
    signal?: AbortSignal;
}

export interface ChatResponse {
    success: boolean;
    /** Updated prompt to regenerate with */
    refinedPrompt: string;
    /** Explanation of changes made */
    explanation: string;
    /** Updated session state */
    session: EditSessionState;
    /** Error if failed */
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT - CREATIVE PARTNER
// ═══════════════════════════════════════════════════════════════════════════════

const CREATIVE_PARTNER_PROMPT = `
You are a creative coloring book art director having a conversation with a client about their coloring page.

═══════════════════════════════════════════════════════════════════════════════
YOUR ROLE
═══════════════════════════════════════════════════════════════════════════════

1. UNDERSTAND the user's feedback about the current image
2. TRANSLATE their request into concrete visual changes
3. REFINE the prompt to address their concerns while preserving what works
4. EXPLAIN what you're changing and why

═══════════════════════════════════════════════════════════════════════════════
COMMON EDIT REQUESTS & TRANSLATIONS
═══════════════════════════════════════════════════════════════════════════════

"Make it cuter" → Add Kawaii elements: larger eyes, rounder shapes, friendly expression
"More detail" → Increase pattern density, add decorative elements, more intricate borders
"Simpler" → Reduce complexity, larger shapes, fewer overlapping elements
"More whimsical" → Add fantasy elements, playful proportions, dreamy atmosphere
"Fix the hands/face" → Specify correct anatomy, clearer appendages, proper proportions
"Different pose" → Describe new body position, action, or gesture
"Add background" → Include environmental elements, scenery, context
"Less cluttered" → More negative space, fewer elements, clearer focal point

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON:
{
  "refinedPrompt": "The complete updated prompt incorporating the user's feedback",
  "explanation": "Brief explanation of what changes were made (1-2 sentences)"
}

CRITICAL: 
- Keep the core subject and theme intact
- Only modify what the user asked to change
- Preserve style, complexity, and audience settings
- Return ONLY JSON, no markdown
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new edit session for a generated image
 */
export const createSession = (
    originalPrompt: string,
    styleId: StyleId,
    complexityId: ComplexityId,
    audienceId: AudienceId,
    imageBase64?: string
): EditSessionState => {
    return {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        originalPrompt,
        currentPrompt: originalPrompt,
        styleId,
        complexityId,
        audienceId,
        history: [],
        currentImageBase64: imageBase64,
        refinementCount: 0,
        createdAt: Date.now(),
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CHAT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Process a user's edit request and generate a refined prompt
 */
export const chat = async (request: ChatRequest): Promise<ChatResponse> => {
    const { message, session, apiKey, signal } = request;

    if (signal?.aborted) {
        throw new Error('Aborted');
    }

    // Build conversation context
    const historyContext = session.history
        .slice(-6) // Last 6 messages for context
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

    const userMessage = `
CURRENT PROMPT: ${session.currentPrompt}

STYLE: ${session.styleId}
COMPLEXITY: ${session.complexityId}
AUDIENCE: ${session.audienceId}

${historyContext ? `CONVERSATION HISTORY:\n${historyContext}\n` : ''}

USER REQUEST: ${message}

Refine the prompt based on this feedback:
`.trim();

    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: GEMINI_FLASH_MODEL,
            contents: userMessage,
            config: {
                systemInstruction: CREATIVE_PARTNER_PROMPT,
                temperature: 0.7,
                maxOutputTokens: 500,
            } as any,
        });

        if (signal?.aborted) {
            throw new Error('Aborted');
        }

        const rawText = response.text?.trim() || '{}';

        // Parse response
        let refinedPrompt = session.currentPrompt;
        let explanation = 'Made adjustments based on your feedback.';

        try {
            let jsonText = rawText;
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            const parsed = JSON.parse(jsonText);
            refinedPrompt = parsed.refinedPrompt || session.currentPrompt;
            explanation = parsed.explanation || explanation;

        } catch (parseError) {
            Logger.warn('AI', 'Failed to parse chat response, using raw text');
            // Fallback: use raw text as the refined prompt if it looks like a prompt
            if (rawText.length > 20 && !rawText.includes('{')) {
                refinedPrompt = rawText;
            }
        }

        // Update session state
        const updatedSession: EditSessionState = {
            ...session,
            currentPrompt: refinedPrompt,
            history: [
                ...session.history,
                { role: 'user', content: message, timestamp: Date.now() },
                { role: 'assistant', content: explanation, timestamp: Date.now() + 1 },
            ],
            refinementCount: session.refinementCount + 1,
        };

        Logger.info('AI', `Chat refinement #${updatedSession.refinementCount}: "${message.substring(0, 50)}..."`);

        return {
            success: true,
            refinedPrompt,
            explanation,
            session: updatedSession,
        };

    } catch (error: any) {
        if (error.message === 'Aborted') {
            throw error;
        }

        Logger.error('AI', 'Chat refinement failed', { error: error.message });

        return {
            success: false,
            refinedPrompt: session.currentPrompt,
            explanation: 'Failed to process request',
            session,
            error: error.message,
        };
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick single refinement (no session tracking)
 */
export const quickRefine = async (
    currentPrompt: string,
    userRequest: string,
    apiKey: string,
    styleId: StyleId = 'Whimsical',
    complexityId: ComplexityId = 'Moderate',
    audienceId: AudienceId = 'adults'
): Promise<{ refinedPrompt: string; explanation: string }> => {

    const session = createSession(currentPrompt, styleId, complexityId, audienceId);
    const result = await chat({ message: userRequest, session, apiKey });

    return {
        refinedPrompt: result.refinedPrompt,
        explanation: result.explanation,
    };
};

/**
 * Get session summary for debugging
 */
export const getSessionSummary = (session: EditSessionState): string => {
    return `Session ${session.sessionId}: ${session.refinementCount} refinements, ${session.history.length} messages`;
};
