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

5. SCENE CONTEXT (NEW - Critical for coherence!)
   - Identify the SETTING from the prompt (indoor/outdoor, beach/forest/room, etc.)
   - Do ALL objects belong in this setting?
   - Indoor items (cats in baskets, candles, mugs, books, furniture) appearing in outdoor scenes = ERROR
   - Beach scenes should NOT have cozy indoor props scattered around
   - Objects should match the environment described, not the "style vibes"
   - If Cozy style on a beach: apply WARM FEELING, but NOT indoor objects

6. STYLE COHERENCE
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

// ═══════════════════════════════════════════════════════════════════════════════
// SELLABLE AUDIT — Professional Quality Gate
// Based on: what-makes-a-sellable-coloring-page.md
// ═══════════════════════════════════════════════════════════════════════════════

export interface SellableAuditResult {
    /** Overall score 0-100 (based on rubric) */
    score: number;
    /** Publish decision */
    decision: 'reject' | 'minimum' | 'strong' | 'premium';
    /** Breakdown by category */
    breakdown: {
        printCleanliness: number;    // Out of 30
        colorability: number;        // Out of 20
        composition: number;         // Out of 20
        audienceAlignment: number;   // Out of 15
        seriesConsistency: number;   // Out of 15
    };
    /** Pass/fail checklist results */
    passFailChecklist: {
        lineQuality: boolean;
        lineWeight: boolean;
        backgroundPurity: boolean;
        printReadability: boolean;
    };
    /** Specific failures */
    failures: string[];
    /** What's good */
    strengths: string[];
    /** Archetype match */
    matchedArchetype: 'CuteCharacter' | 'Mandala' | 'SimpleKids' | 'DetailedScene' | 'Zentangle' | 'Unknown';
    /** Improvement suggestions */
    improvements: string[];
}

const SELLABLE_AUDIT_PROMPT = `
You are a professional coloring book quality auditor for Amazon KDP and Etsy.
Your job is to score this image against STRICT publishable standards.

═══════════════════════════════════════════════════════════════════════════════
PASS/FAIL CHECKLIST (Any fail = page likely needs rework)
═══════════════════════════════════════════════════════════════════════════════

LINE QUALITY:
- [ ] Lines are clean and smooth (no fuzz, jitter, grainy texture)
- [ ] Outlines are closed where appropriate (colorable regions bounded)
- [ ] No stray marks, speckles, or sketch artifacts
- [ ] Curves look natural (no stair-stepping jaggies)

LINE WEIGHT:
- [ ] Line thickness is consistent and intentional
- [ ] No hairline-thin strokes that risk disappearing
- [ ] No overly thick strokes that muddy detail
- [ ] If varying, follows readable rule (foreground thicker)

BACKGROUND PURITY:
- [ ] Background is PURE WHITE (no blotches, gray tint, banding)
- [ ] No compression artifacts (blockiness, haloing)
- [ ] No unintended texture (paper grain, AI noise, shading)

PRINT READABILITY:
- [ ] Looks crisp at actual print size
- [ ] Important details remain readable
- [ ] Shapes are not so tiny they become clutter

═══════════════════════════════════════════════════════════════════════════════
SCORING RUBRIC (0-100)
═══════════════════════════════════════════════════════════════════════════════

PRINT CLEANLINESS (30 points):
- Crisp lines, no artifacts, pure white background, printable line weight

COLORABILITY (20 points):
- Regions are usable, enjoyable density, good balance of rest/detail

COMPOSITION (20 points):
- Clear focal point, strong hierarchy, readable depth, pleasing layout

AUDIENCE ALIGNMENT (15 points):
- Difficulty and theme match target user; shapes sized appropriately

SERIES CONSISTENCY (15 points):
- Matches style system, line weight norms, thematic cohesion

THRESHOLDS:
- 0-59: REJECT (too many issues)
- 60-74: MINIMUM PUBLISHABLE (passable but not premium)
- 75-89: STRONG/COMPETITIVE (professional, satisfying)
- 90-100: PREMIUM (exceptional, showcase-worthy)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

{
  "score": 0-100,
  "decision": "reject|minimum|strong|premium",
  "breakdown": {
    "printCleanliness": 0-30,
    "colorability": 0-20,
    "composition": 0-20,
    "audienceAlignment": 0-15,
    "seriesConsistency": 0-15
  },
  "passFailChecklist": {
    "lineQuality": true/false,
    "lineWeight": true/false,
    "backgroundPurity": true/false,
    "printReadability": true/false
  },
  "failures": ["Specific failed criteria"],
  "strengths": ["What's done well"],
  "matchedArchetype": "CuteCharacter|Mandala|SimpleKids|DetailedScene|Zentangle|Unknown",
  "improvements": ["Specific, actionable improvements"]
}

Be STRICT. This is for commercial publication.
`;

/**
 * Run a professional sellable audit on an image
 * Uses the rubric from what-makes-a-sellable-coloring-page.md
 */
export const runSellableAudit = async (
    imageBase64: string,
    apiKey: string,
    audienceId: AudienceId = 'adults',
    styleId: StyleId = 'Whimsical',
    signal?: AbortSignal
): Promise<SellableAuditResult> => {
    if (signal?.aborted) {
        throw new Error('Aborted');
    }

    const contextPrompt = `
${SELLABLE_AUDIT_PROMPT}

CONTEXT:
- Target Audience: ${audienceId}
- Visual Style: ${styleId}

Audit this coloring page image:
`;

    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: {
                parts: [
                    { text: contextPrompt },
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
                temperature: 0.2, // Very consistent
            },
        });

        if (signal?.aborted) {
            throw new Error('Aborted');
        }

        const resultText = response.text || '{}';
        let result: Partial<SellableAuditResult>;

        try {
            result = JSON.parse(resultText);
        } catch (parseError) {
            console.error('Failed to parse SellableAudit response:', resultText);
            return createDefaultAuditResult('Failed to parse audit response');
        }

        // Normalize and validate
        const score = Math.min(100, Math.max(0, result.score || 0));
        let decision: SellableAuditResult['decision'] = 'reject';
        if (score >= 90) decision = 'premium';
        else if (score >= 75) decision = 'strong';
        else if (score >= 60) decision = 'minimum';

        return {
            score,
            decision,
            breakdown: {
                printCleanliness: result.breakdown?.printCleanliness || 0,
                colorability: result.breakdown?.colorability || 0,
                composition: result.breakdown?.composition || 0,
                audienceAlignment: result.breakdown?.audienceAlignment || 0,
                seriesConsistency: result.breakdown?.seriesConsistency || 0,
            },
            passFailChecklist: {
                lineQuality: result.passFailChecklist?.lineQuality ?? false,
                lineWeight: result.passFailChecklist?.lineWeight ?? false,
                backgroundPurity: result.passFailChecklist?.backgroundPurity ?? false,
                printReadability: result.passFailChecklist?.printReadability ?? false,
            },
            failures: result.failures || [],
            strengths: result.strengths || [],
            matchedArchetype: result.matchedArchetype || 'Unknown',
            improvements: result.improvements || [],
        };

    } catch (error: any) {
        if (error.message === 'Aborted') {
            throw error;
        }
        console.error('SellableAudit failed:', error.message);
        return createDefaultAuditResult(error.message);
    }
};

/**
 * Create a default audit result when the audit fails
 */
const createDefaultAuditResult = (reason: string): SellableAuditResult => ({
    score: 50,
    decision: 'minimum',
    breakdown: {
        printCleanliness: 15,
        colorability: 10,
        composition: 10,
        audienceAlignment: 8,
        seriesConsistency: 7,
    },
    passFailChecklist: {
        lineQuality: true,
        lineWeight: true,
        backgroundPurity: true,
        printReadability: true,
    },
    failures: [`Audit incomplete: ${reason}`],
    strengths: [],
    matchedArchetype: 'Unknown',
    improvements: ['Manual review recommended'],
});

/**
 * Quick sellable check - returns just pass/fail and score
 */
export const quickSellableCheck = async (
    imageBase64: string,
    apiKey: string,
    minimumScore: number = 60
): Promise<{ passed: boolean; score: number; decision: string }> => {
    const result = await runSellableAudit(imageBase64, apiKey);
    return {
        passed: result.score >= minimumScore,
        score: result.score,
        decision: result.decision,
    };
};
