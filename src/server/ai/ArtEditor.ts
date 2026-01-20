/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ART EDITOR v1.0 — Human-Like Image Review
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * A dedicated AI service that reviews generated images the way a human
 * illustrator would—thinking about scene logic, narrative coherence,
 * and audience appropriateness.
 *
 * Uses Gemini 2.0 Flash for fast, cost-effective reasoning.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_TEXT_MODEL, StyleId, AudienceId, ComplexityId } from './gemini-client';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EditorReview {
    /** Whether the image passes editorial review */
    approved: boolean;
    /** Confidence in the verdict (0-100) */
    confidence: number;
    /** First gut reaction to the image */
    firstImpression: string;
    /** List of issues found */
    issues: EditorIssue[];
    /** Things done well */
    praise: string[];
    /** Final verdict explanation */
    overallVerdict: string;
    /** Suggestions for improvement/regeneration */
    suggestions: string[];
    /** Internal leniency level used */
    leniencyUsed: 'strict' | 'moderate' | 'relaxed';
}

export interface EditorIssue {
    /** Description of the issue */
    description: string;
    /** How serious is this */
    severity: 'critical' | 'should-fix' | 'nitpick';
    /** Where in the image (optional) */
    location?: string;
    /** WHY this is an issue */
    reasoning: string;
    /** How to fix it (optional) */
    suggestedFix?: string;
    /** Issue code for repair system */
    issueCode?: string;
}

export interface EditorRequest {
    /** Base64 image data */
    imageBase64: string;
    /** Original user prompt */
    originalPrompt: string;
    /** Target audience */
    audienceId: AudienceId;
    /** Visual style */
    styleId: StyleId;
    /** Complexity level */
    complexityId: ComplexityId;
    /** API key */
    apiKey: string;
    /** Override leniency (optional, for advanced users) */
    leniencyOverride?: 'strict' | 'moderate' | 'relaxed';
    /** Abort signal */
    signal?: AbortSignal;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE ART EDITOR PERSONA
// ═══════════════════════════════════════════════════════════════════════════════

const ART_EDITOR_PERSONA = `
You are an experienced children's book and adult coloring book illustrator 
with 20 years of professional experience. You've worked with major publishers 
like Penguin Random House and know exactly what makes a coloring page successful.

Your job is to review this image and give honest, constructive feedback—
the way you would critique a junior artist's work before it goes to print.

Think like a human editor:
- What's your gut reaction when you first see this?
- Does the scene make sense?
- Is anything illogical or out of place?
- Would the target audience enjoy coloring this?
- Any amateur mistakes you see?

Be specific. Be helpful. Be human.
`;

// ═══════════════════════════════════════════════════════════════════════════════
// LENIENCY DECISION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Automatically determine how strict the editor should be
 * based on audience and style context.
 */
const decideLeniency = (
    audienceId: AudienceId,
    styleId: StyleId
): 'strict' | 'moderate' | 'relaxed' => {
    // Kids + whimsical styles = relaxed (allow more playfulness)
    if (['toddlers', 'preschool'].includes(audienceId)) {
        return 'relaxed';
    }

    if (audienceId === 'kids' && ['Kawaii', 'Whimsical', 'Cartoon'].includes(styleId)) {
        return 'relaxed';
    }

    // Adults + realistic styles = strict (expect logical coherence)
    if (audienceId === 'adults' && ['Realistic', 'Cozy', 'Botanical'].includes(styleId)) {
        return 'strict';
    }

    // Abstract styles have different rules
    if (['Mandala', 'Zentangle', 'Geometric'].includes(styleId)) {
        return 'moderate'; // Different logic applies
    }

    return 'moderate';
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIENCE-SPECIFIC GUIDANCE
// ═══════════════════════════════════════════════════════════════════════════════

const getAudienceGuidance = (audienceId: AudienceId): string => {
    switch (audienceId) {
        case 'toddlers':
        case 'preschool':
            return `
      AUDIENCE: Young children (${audienceId})
      - Objects CAN have faces and personalities (smiling cups, waving flowers) - this is EXPECTED and GOOD
      - Faces on characters can be very simple (dots for eyes, curved line for smile)
      - Fantasy/whimsy is encouraged
      - Only flag truly broken or scary elements
      `;
        case 'kids':
            return `
      AUDIENCE: Children (ages 6-12)
      - Some personification of objects is OK but not required
      - Characters should have clear, expressive faces
      - Adventure and fun are key
      - Allow some fantasy elements
      `;
        case 'teens':
            return `
      AUDIENCE: Teenagers
      - Expect more stylized but coherent designs
      - Faces should be intentional (stylized OK, blank NOT OK)
      - Scene logic should mostly make sense
      `;
        case 'adults':
            return `
      AUDIENCE: Adults
      - Expect LOGICAL scene composition
      - Human figures need visible facial features (can be simple but not blank)
      - Objects should make sense - if couple holds cups, no extra cups should appear randomly
      - Physical logic matters (fire inside fireplace, water in cups)
      `;
        case 'seniors':
            return `
      AUDIENCE: Seniors
      - Clarity is paramount
      - Logical composition expected
      - Nostalgic/classic themes preferred
      - Avoid tiny confusing details
      `;
        default:
            return '';
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD EDITOR PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

const buildEditorPrompt = (
    originalPrompt: string,
    audienceId: AudienceId,
    styleId: StyleId,
    complexityId: ComplexityId,
    leniency: 'strict' | 'moderate' | 'relaxed'
): string => {
    const audienceGuidance = getAudienceGuidance(audienceId);

    const leniencyGuidance = {
        strict: 'Be thorough and critical. Flag anything that seems off.',
        moderate: 'Balance between helpful criticism and recognizing creative choices.',
        relaxed: 'Focus only on clear errors. Allow creative freedom and whimsy.',
    }[leniency];

    return `
${ART_EDITOR_PERSONA}

═══════════════════════════════════════════════════════════════════════════════
THE BRIEF
═══════════════════════════════════════════════════════════════════════════════

Client requested: "${originalPrompt}"
Target audience: ${audienceId}
Visual style: ${styleId}
Complexity: ${complexityId}

${audienceGuidance}

REVIEW APPROACH: ${leniencyGuidance}

═══════════════════════════════════════════════════════════════════════════════
YOUR REVIEW
═══════════════════════════════════════════════════════════════════════════════

Look at this coloring page and review it as a professional illustrator:

1. FIRST IMPRESSION
   What's your gut reaction? Does it look right?

2. CHARACTER COUNT & IDENTITY
   - Does the prompt imply specific characters? ("couple" = 2 people, "family" = 3+)
   - Are the right number of characters shown?
   - Do human figures have appropriate faces for the audience?
     (${audienceId === 'adults' ? 'Blank/missing faces = ERROR' : 'Simple happy faces = FINE'})

3. OBJECT LOGIC
   - Count held objects vs environmental objects
   - If characters HOLD items (cups, books, etc.), are duplicates also scattered around?
   - For ${audienceId}: ${['toddlers', 'preschool', 'kids'].includes(audienceId)
            ? 'Objects with faces = OK, they are characters too!'
            : 'Extra duplicate objects = LIKELY AN ERROR'}

4. SPATIAL/PHYSICS LOGIC
   - Fire contained in fireplace?
   - Water contained in cups/vessels?
   - Objects resting properly (not floating)?
   - Elements staying within their logical boundaries?

5. STYLE COHERENCE
   - Does it match the ${styleId} style?
   - Appropriate complexity for ${complexityId}?

6. OVERALL VERDICT
   Would you sign off on this for print?

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

{
  "approved": true/false,
  "confidence": 0-100,
  "firstImpression": "Your gut reaction in one sentence",
  "issues": [
    {
      "description": "What's wrong",
      "severity": "critical|should-fix|nitpick",
      "location": "Where in image (optional)",
      "reasoning": "WHY this matters for ${audienceId} audience",
      "suggestedFix": "How to fix (optional)",
      "issueCode": "REDUNDANT_OBJECTS|SPATIAL_VIOLATION|CHARACTER_COUNT_MISMATCH|FACELESS_HUMAN|etc"
    }
  ],
  "praise": ["Things done well - be specific"],
  "overallVerdict": "Your final judgment",
  "suggestions": ["Specific improvements if regenerating"]
}

IMPORTANT: 
- Be HUMAN in your assessment. Think "does this make sense as a scene?"
- For ${audienceId} audience, remember: ${['toddlers', 'preschool', 'kids'].includes(audienceId)
            ? 'whimsy and personification are EXPECTED'
            : 'logical coherence is EXPECTED'}
`.trim();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN REVIEW FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Review an image as a human editor would.
 * Returns detailed feedback on what works, what doesn't, and why.
 */
export const reviewAsEditor = async (
    request: EditorRequest
): Promise<EditorReview> => {
    const {
        imageBase64,
        originalPrompt,
        audienceId,
        styleId,
        complexityId,
        apiKey,
        leniencyOverride,
        signal,
    } = request;

    // Check abort
    if (signal?.aborted) {
        throw new Error('Aborted');
    }

    // Determine leniency
    const leniency = leniencyOverride || decideLeniency(audienceId, styleId);

    // Build prompt
    const editorPrompt = buildEditorPrompt(
        originalPrompt,
        audienceId,
        styleId,
        complexityId,
        leniency
    );

    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: {
                parts: [
                    { text: editorPrompt },
                    {
                        inlineData: {
                            data: imageBase64,
                            mimeType: 'image/png',
                        },
                    },
                ],
            },
            config: {
                responseMimeType: 'application/json',
                temperature: 0.3, // Consistent but thoughtful
            },
        });

        if (signal?.aborted) {
            throw new Error('Aborted');
        }

        // Parse response
        const reviewText = response.text || '{}';
        let review: Partial<EditorReview>;

        try {
            review = JSON.parse(reviewText);
        } catch (parseError) {
            console.error('Failed to parse Editor response:', reviewText);
            // Return a safe default
            return createFallbackReview('Failed to parse editor response');
        }

        // Add the leniency used
        return {
            approved: review.approved ?? true,
            confidence: review.confidence ?? 50,
            firstImpression: review.firstImpression || 'Unable to analyze',
            issues: review.issues || [],
            praise: review.praise || [],
            overallVerdict: review.overallVerdict || 'Review incomplete',
            suggestions: review.suggestions || [],
            leniencyUsed: leniency,
        };

    } catch (error: any) {
        if (error.message === 'Aborted') {
            throw error;
        }

        console.error('Art Editor review failed:', error.message);
        return createFallbackReview(error.message);
    }
};

/**
 * Create a fallback review when the editor fails
 */
const createFallbackReview = (reason: string): EditorReview => ({
    approved: true, // Don't block on editor failure
    confidence: 0,
    firstImpression: 'Editor review unavailable',
    issues: [],
    praise: [],
    overallVerdict: `Editor review could not be completed: ${reason}`,
    suggestions: [],
    leniencyUsed: 'moderate',
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE: Quick Check
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick check that returns just pass/fail without full details.
 * Use for fast validation when you don't need explanations.
 */
export const quickCheck = async (
    request: EditorRequest
): Promise<{ passed: boolean; criticalIssueCount: number }> => {
    const review = await reviewAsEditor(request);
    const criticalIssueCount = review.issues.filter(i => i.severity === 'critical').length;

    return {
        passed: review.approved && criticalIssueCount === 0,
        criticalIssueCount,
    };
};
