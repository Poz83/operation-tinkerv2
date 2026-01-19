/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REPAIRS SERVICE v2.1 — Enhanced Repair Strategies
 * Paint-by-Numbers SaaS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PATCH NOTES (v2.1):
 * - Added repair strategies for all new v2.1 QA issue codes
 * - Enhanced texture violation repairs with explicit prohibitions
 * - Added format violation repairs (mockup, multiple images)
 * - Added composition repairs (horror vacui, rest areas)
 * - Improved prompt override generation with concrete instructions
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { QA_ISSUE_CODES, QaIssue, QaIssueCode } from './qaService';
import { STYLE_SPECS, COMPLEXITY_SPECS, AUDIENCE_SPECS, StyleId, ComplexityId, AudienceId } from './gemini-client';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface RepairStrategy {
    issueCode: QaIssueCode;
    priority: number;
    confidence: number;
    action: 'regenerate' | 'modify_prompt' | 'modify_params' | 'escalate' | 'accept';
    promptOverride: string | ((context: RepairContext) => string);
    negativeBoost: string[];
    parameterSuggestions?: Partial<RepairParameters>;
    maxAttempts: number;
    notes: string;
}

export interface RepairContext {
    styleId: string;
    complexityId: string;
    audienceId: string;
    attemptNumber: number;
    previousIssues: QaIssueCode[];
    originalPrompt: string;
}

export interface RepairParameters {
    styleId: string;
    complexityId: string;
    audienceId: string;
    temperature: number;
}

export interface RepairAction {
    issueCode: QaIssueCode;
    priority: number;
    confidence: number;
    action: string;
    promptOverride: string;
    negativeBoosts: string[];
    parameterSuggestions?: Partial<RepairParameters>;
    notes: string;
}

export interface RepairPlan {
    repairId: string;
    canAutoRepair: boolean;
    shouldRegenerate: boolean;
    overallConfidence: number;
    actions: RepairAction[];
    promptOverrides: string[];
    negativeBoosts: string[];
    parameterSuggestions: {
        styleId?: string;
        complexityId?: string;
        audienceId?: string;
        temperature?: number;
        reasons: string[];
    };
    unreparableIssues: QaIssue[];
    summary: string;
    attemptNumber: number;
    maxAttempts: number;
}

export interface AppliedRepairs {
    modifiedPrompt: string;
    modifiedNegativePrompt: string;
    modifiedParameters: Partial<RepairParameters>;
    changesSummary: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPAIR STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

const REPAIR_STRATEGIES: Record<QaIssueCode, RepairStrategy> = {
    // ─── COLOR & TONE VIOLATIONS ──────────────────────────────────────────────────
    [QA_ISSUE_CODES.COLOR_DETECTED]: {
        issueCode: 'COLOR_DETECTED',
        priority: 1,
        confidence: 90,
        action: 'regenerate',
        promptOverride: `[CRITICAL] OUTPUT MUST BE PURE BLACK (#000000) LINES ON PURE WHITE (#FFFFFF) ONLY. NO colors whatsoever.`,
        negativeBoost: ['color', 'colored', 'colorful', 'tinted', 'sepia', 'hue'],
        maxAttempts: 3,
        notes: 'Color is absolutely forbidden',
    },

    [QA_ISSUE_CODES.GREY_TONES_DETECTED]: {
        issueCode: 'GREY_TONES_DETECTED',
        priority: 1,
        confidence: 85,
        action: 'regenerate',
        promptOverride: `[CRITICAL] NO GREY TONES. Only pure black lines on pure white. If you would use grey for shading, leave it WHITE instead.`,
        negativeBoost: ['grey', 'gray', 'grey tones', 'grey shading', 'tonal variation', 'shading'],
        maxAttempts: 3,
        notes: 'Grey tones create unprintable results',
    },

    [QA_ISSUE_CODES.GRADIENT_DETECTED]: {
        issueCode: 'GRADIENT_DETECTED',
        priority: 1,
        confidence: 85,
        action: 'regenerate',
        promptOverride: `[CRITICAL] NO GRADIENTS. Every pixel is either pure black or pure white. Hard, crisp line edges only.`,
        negativeBoost: ['gradient', 'gradual', 'fade', 'soft edge', 'blend'],
        maxAttempts: 3,
        notes: 'Gradients cannot be colored',
    },

    [QA_ISSUE_CODES.SHADING_DETECTED]: {
        issueCode: 'SHADING_DETECTED',
        priority: 1,
        confidence: 85,
        action: 'regenerate',
        promptOverride: `[CRITICAL] NO SHADING. No light/shadow effects. Flat, uniform line work only. The USER adds shading with their colors.`,
        negativeBoost: ['shading', 'shadow', 'shadows', 'highlights', 'lighting'],
        maxAttempts: 3,
        notes: 'Shading prevents user creativity',
    },

    // ─── TEXTURE VIOLATIONS ───────────────────────────────────────────────────────
    [QA_ISSUE_CODES.STIPPLING_DETECTED]: {
        issueCode: 'STIPPLING_DETECTED',
        priority: 1,
        confidence: 90,
        action: 'regenerate',
        promptOverride: `[CRITICAL] ABSOLUTELY NO STIPPLING. No dots for texture or shading. Use OUTLINED SHAPES instead of dots.`,
        negativeBoost: ['stippling', 'stippled', 'dots', 'dotted', 'pointillism', 'dot shading'],
        parameterSuggestions: { temperature: 0.6 },
        maxAttempts: 3,
        notes: 'Stippling creates grey tonal areas',
    },

    [QA_ISSUE_CODES.HATCHING_DETECTED]: {
        issueCode: 'HATCHING_DETECTED',
        priority: 1,
        confidence: 90,
        action: 'regenerate',
        promptOverride: `[CRITICAL] ABSOLUTELY NO HATCHING. No parallel lines for shading. Leave would-be-shaded areas WHITE.`,
        negativeBoost: ['hatching', 'hatched', 'parallel lines', 'line shading', 'pen and ink'],
        parameterSuggestions: { temperature: 0.6 },
        maxAttempts: 3,
        notes: 'Hatching creates grey tonal areas',
    },

    [QA_ISSUE_CODES.CROSSHATCHING_DETECTED]: {
        issueCode: 'CROSSHATCHING_DETECTED',
        priority: 1,
        confidence: 90,
        action: 'regenerate',
        promptOverride: `[CRITICAL] NO CROSS-HATCHING. No intersecting parallel lines for shading.`,
        negativeBoost: ['crosshatching', 'cross-hatching', 'grid shading'],
        parameterSuggestions: { temperature: 0.6 },
        maxAttempts: 3,
        notes: 'Cross-hatching creates dense grey areas',
    },

    [QA_ISSUE_CODES.TEXTURE_MARKS_DETECTED]: {
        issueCode: 'TEXTURE_MARKS_DETECTED',
        priority: 1,
        confidence: 85,
        action: 'regenerate',
        promptOverride: `[CRITICAL] NO DECORATIVE TEXTURE MARKS. Every line must be part of a CLOSED shape boundary.`,
        negativeBoost: ['texture marks', 'decorative strokes', 'loose strokes'],
        maxAttempts: 3,
        notes: 'Texture marks don\'t create colorable regions',
    },

    [QA_ISSUE_CODES.DECORATIVE_TEXTURE_LINES]: {
        issueCode: 'DECORATIVE_TEXTURE_LINES',
        priority: 1,
        confidence: 85,
        action: 'regenerate',
        promptOverride: `[CRITICAL] NO DECORATIVE TEXTURE LINES. Represent texture through OUTLINED SHAPES only:
- KNIT/FABRIC = outlined geometric shapes, NOT texture strokes
- FUR = outlined SECTIONS, NOT individual hair strokes
- WOOD = outlined PLANKS, NOT grain lines
- WATER = enclosed WAVE SHAPES, NOT wavy lines`,
        negativeBoost: ['fur strokes', 'hair strokes', 'fabric texture', 'knit texture', 'wood grain lines', 'decorative lines'],
        maxAttempts: 3,
        notes: 'Common issue - must convert texture to shapes',
    },

    // ─── REGION VIOLATIONS ────────────────────────────────────────────────────────
    [QA_ISSUE_CODES.UNCLOSED_REGIONS]: {
        issueCode: 'UNCLOSED_REGIONS',
        priority: 1,
        confidence: 80,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const styleSpec = STYLE_SPECS[ctx.styleId as StyleId] || STYLE_SPECS['Cozy Hand-Drawn'];
            return `[CRITICAL] ALL REGIONS MUST BE 100% CLOSED. Every shape must be watertight. All line endpoints must CONNECT. Style: ${styleSpec.lineWeight}.`;
        },
        negativeBoost: ['open paths', 'gaps', 'broken lines', 'disconnected'],
        maxAttempts: 3,
        notes: 'Unclosed regions cannot be colored',
    },

    [QA_ISSUE_CODES.UNCLOSED_WATER_REGIONS]: {
        issueCode: 'UNCLOSED_WATER_REGIONS',
        priority: 1,
        confidence: 85,
        action: 'regenerate',
        promptOverride: `[CRITICAL] WATER MUST BE ENCLOSED SHAPES, NOT WAVY LINES. Draw water as a series of ENCLOSED wave shapes. Each wave crest = a CLOSED colorable region. NO decorative wavy lines.`,
        negativeBoost: ['wavy lines', 'water lines', 'wave lines', 'ripple lines'],
        maxAttempts: 3,
        notes: 'Water is commonly rendered wrong',
    },

    [QA_ISSUE_CODES.UNCLOSED_HAIR_STRANDS]: {
        issueCode: 'UNCLOSED_HAIR_STRANDS',
        priority: 1,
        confidence: 85,
        action: 'regenerate',
        promptOverride: `[CRITICAL] HAIR MUST BE ENCLOSED SECTIONS, NOT INDIVIDUAL STRANDS. Group hair into 5-15 enclosed sections. NO individual hair strand lines.`,
        negativeBoost: ['hair strands', 'individual hairs', 'hair lines', 'detailed hair'],
        maxAttempts: 3,
        notes: 'Hair commonly has too many strands',
    },

    [QA_ISSUE_CODES.REGIONS_TOO_SMALL]: {
        issueCode: 'REGIONS_TOO_SMALL',
        priority: 2,
        confidence: 75,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const styleSpec = STYLE_SPECS[ctx.styleId as StyleId] || STYLE_SPECS['Cozy Hand-Drawn'];
            return `[REPAIR] Increase region sizes. ${styleSpec.lineWeight}. Merge tiny regions into larger ones.`;
        },
        negativeBoost: ['tiny details', 'micro details', 'intricate'],
        parameterSuggestions: { complexityId: 'Simple' },
        maxAttempts: 2,
        notes: 'May need complexity downgrade',
    },

    [QA_ISSUE_CODES.SOLID_BLACK_FILLS]: {
        issueCode: 'SOLID_BLACK_FILLS',
        priority: 1,
        confidence: 90,
        action: 'regenerate',
        promptOverride: `[CRITICAL] NO SOLID BLACK FILLED AREAS. Everything must be OUTLINED, not filled. Pupils = outlined circles. Shadows = don't exist (leave white).`,
        negativeBoost: ['solid black', 'filled black', 'black fill', 'silhouette'],
        maxAttempts: 3,
        notes: 'Solid fills rob users of coloring opportunity',
    },

    // ─── COMPOSITION VIOLATIONS ───────────────────────────────────────────────────
    [QA_ISSUE_CODES.HORROR_VACUI]: {
        issueCode: 'HORROR_VACUI',
        priority: 2,
        confidence: 80,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const complexitySpec = COMPLEXITY_SPECS[ctx.complexityId as ComplexityId] || COMPLEXITY_SPECS['Moderate'];
            return `[REPAIR] Image is TOO DENSE. Add breathing room. ${complexitySpec.restAreaRule}. Aim for at least 15-20% white space.`;
        },
        negativeBoost: ['dense', 'busy', 'cluttered', 'packed', 'crowded'],
        maxAttempts: 2,
        notes: 'Overly dense images are exhausting to color',
    },

    [QA_ISSUE_CODES.NO_REST_AREAS]: {
        issueCode: 'NO_REST_AREAS',
        priority: 2,
        confidence: 80,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const complexitySpec = COMPLEXITY_SPECS[ctx.complexityId as ComplexityId] || COMPLEXITY_SPECS['Moderate'];
            return `[REPAIR] MUST INCLUDE REST AREAS. ${complexitySpec.restAreaRule}. At least 15% of canvas should be clear white space.`;
        },
        negativeBoost: ['dense', 'busy', 'no breathing room'],
        maxAttempts: 2,
        notes: 'Rest areas prevent colorist fatigue',
    },

    [QA_ISSUE_CODES.INSUFFICIENT_REST_AREAS]: {
        issueCode: 'INSUFFICIENT_REST_AREAS',
        priority: 3,
        confidence: 75,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const complexitySpec = COMPLEXITY_SPECS[ctx.complexityId as ComplexityId] || COMPLEXITY_SPECS['Moderate'];
            return `[REPAIR] Need MORE rest areas. ${complexitySpec.restAreaRule}`;
        },
        negativeBoost: ['dense', 'busy'],
        maxAttempts: 2,
        notes: 'Minor composition issue',
    },

    [QA_ISSUE_CODES.COMPOSITION_IMBALANCED]: {
        issueCode: 'COMPOSITION_IMBALANCED',
        priority: 4,
        confidence: 60,
        action: 'modify_prompt',
        promptOverride: `[MINOR] Distribute visual weight more evenly across the canvas.`,
        negativeBoost: ['unbalanced', 'lopsided'],
        maxAttempts: 1,
        notes: 'Minor - may accept with warning',
    },

    [QA_ISSUE_CODES.SUBJECT_CROPPED]: {
        issueCode: 'SUBJECT_CROPPED',
        priority: 3,
        confidence: 70,
        action: 'regenerate',
        promptOverride: `[REPAIR] Keep main subject fully within canvas bounds. Leave at least 10% margin on all edges.`,
        negativeBoost: ['cropped', 'cut off'],
        maxAttempts: 2,
        notes: 'Cropping can lose important elements',
    },

    // ─── FORMAT VIOLATIONS ────────────────────────────────────────────────────────
    [QA_ISSUE_CODES.MOCKUP_FORMAT_DETECTED]: {
        issueCode: 'MOCKUP_FORMAT_DETECTED',
        priority: 1,
        confidence: 95,
        action: 'regenerate',
        promptOverride: `[CRITICAL] OUTPUT MUST BE THE ILLUSTRATION ITSELF, NOT A MOCKUP. NO paper on table, NO desk visible, NO art supplies. Output = the line art filling the entire canvas. This is NOT a product photo.`,
        negativeBoost: ['mockup', 'product shot', 'paper on table', 'art supplies', 'desk', 'staged', 'photo of'],
        parameterSuggestions: { temperature: 0.7 },
        maxAttempts: 3,
        notes: 'Mockup format is completely wrong output',
    },

    [QA_ISSUE_CODES.MULTIPLE_IMAGES_DETECTED]: {
        issueCode: 'MULTIPLE_IMAGES_DETECTED',
        priority: 1,
        confidence: 95,
        action: 'regenerate',
        promptOverride: `[CRITICAL] OUTPUT MUST BE A SINGLE ILLUSTRATION. ONE image only. NO grid, NO collage, NO multiple panels. Fill the entire canvas with ONE cohesive illustration.`,
        negativeBoost: ['multiple images', 'grid', 'collage', 'panels', 'collection', 'series'],
        maxAttempts: 3,
        notes: 'Multiple images indicate prompt misunderstanding',
    },

    [QA_ISSUE_CODES.CONTAINS_FRAME_BORDER]: {
        issueCode: 'CONTAINS_FRAME_BORDER',
        priority: 4,
        confidence: 70,
        action: 'modify_prompt',
        promptOverride: `[MINOR] Do not include decorative frame or border unless specifically requested.`,
        negativeBoost: ['frame', 'border'],
        maxAttempts: 1,
        notes: 'Minor - may accept if frame is simple',
    },

    [QA_ISSUE_CODES.CONTAINS_TEXT]: {
        issueCode: 'CONTAINS_TEXT',
        priority: 2,
        confidence: 85,
        action: 'regenerate',
        promptOverride: `[REPAIR] NO TEXT in the image unless specifically requested. NO words, letters, numbers, signs, or labels.`,
        negativeBoost: ['text', 'words', 'letters', 'writing', 'labels'],
        maxAttempts: 2,
        notes: 'Text often renders poorly',
    },

    [QA_ISSUE_CODES.PHOTO_REALISTIC]: {
        issueCode: 'PHOTO_REALISTIC',
        priority: 1,
        confidence: 90,
        action: 'regenerate',
        promptOverride: `[CRITICAL] OUTPUT MUST BE LINE ART, NOT PHOTOREALISTIC. Black outlines on white background. Coloring book style.`,
        negativeBoost: ['photorealistic', 'realistic', 'photograph', '3d render'],
        maxAttempts: 3,
        notes: 'Completely wrong output type',
    },

    // ─── STYLE VIOLATIONS ─────────────────────────────────────────────────────────
    [QA_ISSUE_CODES.STYLE_MISMATCH]: {
        issueCode: 'STYLE_MISMATCH',
        priority: 2,
        confidence: 70,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const styleSpec = STYLE_SPECS[ctx.styleId as StyleId] || STYLE_SPECS['Cozy Hand-Drawn'];
            return `[REPAIR] Style mismatch. Must match: ${ctx.styleId}. ${styleSpec.positiveDescription}`;
        },
        negativeBoost: [],
        maxAttempts: 2,
        notes: 'Style enforcement needed',
    },

    [QA_ISSUE_CODES.LINE_WEIGHT_WRONG]: {
        issueCode: 'LINE_WEIGHT_WRONG',
        priority: 2,
        confidence: 75,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const styleSpec = STYLE_SPECS[ctx.styleId as StyleId] || STYLE_SPECS['Cozy Hand-Drawn'];
            return `[REPAIR] Line weight must be: ${styleSpec.lineWeight}`;
        },
        negativeBoost: [],
        maxAttempts: 2,
        notes: 'Line weight affects colorability',
    },

    [QA_ISSUE_CODES.LINE_WEIGHT_INCONSISTENT]: {
        issueCode: 'LINE_WEIGHT_INCONSISTENT',
        priority: 3,
        confidence: 70,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const styleSpec = STYLE_SPECS[ctx.styleId as StyleId] || STYLE_SPECS['Cozy Hand-Drawn'];
            // v5.0 style specs don't have explicit consistency field, but lineWeight contains description
            if (styleSpec.lineWeight.includes('uniform') || styleSpec.lineWeight.includes('consistent')) {
                return `[REPAIR] This style requires UNIFORM line weight: ${styleSpec.lineWeight}. NO variation.`;
            }
            return '';
        },
        negativeBoost: ['variable line weight', 'inconsistent lines'],
        maxAttempts: 2,
        notes: 'Some styles require uniform lines',
    },

    [QA_ISSUE_CODES.CURVES_IN_GEOMETRIC]: {
        issueCode: 'CURVES_IN_GEOMETRIC',
        priority: 1,
        confidence: 95,
        action: 'regenerate',
        promptOverride: `[CRITICAL] GEOMETRIC STYLE REQUIRES STRAIGHT LINES ONLY. ZERO curves, ZERO rounded corners, ZERO arcs. Every line must be perfectly straight.`,
        negativeBoost: ['curves', 'curved', 'round', 'rounded', 'circular', 'arc', 'organic'],
        parameterSuggestions: { temperature: 0.4 },
        maxAttempts: 3,
        notes: 'Geometric is strict - curves are failure',
    },

    [QA_ISSUE_CODES.SHARP_ANGLES_IN_KAWAII]: {
        issueCode: 'SHARP_ANGLES_IN_KAWAII',
        priority: 2,
        confidence: 80,
        action: 'regenerate',
        promptOverride: `[REPAIR] KAWAII STYLE REQUIRES ALL ROUNDED CORNERS. Every corner must have minimum 2mm radius. NO sharp points.`,
        negativeBoost: ['sharp', 'angular', 'pointed', 'hard edges'],
        maxAttempts: 2,
        notes: 'Kawaii requires softness',
    },

    [QA_ISSUE_CODES.THIN_LINES_IN_BOLD]: {
        issueCode: 'THIN_LINES_IN_BOLD',
        priority: 1,
        confidence: 85,
        action: 'regenerate',
        promptOverride: `[CRITICAL] BOLD & EASY REQUIRES THICK 4mm LINES MINIMUM. NO thin lines, NO fine details.`,
        negativeBoost: ['thin lines', 'fine lines', 'delicate', 'detailed', 'intricate'],
        parameterSuggestions: { complexityId: 'Very Simple' },
        maxAttempts: 3,
        notes: 'Bold & Easy is for simple coloring',
    },

    // ─── COMPLEXITY VIOLATIONS ────────────────────────────────────────────────────
    [QA_ISSUE_CODES.TOO_COMPLEX]: {
        issueCode: 'TOO_COMPLEX',
        priority: 2,
        confidence: 75,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const complexitySpec = COMPLEXITY_SPECS[ctx.complexityId as ComplexityId] || COMPLEXITY_SPECS['Moderate'];
            return `[REPAIR] Image is too complex. Target: ${ctx.complexityId} (${complexitySpec.regionRange}). Simplify.`;
        },
        negativeBoost: ['complex', 'intricate', 'detailed', 'busy'],
        parameterSuggestions: { temperature: 0.6 },
        maxAttempts: 2,
        notes: 'May need complexity downgrade',
    },

    [QA_ISSUE_CODES.TOO_SIMPLE]: {
        issueCode: 'TOO_SIMPLE',
        priority: 4,
        confidence: 60,
        action: 'modify_prompt',
        promptOverride: (ctx) => {
            const complexitySpec = COMPLEXITY_SPECS[ctx.complexityId as ComplexityId] || COMPLEXITY_SPECS['Moderate'];
            return `[MINOR] Image is simpler than requested. Target: ${ctx.complexityId} (${complexitySpec.regionRange}).`;
        },
        negativeBoost: [],
        maxAttempts: 1,
        notes: 'Minor - simpler is often acceptable',
    },

    [QA_ISSUE_CODES.REGION_COUNT_EXCEEDED]: {
        issueCode: 'REGION_COUNT_EXCEEDED',
        priority: 2,
        confidence: 70,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const complexitySpec = COMPLEXITY_SPECS[ctx.complexityId as ComplexityId] || COMPLEXITY_SPECS['Moderate'];
            return `[REPAIR] Too many regions. Target for ${ctx.complexityId}: ${complexitySpec.regionRange}. Merge small regions.`;
        },
        negativeBoost: ['detailed', 'intricate', 'many regions'],
        maxAttempts: 2,
        notes: 'Too many regions = too complex',
    },

    [QA_ISSUE_CODES.REGION_COUNT_INSUFFICIENT]: {
        issueCode: 'REGION_COUNT_INSUFFICIENT',
        priority: 4,
        confidence: 60,
        action: 'modify_prompt',
        promptOverride: (ctx) => {
            const complexitySpec = COMPLEXITY_SPECS[ctx.complexityId as ComplexityId] || COMPLEXITY_SPECS['Moderate'];
            return `[MINOR] Too few regions. Target for ${ctx.complexityId}: ${complexitySpec.regionRange}.`;
        },
        negativeBoost: [],
        maxAttempts: 1,
        notes: 'Minor - fewer regions often acceptable',
    },

    // ─── AUDIENCE VIOLATIONS ──────────────────────────────────────────────────────
    [QA_ISSUE_CODES.INAPPROPRIATE_CONTENT]: {
        issueCode: 'INAPPROPRIATE_CONTENT',
        priority: 1,
        confidence: 95,
        action: 'regenerate',
        promptOverride: (ctx) => {
            const audienceSpec = AUDIENCE_SPECS[ctx.audienceId as AudienceId] || AUDIENCE_SPECS['adults'];
            return `[CRITICAL] Content not suitable for ${ctx.audienceId}. Content guidance: ${audienceSpec.contentGuidance}`;
        },
        negativeBoost: ['inappropriate', 'mature', 'adult content'],
        maxAttempts: 3,
        notes: 'Audience safety is critical',
    },

    [QA_ISSUE_CODES.SCARY_FOR_YOUNG]: {
        issueCode: 'SCARY_FOR_YOUNG',
        priority: 1,
        confidence: 90,
        action: 'regenerate',
        promptOverride: `[CRITICAL] Content may frighten young children. Remove teeth, fangs, claws, angry expressions, fire, weapons. Make everything FRIENDLY and CUTE.`,
        negativeBoost: ['scary', 'frightening', 'teeth', 'fangs', 'claws', 'angry', 'threatening'],
        parameterSuggestions: { styleId: 'Kawaii' },
        maxAttempts: 3,
        notes: 'Young audience safety is paramount',
    },

    [QA_ISSUE_CODES.TOO_COMPLEX_FOR_AUDIENCE]: {
        issueCode: 'TOO_COMPLEX_FOR_AUDIENCE',
        priority: 2,
        confidence: 80,
        action: 'modify_params',
        promptOverride: (ctx) => {
            const audienceSpec = AUDIENCE_SPECS[ctx.audienceId as AudienceId] || AUDIENCE_SPECS['adults'];
            return `[REPAIR] Complexity exceeds max for ${ctx.audienceId}: ${audienceSpec.maxComplexity}. Simplify.`;
        },
        negativeBoost: ['complex', 'intricate', 'detailed'],
        parameterSuggestions: { complexityId: 'Simple' },
        maxAttempts: 2,
        notes: 'Auto-downgrade complexity',
    },

    // ─── TECHNICAL ISSUES ─────────────────────────────────────────────────────────
    [QA_ISSUE_CODES.LOW_RESOLUTION]: {
        issueCode: 'LOW_RESOLUTION',
        priority: 3,
        confidence: 70,
        action: 'accept',
        promptOverride: '',
        negativeBoost: [],
        maxAttempts: 1,
        notes: 'Resolution is API limitation',
    },

    [QA_ISSUE_CODES.ARTIFACTS_PRESENT]: {
        issueCode: 'ARTIFACTS_PRESENT',
        priority: 4,
        confidence: 60,
        action: 'accept',
        promptOverride: '',
        negativeBoost: ['artifacts', 'noise'],
        maxAttempts: 1,
        notes: 'Minor artifacts may be acceptable',
    },

    [QA_ISSUE_CODES.BLURRY_LINES]: {
        issueCode: 'BLURRY_LINES',
        priority: 3,
        confidence: 70,
        action: 'regenerate',
        promptOverride: `[REPAIR] Lines must be crisp and sharp. NO soft or blurry lines.`,
        negativeBoost: ['blurry', 'soft', 'fuzzy', 'out of focus'],
        maxAttempts: 2,
        notes: 'Blurry lines affect print quality',
    },

    [QA_ISSUE_CODES.ANTI_ALIASING_GREY]: {
        issueCode: 'ANTI_ALIASING_GREY',
        priority: 5,
        confidence: 50,
        action: 'accept',
        promptOverride: '',
        negativeBoost: [],
        maxAttempts: 1,
        notes: 'Minor anti-aliasing is acceptable',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPAIR PLAN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const generateRepairPlan = (
    issues: QaIssue[],
    context: RepairContext
): RepairPlan => {
    const repairId = `repair_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const actions: RepairAction[] = [];
    const promptOverrides: string[] = [];
    const negativeBoosts: string[] = [];
    const parameterReasons: string[] = [];
    let parameterSuggestions: Partial<RepairParameters> = {};
    const unreparableIssues: QaIssue[] = [];

    for (const issue of issues) {
        const strategy = REPAIR_STRATEGIES[issue.code];
        if (!strategy) {
            unreparableIssues.push(issue);
            continue;
        }

        const previousAttempts = context.previousIssues.filter(i => i === issue.code).length;
        if (previousAttempts >= strategy.maxAttempts) {
            unreparableIssues.push(issue);
            continue;
        }

        const promptOverride = typeof strategy.promptOverride === 'function'
            ? strategy.promptOverride(context)
            : strategy.promptOverride;

        if (promptOverride) {
            promptOverrides.push(promptOverride);
        }

        negativeBoosts.push(...strategy.negativeBoost);

        if (strategy.parameterSuggestions) {
            Object.assign(parameterSuggestions, strategy.parameterSuggestions);
            parameterReasons.push(`${issue.code}: ${strategy.notes}`);
        }

        actions.push({
            issueCode: issue.code,
            priority: strategy.priority,
            confidence: strategy.confidence * (issue.confidence || 1),
            action: strategy.action,
            promptOverride,
            negativeBoosts: strategy.negativeBoost,
            parameterSuggestions: strategy.parameterSuggestions,
            notes: strategy.notes,
        });
    }

    actions.sort((a, b) => a.priority - b.priority);
    const uniqueNegativeBoosts = [...new Set(negativeBoosts)];
    const overallConfidence = actions.length > 0
        ? Math.round(actions.reduce((sum, a) => sum + a.confidence, 0) / actions.length)
        : 0;
    const shouldRegenerate = actions.some(a => a.action === 'regenerate' || a.action === 'modify_prompt');
    const canAutoRepair = unreparableIssues.length === 0 && actions.length > 0;

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const majorCount = issues.filter(i => i.severity === 'major').length;
    const summary = `Attempt ${context.attemptNumber + 1}/3: ${criticalCount} critical, ${majorCount} major issues. ${canAutoRepair ? 'Auto-repair possible.' : 'Manual review needed.'}`;

    return {
        repairId,
        canAutoRepair,
        shouldRegenerate,
        overallConfidence,
        actions,
        promptOverrides,
        negativeBoosts: uniqueNegativeBoosts,
        parameterSuggestions: { ...parameterSuggestions, reasons: parameterReasons },
        unreparableIssues,
        summary,
        attemptNumber: context.attemptNumber + 1,
        maxAttempts: 3,
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// APPLY REPAIR PLAN
// ═══════════════════════════════════════════════════════════════════════════════

export const applyRepairPlan = (
    repairPlan: RepairPlan,
    originalPrompt: string,
    originalNegativePrompt: string,
    originalParameters: RepairParameters
): AppliedRepairs => {
    const changesSummary: string[] = [];

    const repairInstructions = repairPlan.promptOverrides.join('\n\n');
    const modifiedPrompt = repairInstructions
        ? `${repairInstructions}\n\n═══════════════════════════════════════════════════════════════════════════════\nORIGINAL REQUEST:\n═══════════════════════════════════════════════════════════════════════════════\n\n${originalPrompt}`
        : originalPrompt;

    if (repairInstructions) {
        changesSummary.push(`Added ${repairPlan.promptOverrides.length} repair instruction(s)`);
    }

    const modifiedNegativePrompt = repairPlan.negativeBoosts.length > 0
        ? `${originalNegativePrompt}, ${repairPlan.negativeBoosts.join(', ')}`
        : originalNegativePrompt;

    if (repairPlan.negativeBoosts.length > 0) {
        changesSummary.push(`Added ${repairPlan.negativeBoosts.length} negative terms`);
    }

    const modifiedParameters: Partial<RepairParameters> = { ...originalParameters };

    if (repairPlan.parameterSuggestions.styleId &&
        repairPlan.parameterSuggestions.styleId !== originalParameters.styleId) {
        modifiedParameters.styleId = repairPlan.parameterSuggestions.styleId;
        changesSummary.push(`Style: ${originalParameters.styleId} → ${repairPlan.parameterSuggestions.styleId}`);
    }

    if (repairPlan.parameterSuggestions.complexityId &&
        repairPlan.parameterSuggestions.complexityId !== originalParameters.complexityId) {
        modifiedParameters.complexityId = repairPlan.parameterSuggestions.complexityId;
        changesSummary.push(`Complexity: ${originalParameters.complexityId} → ${repairPlan.parameterSuggestions.complexityId}`);
    }

    if (repairPlan.parameterSuggestions.temperature &&
        repairPlan.parameterSuggestions.temperature !== originalParameters.temperature) {
        modifiedParameters.temperature = repairPlan.parameterSuggestions.temperature;
        changesSummary.push(`Temperature: ${originalParameters.temperature} → ${repairPlan.parameterSuggestions.temperature}`);
    }

    return { modifiedPrompt, modifiedNegativePrompt, modifiedParameters, changesSummary };
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { REPAIR_STRATEGIES };
