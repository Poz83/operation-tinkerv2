/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REPAIR SERVICE v2.0 — Intelligent Regeneration Strategy
 * Paint-by-Numbers SaaS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Architecture:
 * 1. Maps QA issue codes to specific repair strategies
 * 2. Prioritises repairs by severity (critical → major → minor)
 * 3. Generates context-aware repairs using style/complexity specs
 * 4. Suggests parameter adjustments when prompt changes aren't enough
 * 5. Produces structured repair objects for the regeneration loop
 *
 * Design Principles:
 * - Repairs are deterministic: same issues → same repair strategy
 * - Context-aware: repairs reference actual spec values
 * - Actionable: every repair is a concrete instruction
 * - Escalation-aware: knows when to suggest parameter changes vs prompt fixes
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
    QaResult,
    QaIssue,
    IssueSeverity,
    STYLE_VALIDATION_RULES,
    COMPLEXITY_VALIDATION_RULES,
    AUDIENCE_VALIDATION_RULES,
} from './qaService';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Types of repair actions available
 */
export type RepairActionType =
    | 'prompt_override'      // Add/modify prompt instructions
    | 'negative_boost'       // Strengthen negative prompt
    | 'parameter_change'     // Suggest changing style/complexity/audience
    | 'temperature_adjust'   // Adjust generation temperature
    | 'resolution_change'    // Change output resolution
    | 'manual_review'        // Requires human intervention
    | 'abort';               // Cannot be automatically repaired

/**
 * A single repair action
 */
export interface RepairAction {
    /** Type of repair action */
    type: RepairActionType;
    /** Priority (lower = more important, 1 = highest) */
    priority: number;
    /** Human-readable description */
    description: string;
    /** The actual repair content (prompt text, parameter value, etc.) */
    content: string;
    /** Confidence this repair will fix the issue (0-100) */
    confidence: number;
    /** The issue code this repair addresses */
    addressesIssue: string;
}

/**
 * Suggested parameter changes
 */
export interface ParameterSuggestions {
    /** Suggested style change (null = keep current) */
    styleId?: string;
    /** Suggested complexity change */
    complexityId?: string;
    /** Suggested audience change */
    audienceId?: string;
    /** Suggested temperature adjustment */
    temperature?: number;
    /** Suggested resolution change */
    resolution?: '1K' | '2K' | '4K';
    /** Reasons for suggestions */
    reasons: string[];
}

/**
 * Complete repair plan for regeneration
 */
export interface RepairPlan {
    /** Unique ID for tracking */
    repairId: string;
    /** Original request ID from QA */
    originalRequestId: string;
    /** Whether automatic repair is possible */
    canAutoRepair: boolean;
    /** Whether regeneration is recommended */
    shouldRegenerate: boolean;
    /** Overall repair confidence (0-100) */
    overallConfidence: number;
    /** All repair actions, sorted by priority */
    actions: RepairAction[];
    /** Prompt additions/overrides to apply */
    promptOverrides: string[];
    /** Negative prompt additions */
    negativeBoosts: string[];
    /** Suggested parameter changes */
    parameterSuggestions: ParameterSuggestions;
    /** Issues that cannot be auto-repaired */
    unreparableIssues: QaIssue[];
    /** Summary for logging/display */
    summary: string;
    /** Attempt number (for retry tracking) */
    attemptNumber: number;
    /** Maximum attempts before giving up */
    maxAttempts: number;
}

/**
 * Context for generating repairs
 */
export interface RepairContext {
    /** QA result to repair */
    qaResult: QaResult;
    /** Current style ID */
    styleId: string;
    /** Current complexity ID */
    complexityId: string;
    /** Current audience ID */
    audienceId: string;
    /** Original user prompt */
    userPrompt: string;
    /** Current attempt number (1-based) */
    attemptNumber?: number;
    /** Maximum retry attempts */
    maxAttempts?: number;
    /** Previous repair plans (for escalation logic) */
    previousRepairs?: RepairPlan[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPAIR STRATEGY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Repair strategy for each issue code
 */
interface RepairStrategy {
    /** Primary repair action type */
    primaryAction: RepairActionType;
    /** Base priority (1 = highest) */
    basePriority: number;
    /** Base confidence for this repair */
    baseConfidence: number;
    /** Generate prompt override (context-aware) */
    getPromptOverride: (context: RepairContext) => string | null;
    /** Generate negative boost */
    getNegativeBoost: (context: RepairContext) => string | null;
    /** Generate parameter suggestions */
    getParameterSuggestion: (context: RepairContext) => Partial<ParameterSuggestions> | null;
    /** Whether this issue can be auto-repaired */
    canAutoRepair: boolean;
    /** Escalation: what to try if this repair fails repeatedly */
    escalationStrategy?: (context: RepairContext) => Partial<ParameterSuggestions>;
}

const REPAIR_STRATEGIES: Record<string, RepairStrategy> = {

    // ═══════════════════════════════════════════════════════════════════════════
    // CRITICAL: Output Format Violations
    // ═══════════════════════════════════════════════════════════════════════════

    'COLOR_DETECTED': {
        primaryAction: 'prompt_override',
        basePriority: 1,
        baseConfidence: 85,
        canAutoRepair: true,
        getPromptOverride: () => `
[CRITICAL REPAIR - COLOR VIOLATION]
The previous output contained COLOR. This is FORBIDDEN.
OUTPUT MUST BE: Pure black lines (#000000) on pure white background (#FFFFFF) ONLY.
NO red, blue, green, yellow, or ANY other color.
NO colored elements whatsoever.
Check every pixel - if it's not black or white, it's WRONG.
    `.trim(),
        getNegativeBoost: () => 'color, colored, red, blue, green, yellow, pink, orange, purple, brown, any color, colored pencil, crayon marks, pigment',
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({
            reasons: ['Persistent color issues may indicate style incompatibility'],
        }),
    },

    'GREY_SHADING': {
        primaryAction: 'prompt_override',
        basePriority: 1,
        baseConfidence: 85,
        canAutoRepair: true,
        getPromptOverride: () => `
[CRITICAL REPAIR - GREY/SHADING VIOLATION]
The previous output contained GREY TONES or SHADING. This is FORBIDDEN.
OUTPUT MUST BE: Pure black lines on pure white ONLY.
NO grey (#808080 or any grey value).
NO gradients, NO shading, NO tonal variation.
NO soft edges or anti-aliasing that creates grey.
Lines are BLACK. Background is WHITE. Nothing else.
    `.trim(),
        getNegativeBoost: () => 'grey, gray, shading, gradient, shadow, tonal, soft edges, anti-aliasing, halftone, stipple shading',
        getParameterSuggestion: (ctx) => {
            // Suggest lower temperature for more deterministic output
            return { temperature: 0.6, reasons: ['Lower temperature may reduce shading tendency'] };
        },
        escalationStrategy: () => ({
            styleId: 'Bold & Easy',
            reasons: ['Bold & Easy style has strongest black/white enforcement'],
        }),
    },

    'SOLID_BLACK_FILL': {
        primaryAction: 'prompt_override',
        basePriority: 1,
        baseConfidence: 80,
        canAutoRepair: true,
        getPromptOverride: () => `
[CRITICAL REPAIR - SOLID BLACK FILL VIOLATION]
The previous output contained SOLID BLACK FILLED AREAS. This is FORBIDDEN.
ALL areas must be OUTLINED ONLY - never filled.
Pupils = outlined circles, NOT filled black.
Hair = individual strands/sections with outlines, NOT solid black mass.
Shadows = suggested by line weight variation, NOT filled areas.
Every "would-be-dark" area must be an OUTLINED REGION that can be colored.
    `.trim(),
        getNegativeBoost: () => 'solid black, filled black, black fill, silhouette, solid areas, filled areas, black mass, filled pupils',
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({
            reasons: ['Consider simplifying subject to reduce fill temptation'],
        }),
    },

    'MOCKUP_DETECTED': {
        primaryAction: 'prompt_override',
        basePriority: 1,
        baseConfidence: 90,
        canAutoRepair: true,
        getPromptOverride: () => `
[CRITICAL REPAIR - MOCKUP/PHOTO DETECTED]
The previous output was a MOCKUP or PHOTO, not line art. This is WRONG.
OUTPUT MUST BE: Pure line art drawing, NOT a photograph.
NO paper texture, NO wood table, NO art supplies visible.
NO staged photography, NO flatlay composition.
NO shadows cast by objects, NO 3D perspective of paper.
Just the LINE ART itself on pure white digital background.
    `.trim(),
        getNegativeBoost: () => 'mockup, photo, photograph, staged, flatlay, paper texture, wood table, pencils, crayons, art supplies, shadow, 3d render, product shot',
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({
            reasons: ['Mockup generation may require explicit "digital illustration" framing'],
        }),
    },

    'UNCLOSED_REGIONS': {
        primaryAction: 'prompt_override',
        basePriority: 1,
        baseConfidence: 75,
        canAutoRepair: true,
        getPromptOverride: (ctx) => {
            const styleRules = STYLE_VALIDATION_RULES[ctx.styleId] || STYLE_VALIDATION_RULES['default'];
            return `
[CRITICAL REPAIR - UNCLOSED REGIONS]
The previous output had OPEN/UNCLOSED shapes. This breaks paint-by-numbers functionality.
EVERY shape MUST be fully CLOSED (watertight).
Line endpoints MUST connect with no gaps.
Minimum region size: ${styleRules.minRegionMm}mm²
If a shape cannot be flood-filled, it is WRONG.
Check: eyes, fingers, hair strands, decorative elements - ALL must close.
      `.trim();
        },
        getNegativeBoost: () => 'open paths, unclosed shapes, gaps, broken lines, incomplete outlines',
        getParameterSuggestion: (ctx) => {
            // Simpler styles have fewer closure issues
            if (ctx.styleId === 'Botanical' || ctx.styleId === 'Wildlife') {
                return {
                    styleId: 'Cartoon',
                    reasons: ['Fine-detail styles more prone to closure issues; Cartoon style has cleaner closures'],
                };
            }
            return null;
        },
        escalationStrategy: (ctx) => ({
            complexityId: 'Simple',
            reasons: ['Reducing complexity improves closure reliability'],
        }),
    },

    'INAPPROPRIATE_CONTENT': {
        primaryAction: 'abort',
        basePriority: 1,
        baseConfidence: 0,
        canAutoRepair: false,
        getPromptOverride: () => null,
        getNegativeBoost: () => null,
        getParameterSuggestion: () => null,
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MAJOR: Structural/Style Issues
    // ═══════════════════════════════════════════════════════════════════════════

    'REGIONS_TOO_SMALL': {
        primaryAction: 'parameter_change',
        basePriority: 2,
        baseConfidence: 70,
        canAutoRepair: true,
        getPromptOverride: (ctx) => {
            const styleRules = STYLE_VALIDATION_RULES[ctx.styleId] || STYLE_VALIDATION_RULES['default'];
            return `
[REPAIR - REGIONS TOO SMALL]
The previous output had regions smaller than ${styleRules.minRegionMm}mm².
ENLARGE all small details. Merge tiny adjacent regions.
Minimum enclosed area: ${styleRules.minRegionMm}mm²
If a region is too small to comfortably color, make it bigger or merge it.
      `.trim();
        },
        getNegativeBoost: () => 'tiny details, micro regions, fine lines, intricate patterns',
        getParameterSuggestion: (ctx) => {
            const complexityOrder = ['Very Simple', 'Simple', 'Moderate', 'Intricate', 'Extreme Detail'];
            const currentIndex = complexityOrder.indexOf(ctx.complexityId);
            if (currentIndex > 0) {
                return {
                    complexityId: complexityOrder[currentIndex - 1],
                    reasons: ['Reducing complexity will increase minimum region sizes'],
                };
            }
            // Already at simplest - suggest style change
            return {
                styleId: 'Bold & Easy',
                reasons: ['Bold & Easy has largest minimum region size (8mm²)'],
            };
        },
        escalationStrategy: (ctx) => ({
            styleId: 'Bold & Easy',
            complexityId: 'Very Simple',
            reasons: ['Maximum simplification for region size compliance'],
        }),
    },

    'REGIONS_TOO_MANY': {
        primaryAction: 'parameter_change',
        basePriority: 2,
        baseConfidence: 75,
        canAutoRepair: true,
        getPromptOverride: (ctx) => {
            const styleRules = STYLE_VALIDATION_RULES[ctx.styleId] || STYLE_VALIDATION_RULES['default'];
            const maxRegions = styleRules.maxRegions || 120;
            return `
[REPAIR - TOO MANY REGIONS]
The previous output exceeded the region limit.
Maximum regions for this style: ${maxRegions}
SIMPLIFY the composition. Remove background clutter.
Merge small adjacent regions. Focus on the main subject.
      `.trim();
        },
        getNegativeBoost: () => 'complex background, many details, cluttered, busy composition',
        getParameterSuggestion: (ctx) => {
            const complexityOrder = ['Very Simple', 'Simple', 'Moderate', 'Intricate', 'Extreme Detail'];
            const currentIndex = complexityOrder.indexOf(ctx.complexityId);
            if (currentIndex > 0) {
                return {
                    complexityId: complexityOrder[currentIndex - 1],
                    reasons: ['Lower complexity = fewer regions'],
                };
            }
            return null;
        },
        escalationStrategy: () => ({
            complexityId: 'Simple',
            reasons: ['Significant complexity reduction needed'],
        }),
    },

    'REGIONS_TOO_FEW': {
        primaryAction: 'parameter_change',
        basePriority: 3,
        baseConfidence: 70,
        canAutoRepair: true,
        getPromptOverride: () => `
[REPAIR - TOO FEW REGIONS]
The previous output was too simple for the requested complexity.
ADD more detail. Include background elements.
Add internal divisions to large shapes (clothing folds, fur texture outlines, etc.)
    `.trim(),
        getNegativeBoost: () => null,
        getParameterSuggestion: (ctx) => {
            const complexityOrder = ['Very Simple', 'Simple', 'Moderate', 'Intricate', 'Extreme Detail'];
            const currentIndex = complexityOrder.indexOf(ctx.complexityId);
            if (currentIndex < complexityOrder.length - 1) {
                return {
                    complexityId: complexityOrder[currentIndex + 1],
                    reasons: ['Increasing complexity will add more regions'],
                };
            }
            return null;
        },
        escalationStrategy: () => ({
            complexityId: 'Intricate',
            reasons: ['Higher complexity setting needed'],
        }),
    },

    'LINE_WEIGHT_WRONG': {
        primaryAction: 'prompt_override',
        basePriority: 2,
        baseConfidence: 70,
        canAutoRepair: true,
        getPromptOverride: (ctx) => {
            const styleRules = STYLE_VALIDATION_RULES[ctx.styleId] || STYLE_VALIDATION_RULES['default'];
            return `
[REPAIR - LINE WEIGHT INCORRECT]
The previous output had incorrect line weight for ${ctx.styleId} style.
REQUIRED LINE WEIGHT: ${styleRules.lineWeightMm}
Adjust ALL strokes to match this specification exactly.
${ctx.styleId === 'Bold & Easy' ? 'ALL lines must be thick and uniform - no thin lines anywhere.' : ''}
${ctx.styleId === 'Botanical' ? 'Use fine, delicate strokes throughout.' : ''}
${ctx.styleId === 'Realistic' ? 'Maintain perfectly uniform line weight (Ligne Claire style).' : ''}
      `.trim();
        },
        getNegativeBoost: (ctx) => {
            if (ctx.styleId === 'Bold & Easy') return 'thin lines, fine details, delicate strokes, varying line weight';
            if (ctx.styleId === 'Botanical') return 'thick lines, bold strokes, heavy lines';
            return 'inconsistent line weight';
        },
        getParameterSuggestion: () => null,
        escalationStrategy: (ctx) => ({
            temperature: 0.6,
            reasons: ['Lower temperature for more consistent line weight'],
        }),
    },

    'STYLE_MISMATCH': {
        primaryAction: 'prompt_override',
        basePriority: 2,
        baseConfidence: 65,
        canAutoRepair: true,
        getPromptOverride: (ctx) => {
            const styleRules = STYLE_VALIDATION_RULES[ctx.styleId] || STYLE_VALIDATION_RULES['default'];
            return `
[REPAIR - STYLE MISMATCH]
The previous output did not match the requested "${ctx.styleId}" style.
STRICTLY follow these style requirements:
${styleRules.specificChecks.map(check => `- ${check}`).join('\n')}
Do NOT deviate from this style. Do NOT mix with other styles.
      `.trim();
        },
        getNegativeBoost: (ctx) => {
            // Return negatives for OTHER styles
            const otherStyles = Object.keys(STYLE_VALIDATION_RULES).filter(s => s !== ctx.styleId && s !== 'default');
            return otherStyles.slice(0, 5).join(' style, ') + ' style';
        },
        getParameterSuggestion: () => null,
        escalationStrategy: (ctx) => ({
            temperature: 0.5,
            reasons: ['Lower temperature may improve style adherence'],
        }),
    },

    'COMPLEXITY_MISMATCH': {
        primaryAction: 'prompt_override',
        basePriority: 2,
        baseConfidence: 70,
        canAutoRepair: true,
        getPromptOverride: (ctx) => {
            const complexityRules = COMPLEXITY_VALIDATION_RULES[ctx.complexityId] || COMPLEXITY_VALIDATION_RULES['Moderate'];
            return `
[REPAIR - COMPLEXITY MISMATCH]
The previous output did not match "${ctx.complexityId}" complexity.
REQUIRED: ${complexityRules.densityDescription}
Maximum shapes: ${complexityRules.maxShapes || 'No limit'}
Background elements: ${complexityRules.allowsBackground ? 'Allowed' : 'NOT allowed'}
${complexityRules.specificChecks.map(check => `- ${check}`).join('\n')}
      `.trim();
        },
        getNegativeBoost: () => null,
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({
            reasons: ['Complexity adherence may require prompt restructuring'],
        }),
    },

    'TEXTURE_WHERE_FORBIDDEN': {
        primaryAction: 'prompt_override',
        basePriority: 2,
        baseConfidence: 80,
        canAutoRepair: true,
        getPromptOverride: (ctx) => `
[REPAIR - FORBIDDEN TEXTURE]
The previous output contained texture marks, but ${ctx.styleId} style FORBIDS textures.
REMOVE all hatching, stippling, cross-hatching, and texture marks.
Use CLEAN OUTLINES ONLY.
Suggest form through contour, not through texture.
    `.trim(),
        getNegativeBoost: () => 'hatching, cross-hatching, stippling, texture marks, shading marks, fill patterns',
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({
            styleId: 'Bold & Easy',
            reasons: ['Bold & Easy has strictest no-texture enforcement'],
        }),
    },

    'CURVES_IN_GEOMETRIC': {
        primaryAction: 'prompt_override',
        basePriority: 2,
        baseConfidence: 85,
        canAutoRepair: true,
        getPromptOverride: () => `
[REPAIR - CURVES IN GEOMETRIC STYLE]
The previous output contained CURVED LINES. Geometric style FORBIDS curves.
USE ONLY STRAIGHT LINES.
Every shape must be a polygon (triangles, quadrilaterals, etc.)
Approximate curves using faceted/tessellated straight segments.
ZERO curves permitted - this is absolute.
    `.trim(),
        getNegativeBoost: () => 'curves, curved lines, arcs, circles, organic shapes, flowing lines, smooth curves',
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({
            temperature: 0.4,
            reasons: ['Very low temperature for strict geometric adherence'],
        }),
    },

    'SHARP_ANGLES_IN_KAWAII': {
        primaryAction: 'prompt_override',
        basePriority: 2,
        baseConfidence: 80,
        canAutoRepair: true,
        getPromptOverride: () => `
[REPAIR - SHARP ANGLES IN KAWAII STYLE]
The previous output contained SHARP ANGLES. Kawaii style requires ALL ROUNDED corners.
ROUND every corner (minimum 2mm radius).
NO pointed shapes, NO angular forms.
Everything must be SOFT, CUTE, and ROUNDED.
    `.trim(),
        getNegativeBoost: () => 'sharp angles, pointed, angular, spiky, harsh corners, geometric',
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({
            reasons: ['Consider subject change if angular subjects requested'],
        }),
    },

    'THIN_LINES_IN_BOLD': {
        primaryAction: 'prompt_override',
        basePriority: 2,
        baseConfidence: 85,
        canAutoRepair: true,
        getPromptOverride: () => `
[REPAIR - THIN LINES IN BOLD & EASY STYLE]
The previous output contained THIN LINES. Bold & Easy requires 4mm THICK lines ONLY.
Make ALL lines THICK (4mm).
NO thin details, NO fine lines, NO delicate strokes.
If a detail requires thin lines, REMOVE that detail.
Simplicity over detail - this is a bold, simple style.
    `.trim(),
        getNegativeBoost: () => 'thin lines, fine details, delicate, intricate, detailed, wispy, hairline',
        getParameterSuggestion: (ctx) => {
            if (ctx.complexityId !== 'Very Simple' && ctx.complexityId !== 'Simple') {
                return {
                    complexityId: 'Simple',
                    reasons: ['Bold & Easy works best with Simple complexity'],
                };
            }
            return null;
        },
        escalationStrategy: () => ({
            complexityId: 'Very Simple',
            reasons: ['Maximum simplification for Bold & Easy compliance'],
        }),
    },

    'AUDIENCE_MISMATCH': {
        primaryAction: 'prompt_override',
        basePriority: 2,
        baseConfidence: 65,
        canAutoRepair: true,
        getPromptOverride: (ctx) => {
            const audienceRules = AUDIENCE_VALIDATION_RULES[ctx.audienceId] || AUDIENCE_VALIDATION_RULES['default'];
            return `
[REPAIR - AUDIENCE MISMATCH]
The previous output was not appropriate for "${ctx.audienceId}" audience.
Required characteristics: ${audienceRules.requiredCharacteristics.join(', ')}
Maximum complexity: ${audienceRules.maxComplexity}
${audienceRules.specificChecks.map(check => `- ${check}`).join('\n')}
      `.trim();
        },
        getNegativeBoost: (ctx) => {
            const audienceRules = AUDIENCE_VALIDATION_RULES[ctx.audienceId] || AUDIENCE_VALIDATION_RULES['default'];
            return audienceRules.prohibitedContent.join(', ');
        },
        getParameterSuggestion: (ctx) => {
            const audienceRules = AUDIENCE_VALIDATION_RULES[ctx.audienceId] || AUDIENCE_VALIDATION_RULES['default'];
            const complexityOrder = ['Very Simple', 'Simple', 'Moderate', 'Intricate', 'Extreme Detail'];
            const maxIndex = complexityOrder.indexOf(audienceRules.maxComplexity);
            const currentIndex = complexityOrder.indexOf(ctx.complexityId);

            if (currentIndex > maxIndex) {
                return {
                    complexityId: audienceRules.maxComplexity,
                    reasons: [`${ctx.audienceId} audience maximum complexity is ${audienceRules.maxComplexity}`],
                };
            }
            return null;
        },
        escalationStrategy: (ctx) => {
            const audienceRules = AUDIENCE_VALIDATION_RULES[ctx.audienceId] || AUDIENCE_VALIDATION_RULES['default'];
            return {
                complexityId: audienceRules.maxComplexity,
                styleId: ctx.audienceId === 'toddlers' ? 'Bold & Easy' : undefined,
                reasons: ['Audience compliance requires parameter adjustment'],
            };
        },
    },

    'SCARY_FOR_YOUNG': {
        primaryAction: 'prompt_override',
        basePriority: 1,
        baseConfidence: 70,
        canAutoRepair: true,
        getPromptOverride: () => `
[REPAIR - SCARY CONTENT FOR YOUNG AUDIENCE]
The previous output was TOO SCARY for the target young audience.
Make the subject 100% CUTE and FRIENDLY.
- Replace angry expressions with happy/neutral
- Remove teeth, claws, sharp elements
- Add cute features (big eyes, round shapes, soft forms)
- Use friendly, welcoming poses
The result must be something a toddler would find comforting, not scary.
    `.trim(),
        getNegativeBoost: () => 'scary, frightening, angry, aggressive, teeth, fangs, claws, monster, horror, threatening, menacing, dark',
        getParameterSuggestion: () => ({
            styleId: 'Kawaii',
            reasons: ['Kawaii style enforces cute aesthetic'],
        }),
        escalationStrategy: () => ({
            styleId: 'Kawaii',
            complexityId: 'Simple',
            reasons: ['Full cute-enforcement parameters'],
        }),
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MINOR: Quality Observations
    // ═══════════════════════════════════════════════════════════════════════════

    'COMPOSITION_IMBALANCED': {
        primaryAction: 'prompt_override',
        basePriority: 4,
        baseConfidence: 60,
        canAutoRepair: true,
        getPromptOverride: () => `
[MINOR REPAIR - COMPOSITION]
Improve visual balance. Distribute visual weight evenly.
Avoid clustering all elements on one side.
    `.trim(),
        getNegativeBoost: () => 'unbalanced composition, lopsided, off-center weight',
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({}),
    },

    'SUBJECT_OFF_CENTER': {
        primaryAction: 'prompt_override',
        basePriority: 4,
        baseConfidence: 65,
        canAutoRepair: true,
        getPromptOverride: (ctx) => {
            const audienceRules = AUDIENCE_VALIDATION_RULES[ctx.audienceId] || AUDIENCE_VALIDATION_RULES['default'];
            if (ctx.audienceId === 'toddlers' || ctx.audienceId === 'preschool') {
                return `
[MINOR REPAIR - CENTERING]
Center the main subject for young audience.
Subject should be prominently centered with clear margins.
        `.trim();
            }
            return null; // Not important for other audiences
        },
        getNegativeBoost: () => null,
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({}),
    },

    'BACKGROUND_SPARSE': {
        primaryAction: 'prompt_override',
        basePriority: 5,
        baseConfidence: 55,
        canAutoRepair: true,
        getPromptOverride: (ctx) => {
            const complexityRules = COMPLEXITY_VALIDATION_RULES[ctx.complexityId] || COMPLEXITY_VALIDATION_RULES['Moderate'];
            if (complexityRules.allowsBackground) {
                return `
[MINOR REPAIR - BACKGROUND]
Add more background elements appropriate to the scene.
Fill negative space with contextual details.
        `.trim();
            }
            return null;
        },
        getNegativeBoost: () => null,
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({}),
    },

    'BACKGROUND_BUSY': {
        primaryAction: 'prompt_override',
        basePriority: 4,
        baseConfidence: 60,
        canAutoRepair: true,
        getPromptOverride: () => `
[MINOR REPAIR - BACKGROUND]
Simplify the background. Remove distracting elements.
Keep focus on the main subject.
    `.trim(),
        getNegativeBoost: () => 'busy background, cluttered, distracting elements',
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({}),
    },

    'MINOR_STYLE_DEVIATION': {
        primaryAction: 'prompt_override',
        basePriority: 5,
        baseConfidence: 50,
        canAutoRepair: true,
        getPromptOverride: (ctx) => `
[MINOR REPAIR - STYLE CONSISTENCY]
Minor style inconsistencies detected. Strengthen adherence to ${ctx.styleId} style.
    `.trim(),
        getNegativeBoost: () => null,
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({}),
    },

    'LINE_QUALITY_VARIABLE': {
        primaryAction: 'prompt_override',
        basePriority: 5,
        baseConfidence: 55,
        canAutoRepair: true,
        getPromptOverride: (ctx) => {
            const styleRules = STYLE_VALIDATION_RULES[ctx.styleId] || STYLE_VALIDATION_RULES['default'];
            // Only repair if style requires consistent weight
            if (ctx.styleId === 'Realistic' || ctx.styleId === 'Bold & Easy' || ctx.styleId === 'Geometric') {
                return `
[MINOR REPAIR - LINE CONSISTENCY]
Maintain consistent line weight (${styleRules.lineWeightMm}) throughout.
        `.trim();
            }
            return null; // Variable weight acceptable for other styles
        },
        getNegativeBoost: () => null,
        getParameterSuggestion: () => null,
        escalationStrategy: () => ({}),
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SERVICE ERRORS (from QA failures)
    // ═══════════════════════════════════════════════════════════════════════════

    'QA_SERVICE_ERROR': {
        primaryAction: 'manual_review',
        basePriority: 1,
        baseConfidence: 0,
        canAutoRepair: false,
        getPromptOverride: () => null,
        getNegativeBoost: () => null,
        getParameterSuggestion: () => null,
    },
};

// Default strategy for unknown issue codes
const DEFAULT_STRATEGY: RepairStrategy = {
    primaryAction: 'prompt_override',
    basePriority: 3,
    baseConfidence: 50,
    canAutoRepair: true,
    getPromptOverride: () => `
[REPAIR - GENERAL QUALITY]
Address the identified quality issues.
Strictly follow all style and complexity specifications.
  `.trim(),
    getNegativeBoost: () => null,
    getParameterSuggestion: () => null,
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPAIR PLAN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a comprehensive repair plan from QA results
 */
export const generateRepairPlan = (context: RepairContext): RepairPlan => {
    const {
        qaResult,
        styleId,
        complexityId,
        audienceId,
        attemptNumber = 1,
        maxAttempts = 3,
        previousRepairs = [],
    } = context;

    const repairId = `repair_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // If QA passed, no repairs needed
    if (qaResult.passed && qaResult.issues.length === 0) {
        return {
            repairId,
            originalRequestId: qaResult.requestId,
            canAutoRepair: true,
            shouldRegenerate: false,
            overallConfidence: 100,
            actions: [],
            promptOverrides: [],
            negativeBoosts: [],
            parameterSuggestions: { reasons: [] },
            unreparableIssues: [],
            summary: 'No repairs needed - QA passed.',
            attemptNumber,
            maxAttempts,
        };
    }

    const actions: RepairAction[] = [];
    const promptOverrides: string[] = [];
    const negativeBoosts: string[] = [];
    const parameterSuggestions: ParameterSuggestions = { reasons: [] };
    const unreparableIssues: QaIssue[] = [];

    // Sort issues by severity (critical first) then by code
    const sortedIssues = [...qaResult.issues].sort((a, b) => {
        const severityOrder: Record<IssueSeverity, number> = { critical: 0, major: 1, minor: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Process each issue
    for (const issue of sortedIssues) {
        const strategy = REPAIR_STRATEGIES[issue.code] || DEFAULT_STRATEGY;

        // Check if auto-repair is possible
        if (!strategy.canAutoRepair) {
            unreparableIssues.push(issue);
            continue;
        }

        // Check for escalation (repeated failures)
        const previousFailures = previousRepairs.filter(r =>
            r.actions.some(a => a.addressesIssue === issue.code)
        ).length;

        const shouldEscalate = previousFailures >= 1 && strategy.escalationStrategy;

        // Generate repair action
        const action: RepairAction = {
            type: strategy.primaryAction,
            priority: strategy.basePriority,
            description: `Repair for ${issue.code}: ${issue.description}`,
            content: '',
            confidence: strategy.baseConfidence - (previousFailures * 10), // Reduce confidence on repeated failures
            addressesIssue: issue.code,
        };

        // Get prompt override
        const promptOverride = strategy.getPromptOverride(context);
        if (promptOverride) {
            promptOverrides.push(promptOverride);
            action.content = promptOverride;
        }

        // Get negative boost
        const negativeBoost = strategy.getNegativeBoost(context);
        if (negativeBoost) {
            negativeBoosts.push(negativeBoost);
        }

        // Get parameter suggestions
        let paramSuggestion = strategy.getParameterSuggestion(context);

        // Apply escalation if needed
        if (shouldEscalate && strategy.escalationStrategy) {
            const escalation = strategy.escalationStrategy(context);
            paramSuggestion = { ...paramSuggestion, ...escalation };
            action.type = 'parameter_change';
            action.description += ' [ESCALATED]';
        }

        if (paramSuggestion) {
            if (paramSuggestion.styleId) parameterSuggestions.styleId = paramSuggestion.styleId;
            if (paramSuggestion.complexityId) parameterSuggestions.complexityId = paramSuggestion.complexityId;
            if (paramSuggestion.audienceId) parameterSuggestions.audienceId = paramSuggestion.audienceId;
            if (paramSuggestion.temperature) parameterSuggestions.temperature = paramSuggestion.temperature;
            if (paramSuggestion.resolution) parameterSuggestions.resolution = paramSuggestion.resolution;
            if (paramSuggestion.reasons) {
                parameterSuggestions.reasons.push(...paramSuggestion.reasons);
            }
        }

        actions.push(action);
    }

    // Sort actions by priority
    actions.sort((a, b) => a.priority - b.priority);

    // Calculate overall confidence
    const confidences = actions.map(a => a.confidence).filter(c => c > 0);
    const overallConfidence = confidences.length > 0
        ? Math.round(confidences.reduce((sum, c) => sum + c, 0) / confidences.length)
        : 0;

    // Determine if we should regenerate
    const hasCriticalIssues = qaResult.criticalIssues.length > 0;
    const hasMajorIssues = qaResult.majorIssues.length > 0;
    const canAutoRepair = unreparableIssues.length === 0;
    const withinAttemptLimit = attemptNumber < maxAttempts;
    const shouldRegenerate = canAutoRepair && withinAttemptLimit && (hasCriticalIssues || hasMajorIssues);

    // Generate summary
    const summaryParts: string[] = [];
    if (qaResult.criticalIssues.length > 0) {
        summaryParts.push(`${qaResult.criticalIssues.length} critical issue(s)`);
    }
    if (qaResult.majorIssues.length > 0) {
        summaryParts.push(`${qaResult.majorIssues.length} major issue(s)`);
    }
    if (qaResult.minorIssues.length > 0) {
        summaryParts.push(`${qaResult.minorIssues.length} minor issue(s)`);
    }
    if (unreparableIssues.length > 0) {
        summaryParts.push(`${unreparableIssues.length} unrepairable`);
    }

    const summary = shouldRegenerate
        ? `Attempt ${attemptNumber}/${maxAttempts}: ${summaryParts.join(', ')}. Regeneration recommended.`
        : attemptNumber >= maxAttempts
            ? `Maximum attempts (${maxAttempts}) reached. ${summaryParts.join(', ')}.`
            : `${summaryParts.join(', ')}. ${canAutoRepair ? 'Auto-repair possible.' : 'Manual review required.'}`;

    return {
        repairId,
        originalRequestId: qaResult.requestId,
        canAutoRepair,
        shouldRegenerate,
        overallConfidence,
        actions,
        promptOverrides,
        negativeBoosts,
        parameterSuggestions,
        unreparableIssues,
        summary,
        attemptNumber,
        maxAttempts,
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPAIR APPLICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Apply repair plan to generate modified prompt and parameters
 */
export interface AppliedRepairs {
    /** Modified prompt with repair instructions prepended */
    repairedPrompt: string;
    /** Enhanced negative prompt */
    enhancedNegativePrompt: string;
    /** Modified generation parameters */
    modifiedParams: {
        styleId: string;
        complexityId: string;
        audienceId: string;
        temperature?: number;
        resolution?: '1K' | '2K' | '4K';
    };
    /** Whether parameters were changed */
    parametersModified: boolean;
    /** Summary of changes made */
    changesSummary: string[];
}

export const applyRepairPlan = (
    repairPlan: RepairPlan,
    originalPrompt: string,
    originalNegativePrompt: string,
    originalParams: {
        styleId: string;
        complexityId: string;
        audienceId: string;
    }
): AppliedRepairs => {
    const changesSummary: string[] = [];

    // Build repair instruction block
    const repairInstructions = repairPlan.promptOverrides.length > 0
        ? `
═══════════════════════════════════════════════════════════════════════════════
PRIORITY REPAIR INSTRUCTIONS (Attempt ${repairPlan.attemptNumber}/${repairPlan.maxAttempts})
The previous generation failed Quality Assurance. Apply these fixes:
═══════════════════════════════════════════════════════════════════════════════

${repairPlan.promptOverrides.join('\n\n')}

═══════════════════════════════════════════════════════════════════════════════
END REPAIR INSTRUCTIONS - Now generate the corrected image:
═══════════════════════════════════════════════════════════════════════════════

`.trim()
        : '';

    // Prepend repairs to original prompt
    const repairedPrompt = repairInstructions
        ? `${repairInstructions}\n\n${originalPrompt}`
        : originalPrompt;

    if (repairPlan.promptOverrides.length > 0) {
        changesSummary.push(`Added ${repairPlan.promptOverrides.length} repair instruction(s)`);
    }

    // Enhance negative prompt
    const negativeBoosts = repairPlan.negativeBoosts.filter(b => b && b.trim());
    const enhancedNegativePrompt = negativeBoosts.length > 0
        ? `${originalNegativePrompt}, ${negativeBoosts.join(', ')}`
        : originalNegativePrompt;

    if (negativeBoosts.length > 0) {
        changesSummary.push(`Added ${negativeBoosts.length} negative prompt boost(s)`);
    }

    // Apply parameter modifications
    const modifiedParams = { ...originalParams };
    let parametersModified = false;

    const suggestions = repairPlan.parameterSuggestions;

    if (suggestions.styleId && suggestions.styleId !== originalParams.styleId) {
        modifiedParams.styleId = suggestions.styleId;
        changesSummary.push(`Style: ${originalParams.styleId} → ${suggestions.styleId}`);
        parametersModified = true;
    }

    if (suggestions.complexityId && suggestions.complexityId !== originalParams.complexityId) {
        modifiedParams.complexityId = suggestions.complexityId;
        changesSummary.push(`Complexity: ${originalParams.complexityId} → ${suggestions.complexityId}`);
        parametersModified = true;
    }

    if (suggestions.audienceId && suggestions.audienceId !== originalParams.audienceId) {
        modifiedParams.audienceId = suggestions.audienceId;
        changesSummary.push(`Audience: ${originalParams.audienceId} → ${suggestions.audienceId}`);
        parametersModified = true;
    }

    if (suggestions.temperature) {
        (modifiedParams as any).temperature = suggestions.temperature;
        changesSummary.push(`Temperature: → ${suggestions.temperature}`);
        parametersModified = true;
    }

    if (suggestions.resolution) {
        (modifiedParams as any).resolution = suggestions.resolution;
        changesSummary.push(`Resolution: → ${suggestions.resolution}`);
        parametersModified = true;
    }

    return {
        repairedPrompt,
        enhancedNegativePrompt,
        modifiedParams,
        parametersModified,
        changesSummary,
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Legacy function for backwards compatibility
 * @deprecated Use generateRepairPlan + applyRepairPlan instead
 */
export const getRepairInstructions = (qaResult: {
    tags?: string[];
    score?: number;
    hardFail?: boolean;
    reasons?: string[];
}): string => {
    // Convert legacy format to new format
    if (!qaResult.tags || qaResult.tags.length === 0) {
        return '';
    }

    // Map legacy tags to new issue codes (best effort)
    const tagToCode: Record<string, string> = {
        'low_contrast_lines': 'LINE_WEIGHT_WRONG',
        'too_noisy': 'TEXTURE_WHERE_FORBIDDEN',
        'open_paths': 'UNCLOSED_REGIONS',
        'too_detailed': 'COMPLEXITY_MISMATCH',
        'cropped': 'COMPOSITION_IMBALANCED',
        'touches_border': 'COMPOSITION_IMBALANCED',
        'text_present_unwanted': 'STYLE_MISMATCH',
        'distorted_anatomy': 'STYLE_MISMATCH',
        'wrong_style': 'STYLE_MISMATCH',
        'background_wrong': 'MOCKUP_DETECTED',
        'scary_content': 'SCARY_FOR_YOUNG',
        'colored_artifacts': 'COLOR_DETECTED',
        'mockup_style': 'MOCKUP_DETECTED',
        'shading_present': 'GREY_SHADING',
        'grayscale_shading': 'GREY_SHADING',
    };

    const repairs: string[] = [];

    for (const tag of qaResult.tags) {
        const code = tagToCode[tag] || tag.toUpperCase();
        const strategy = REPAIR_STRATEGIES[code];

        if (strategy) {
            const override = strategy.getPromptOverride({
                qaResult: {} as QaResult,
                styleId: 'default',
                complexityId: 'Moderate',
                audienceId: 'default',
                userPrompt: '',
            });
            if (override) repairs.push(override);
        }
    }

    if (repairs.length === 0) {
        return 'IMPORTANT: Improve image clarity and strictly follow the style guide.';
    }

    return `
[PRIORITY REPAIR INSTRUCTIONS]
The previous generation failed Quality Assurance. You MUST apply these fixes:

${repairs.join('\n\n')}

IGNORE previous conflicting instructions if they caused these errors.
  `.trim();
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { REPAIR_STRATEGIES };
