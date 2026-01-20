/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QA SERVICE v2.1 — Enhanced Detection
 * Paint-by-Numbers SaaS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PATCH NOTES (v2.1):
 * - Added GREY_TONES_DETECTED issue code with specific detection
 * - Added STIPPLING_DETECTED issue code
 * - Added HATCHING_DETECTED issue code  
 * - Added TEXTURE_MARKS_DETECTED issue code
 * - Added UNCLOSED_WATER_REGIONS issue code
 * - Added HORROR_VACUI (no rest areas) issue code
 * - Added MOCKUP_FORMAT_DETECTED issue code
 * - Added MULTIPLE_IMAGES_DETECTED issue code
 * - Added DECORATIVE_TEXTURE_LINES issue code
 * - Enhanced visual analysis prompts for AI detection
 * - Added severity escalation for texture violations
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_TEXT_MODEL, STYLE_SPECS, COMPLEXITY_SPECS, AUDIENCE_SPECS, StyleId, ComplexityId, AudienceId } from './gemini-client';

// ═══════════════════════════════════════════════════════════════════════════════
// ISSUE CODE DEFINITIONS (v2.1 - Expanded)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All possible QA issue codes
 * Organized by category for clarity
 */
export const QA_ISSUE_CODES = {
    // ─────────────────────────────────────────────────────────────────────────────
    // COLOR & TONE VIOLATIONS (Severity: CRITICAL)
    // ─────────────────────────────────────────────────────────────────────────────
    COLOR_DETECTED: 'COLOR_DETECTED',
    GREY_TONES_DETECTED: 'GREY_TONES_DETECTED',
    GRADIENT_DETECTED: 'GRADIENT_DETECTED',
    SHADING_DETECTED: 'SHADING_DETECTED',

    // ─────────────────────────────────────────────────────────────────────────────
    // TEXTURE VIOLATIONS (Severity: CRITICAL)
    // ─────────────────────────────────────────────────────────────────────────────
    STIPPLING_DETECTED: 'STIPPLING_DETECTED',
    HATCHING_DETECTED: 'HATCHING_DETECTED',
    CROSSHATCHING_DETECTED: 'CROSSHATCHING_DETECTED',
    TEXTURE_MARKS_DETECTED: 'TEXTURE_MARKS_DETECTED',
    DECORATIVE_TEXTURE_LINES: 'DECORATIVE_TEXTURE_LINES',

    // ─────────────────────────────────────────────────────────────────────────────
    // REGION VIOLATIONS (Severity: CRITICAL)
    // ─────────────────────────────────────────────────────────────────────────────
    UNCLOSED_REGIONS: 'UNCLOSED_REGIONS',
    UNCLOSED_WATER_REGIONS: 'UNCLOSED_WATER_REGIONS',
    UNCLOSED_HAIR_STRANDS: 'UNCLOSED_HAIR_STRANDS',
    REGIONS_TOO_SMALL: 'REGIONS_TOO_SMALL',
    SOLID_BLACK_FILLS: 'SOLID_BLACK_FILLS',

    // ─────────────────────────────────────────────────────────────────────────────
    // COMPOSITION VIOLATIONS (Severity: MAJOR)
    // ─────────────────────────────────────────────────────────────────────────────
    HORROR_VACUI: 'HORROR_VACUI',
    NO_REST_AREAS: 'NO_REST_AREAS',
    INSUFFICIENT_REST_AREAS: 'INSUFFICIENT_REST_AREAS',
    COMPOSITION_IMBALANCED: 'COMPOSITION_IMBALANCED',
    SUBJECT_CROPPED: 'SUBJECT_CROPPED',

    // ─────────────────────────────────────────────────────────────────────────────
    // FORMAT VIOLATIONS (Severity: CRITICAL)
    // ─────────────────────────────────────────────────────────────────────────────
    MOCKUP_FORMAT_DETECTED: 'MOCKUP_FORMAT_DETECTED',
    MULTIPLE_IMAGES_DETECTED: 'MULTIPLE_IMAGES_DETECTED',
    CONTAINS_FRAME_BORDER: 'CONTAINS_FRAME_BORDER',
    CONTAINS_TEXT: 'CONTAINS_TEXT',
    PHOTO_REALISTIC: 'PHOTO_REALISTIC',

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE VIOLATIONS (Severity: MAJOR)
    // ─────────────────────────────────────────────────────────────────────────────
    STYLE_MISMATCH: 'STYLE_MISMATCH',
    LINE_WEIGHT_WRONG: 'LINE_WEIGHT_WRONG',
    LINE_WEIGHT_INCONSISTENT: 'LINE_WEIGHT_INCONSISTENT',
    CURVES_IN_GEOMETRIC: 'CURVES_IN_GEOMETRIC',
    SHARP_ANGLES_IN_KAWAII: 'SHARP_ANGLES_IN_KAWAII',
    THIN_LINES_IN_BOLD: 'THIN_LINES_IN_BOLD',

    // ─────────────────────────────────────────────────────────────────────────────
    // COMPLEXITY VIOLATIONS (Severity: MAJOR)
    // ─────────────────────────────────────────────────────────────────────────────
    TOO_COMPLEX: 'TOO_COMPLEX',
    TOO_SIMPLE: 'TOO_SIMPLE',
    REGION_COUNT_EXCEEDED: 'REGION_COUNT_EXCEEDED',
    REGION_COUNT_INSUFFICIENT: 'REGION_COUNT_INSUFFICIENT',

    // ─────────────────────────────────────────────────────────────────────────────
    // AUDIENCE VIOLATIONS (Severity: CRITICAL for young audiences)
    // ─────────────────────────────────────────────────────────────────────────────
    INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
    SCARY_FOR_YOUNG: 'SCARY_FOR_YOUNG',
    TOO_COMPLEX_FOR_AUDIENCE: 'TOO_COMPLEX_FOR_AUDIENCE',

    // ─────────────────────────────────────────────────────────────────────────────
    // TECHNICAL ISSUES (Severity: MINOR to MAJOR)
    // ─────────────────────────────────────────────────────────────────────────────
    LOW_RESOLUTION: 'LOW_RESOLUTION',
    ARTIFACTS_PRESENT: 'ARTIFACTS_PRESENT',
    BLURRY_LINES: 'BLURRY_LINES',
    ANTI_ALIASING_GREY: 'ANTI_ALIASING_GREY',
} as const;

export type QaIssueCode = typeof QA_ISSUE_CODES[keyof typeof QA_ISSUE_CODES];

// ═══════════════════════════════════════════════════════════════════════════════
// ISSUE DEFINITIONS WITH SEVERITY AND DETECTION CRITERIA
// ═══════════════════════════════════════════════════════════════════════════════

export interface IssueDefinition {
    code: QaIssueCode;
    severity: 'critical' | 'major' | 'minor';
    category: string;
    description: string;
    detectionCriteria: string;
    autoRepairable: boolean;
    repairStrategy: string;
}

export const ISSUE_DEFINITIONS: Record<QaIssueCode, IssueDefinition> = {
    // ─── COLOR & TONE ─────────────────────────────────────────────────────────────
    [QA_ISSUE_CODES.COLOR_DETECTED]: {
        code: 'COLOR_DETECTED',
        severity: 'critical',
        category: 'color',
        description: 'Non-black/white colors detected in the image',
        detectionCriteria: 'Any pixel that is not pure black (#000000) or pure white (#FFFFFF)',
        autoRepairable: true,
        repairStrategy: 'Regenerate with stronger color prohibition in prompt',
    },
    [QA_ISSUE_CODES.GREY_TONES_DETECTED]: {
        code: 'GREY_TONES_DETECTED',
        severity: 'critical',
        category: 'color',
        description: 'Grey tones or intermediate values detected',
        detectionCriteria: 'Pixels with RGB values between 20-235 that appear as grey shading, not just anti-aliasing',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit grey prohibition and stronger negative prompt',
    },
    [QA_ISSUE_CODES.GRADIENT_DETECTED]: {
        code: 'GRADIENT_DETECTED',
        severity: 'critical',
        category: 'color',
        description: 'Gradual tonal transitions or gradients detected',
        detectionCriteria: 'Areas where pixel values gradually transition from light to dark',
        autoRepairable: true,
        repairStrategy: 'Regenerate with gradient prohibition',
    },
    [QA_ISSUE_CODES.SHADING_DETECTED]: {
        code: 'SHADING_DETECTED',
        severity: 'critical',
        category: 'color',
        description: 'Light/shadow shading effects detected',
        detectionCriteria: 'Areas that appear to represent light sources or shadows through tonal variation',
        autoRepairable: true,
        repairStrategy: 'Regenerate with shading prohibition',
    },

    // ─── TEXTURE VIOLATIONS ───────────────────────────────────────────────────────
    [QA_ISSUE_CODES.STIPPLING_DETECTED]: {
        code: 'STIPPLING_DETECTED',
        severity: 'critical',
        category: 'texture',
        description: 'Dot-based stippling texture detected',
        detectionCriteria: 'Clusters of small dots used to create tonal effects or texture',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit stippling prohibition in both prompt and negative',
    },
    [QA_ISSUE_CODES.HATCHING_DETECTED]: {
        code: 'HATCHING_DETECTED',
        severity: 'critical',
        category: 'texture',
        description: 'Parallel line hatching detected',
        detectionCriteria: 'Sets of parallel lines used to create shading or texture effects',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit hatching prohibition',
    },
    [QA_ISSUE_CODES.CROSSHATCHING_DETECTED]: {
        code: 'CROSSHATCHING_DETECTED',
        severity: 'critical',
        category: 'texture',
        description: 'Cross-hatching pattern detected',
        detectionCriteria: 'Intersecting sets of parallel lines creating grid-like shading',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit cross-hatching prohibition',
    },
    [QA_ISSUE_CODES.TEXTURE_MARKS_DETECTED]: {
        code: 'TEXTURE_MARKS_DETECTED',
        severity: 'critical',
        category: 'texture',
        description: 'Decorative texture marks that don\'t enclose regions',
        detectionCriteria: 'Lines or marks that represent texture (fur, fabric, wood grain) but don\'t create closed colorable regions',
        autoRepairable: true,
        repairStrategy: 'Regenerate with instruction to represent texture through outlined shapes only',
    },
    [QA_ISSUE_CODES.DECORATIVE_TEXTURE_LINES]: {
        code: 'DECORATIVE_TEXTURE_LINES',
        severity: 'critical',
        category: 'texture',
        description: 'Decorative lines on surfaces (knit patterns, fur strokes, wood grain)',
        detectionCriteria: 'Lines on fabric, fur, or surfaces that are decorative rather than structural',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit instruction: knit=outlined shapes, fur=sections, wood=planks',
    },

    // ─── REGION VIOLATIONS ────────────────────────────────────────────────────────
    [QA_ISSUE_CODES.UNCLOSED_REGIONS]: {
        code: 'UNCLOSED_REGIONS',
        severity: 'critical',
        category: 'regions',
        description: 'Regions that are not fully enclosed (would leak paint)',
        detectionCriteria: 'Line endpoints that don\'t connect, gaps in outlines',
        autoRepairable: true,
        repairStrategy: 'Regenerate with stronger closed-region requirement',
    },
    [QA_ISSUE_CODES.UNCLOSED_WATER_REGIONS]: {
        code: 'UNCLOSED_WATER_REGIONS',
        severity: 'critical',
        category: 'regions',
        description: 'Water/waves rendered as wavy lines instead of enclosed shapes',
        detectionCriteria: 'Water depicted as decorative wavy lines rather than enclosed wave shapes',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit instruction: water must be enclosed wave SHAPES',
    },
    [QA_ISSUE_CODES.UNCLOSED_HAIR_STRANDS]: {
        code: 'UNCLOSED_HAIR_STRANDS',
        severity: 'critical',
        category: 'regions',
        description: 'Hair rendered as individual strands instead of enclosed sections',
        detectionCriteria: 'Hair depicted as many individual lines rather than grouped enclosed sections',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit instruction: hair must be enclosed SECTIONS',
    },
    [QA_ISSUE_CODES.REGIONS_TOO_SMALL]: {
        code: 'REGIONS_TOO_SMALL',
        severity: 'major',
        category: 'regions',
        description: 'Colorable regions smaller than minimum size',
        detectionCriteria: 'Enclosed regions smaller than specified minimum (typically 3-5mm)',
        autoRepairable: true,
        repairStrategy: 'Regenerate with simpler complexity or suggest complexity downgrade',
    },
    [QA_ISSUE_CODES.SOLID_BLACK_FILLS]: {
        code: 'SOLID_BLACK_FILLS',
        severity: 'critical',
        category: 'regions',
        description: 'Areas filled with solid black instead of outlined',
        detectionCriteria: 'Large areas of solid black (not just thick lines)',
        autoRepairable: true,
        repairStrategy: 'Regenerate with instruction that ALL areas must be outlined, not filled',
    },

    // ─── COMPOSITION VIOLATIONS ───────────────────────────────────────────────────
    [QA_ISSUE_CODES.HORROR_VACUI]: {
        code: 'HORROR_VACUI',
        severity: 'major',
        category: 'composition',
        description: 'Fear of empty space - entire canvas filled with detail',
        detectionCriteria: 'Less than 10% white space, no clear rest areas for the eye',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit rest area requirement',
    },
    [QA_ISSUE_CODES.NO_REST_AREAS]: {
        code: 'NO_REST_AREAS',
        severity: 'major',
        category: 'composition',
        description: 'No clear white space rest areas for visual comfort',
        detectionCriteria: 'No distinct areas of undetailed white space',
        autoRepairable: true,
        repairStrategy: 'Regenerate with mandatory rest area count based on complexity',
    },
    [QA_ISSUE_CODES.INSUFFICIENT_REST_AREAS]: {
        code: 'INSUFFICIENT_REST_AREAS',
        severity: 'major',
        category: 'composition',
        description: 'Rest areas present but fewer than required for complexity level',
        detectionCriteria: 'Rest area count below complexity specification',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit rest area count requirement',
    },
    [QA_ISSUE_CODES.COMPOSITION_IMBALANCED]: {
        code: 'COMPOSITION_IMBALANCED',
        severity: 'minor',
        category: 'composition',
        description: 'Visual weight unevenly distributed',
        detectionCriteria: 'One quadrant significantly more detailed than others',
        autoRepairable: false,
        repairStrategy: 'Suggest recomposition or accept with warning',
    },
    [QA_ISSUE_CODES.SUBJECT_CROPPED]: {
        code: 'SUBJECT_CROPPED',
        severity: 'minor',
        category: 'composition',
        description: 'Main subject extends beyond canvas edges',
        detectionCriteria: 'Key elements cut off at canvas boundary',
        autoRepairable: true,
        repairStrategy: 'Regenerate with centering instruction and margin requirement',
    },

    // ─── FORMAT VIOLATIONS ────────────────────────────────────────────────────────
    [QA_ISSUE_CODES.MOCKUP_FORMAT_DETECTED]: {
        code: 'MOCKUP_FORMAT_DETECTED',
        severity: 'critical',
        category: 'format',
        description: 'Image shows mockup presentation (paper on table, art supplies visible)',
        detectionCriteria: 'Image depicts the coloring page as a photo/mockup rather than the illustration itself',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit instruction: output single illustration, NO mockup',
    },
    [QA_ISSUE_CODES.MULTIPLE_IMAGES_DETECTED]: {
        code: 'MULTIPLE_IMAGES_DETECTED',
        severity: 'critical',
        category: 'format',
        description: 'Output contains multiple separate images/panels',
        detectionCriteria: 'Image shows a grid, collage, or multiple separate illustrations',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit instruction: SINGLE illustration only',
    },
    [QA_ISSUE_CODES.CONTAINS_FRAME_BORDER]: {
        code: 'CONTAINS_FRAME_BORDER',
        severity: 'minor',
        category: 'format',
        description: 'Image contains decorative frame or border (unless requested)',
        detectionCriteria: 'Decorative frame element around the illustration',
        autoRepairable: true,
        repairStrategy: 'Regenerate without frame or accept if minor',
    },
    [QA_ISSUE_CODES.CONTAINS_TEXT]: {
        code: 'CONTAINS_TEXT',
        severity: 'major',
        category: 'format',
        description: 'Image contains text when none was requested',
        detectionCriteria: 'Visible text, letters, or words in the image',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit no-text instruction',
    },
    [QA_ISSUE_CODES.PHOTO_REALISTIC]: {
        code: 'PHOTO_REALISTIC',
        severity: 'critical',
        category: 'format',
        description: 'Output is photorealistic rather than line art',
        detectionCriteria: 'Image appears to be a photograph or photorealistic render',
        autoRepairable: true,
        repairStrategy: 'Regenerate with stronger line art style enforcement',
    },

    // ─── STYLE VIOLATIONS ─────────────────────────────────────────────────────────
    [QA_ISSUE_CODES.STYLE_MISMATCH]: {
        code: 'STYLE_MISMATCH',
        severity: 'major',
        category: 'style',
        description: 'Output style doesn\'t match requested style',
        detectionCriteria: 'Visual characteristics don\'t align with style specification',
        autoRepairable: true,
        repairStrategy: 'Regenerate with stronger style enforcement',
    },
    [QA_ISSUE_CODES.LINE_WEIGHT_WRONG]: {
        code: 'LINE_WEIGHT_WRONG',
        severity: 'major',
        category: 'style',
        description: 'Line weight doesn\'t match style specification',
        detectionCriteria: 'Lines significantly thicker or thinner than specified',
        autoRepairable: true,
        repairStrategy: 'Regenerate with explicit line weight in prompt',
    },
    [QA_ISSUE_CODES.LINE_WEIGHT_INCONSISTENT]: {
        code: 'LINE_WEIGHT_INCONSISTENT',
        severity: 'major',
        category: 'style',
        description: 'Line weight varies when it should be uniform',
        detectionCriteria: 'Significant variation in line thickness for styles requiring uniformity',
        autoRepairable: true,
        repairStrategy: 'Regenerate with uniform line weight instruction',
    },
    [QA_ISSUE_CODES.CURVES_IN_GEOMETRIC]: {
        code: 'CURVES_IN_GEOMETRIC',
        severity: 'critical',
        category: 'style',
        description: 'Curved lines present in Geometric style (requires straight lines only)',
        detectionCriteria: 'Any curved lines in an image specified as Geometric style',
        autoRepairable: true,
        repairStrategy: 'Regenerate with absolute curve prohibition, lower temperature',
    },
    [QA_ISSUE_CODES.SHARP_ANGLES_IN_KAWAII]: {
        code: 'SHARP_ANGLES_IN_KAWAII',
        severity: 'major',
        category: 'style',
        description: 'Sharp angles present in Kawaii style (requires rounded corners)',
        detectionCriteria: 'Corners with radius less than 2mm in Kawaii style',
        autoRepairable: true,
        repairStrategy: 'Regenerate with rounded corner enforcement',
    },
    [QA_ISSUE_CODES.THIN_LINES_IN_BOLD]: {
        code: 'THIN_LINES_IN_BOLD',
        severity: 'major',
        category: 'style',
        description: 'Thin lines present in Hand Drawn Bold & Easy style',
        detectionCriteria: 'Lines thinner than 4mm in Hand Drawn Bold & Easy style',
        autoRepairable: true,
        repairStrategy: 'Regenerate with minimum line weight enforcement',
    },

    // ─── COMPLEXITY VIOLATIONS ────────────────────────────────────────────────────
    [QA_ISSUE_CODES.TOO_COMPLEX]: {
        code: 'TOO_COMPLEX',
        severity: 'major',
        category: 'complexity',
        description: 'Image more complex than specified complexity level',
        detectionCriteria: 'Region count or detail level exceeds specification',
        autoRepairable: true,
        repairStrategy: 'Regenerate with complexity enforcement or suggest simpler setting',
    },
    [QA_ISSUE_CODES.TOO_SIMPLE]: {
        code: 'TOO_SIMPLE',
        severity: 'minor',
        category: 'complexity',
        description: 'Image simpler than specified complexity level',
        detectionCriteria: 'Region count or detail level below specification',
        autoRepairable: true,
        repairStrategy: 'Regenerate with more detail instruction',
    },
    [QA_ISSUE_CODES.REGION_COUNT_EXCEEDED]: {
        code: 'REGION_COUNT_EXCEEDED',
        severity: 'major',
        category: 'complexity',
        description: 'Estimated region count exceeds maximum for complexity level',
        detectionCriteria: 'More colorable regions than complexity specification allows',
        autoRepairable: true,
        repairStrategy: 'Regenerate with region count limit in prompt',
    },
    [QA_ISSUE_CODES.REGION_COUNT_INSUFFICIENT]: {
        code: 'REGION_COUNT_INSUFFICIENT',
        severity: 'minor',
        category: 'complexity',
        description: 'Estimated region count below minimum for complexity level',
        detectionCriteria: 'Fewer colorable regions than complexity specification requires',
        autoRepairable: true,
        repairStrategy: 'Regenerate with minimum region count instruction',
    },

    // ─── AUDIENCE VIOLATIONS ──────────────────────────────────────────────────────
    [QA_ISSUE_CODES.INAPPROPRIATE_CONTENT]: {
        code: 'INAPPROPRIATE_CONTENT',
        severity: 'critical',
        category: 'audience',
        description: 'Content inappropriate for specified audience',
        detectionCriteria: 'Content matching audience prohibition list',
        autoRepairable: true,
        repairStrategy: 'Regenerate with stronger audience content restrictions',
    },
    [QA_ISSUE_CODES.SCARY_FOR_YOUNG]: {
        code: 'SCARY_FOR_YOUNG',
        severity: 'critical',
        category: 'audience',
        description: 'Content potentially scary for young children',
        detectionCriteria: 'Scary elements (teeth, claws, angry expressions) for toddler/preschool audience',
        autoRepairable: true,
        repairStrategy: 'Regenerate with friendly/cute enforcement, switch to Kawaii style',
    },
    [QA_ISSUE_CODES.TOO_COMPLEX_FOR_AUDIENCE]: {
        code: 'TOO_COMPLEX_FOR_AUDIENCE',
        severity: 'major',
        category: 'audience',
        description: 'Complexity exceeds audience capability',
        detectionCriteria: 'Complexity level exceeds audience maximum',
        autoRepairable: true,
        repairStrategy: 'Downgrade complexity to audience maximum',
    },

    // ─── TECHNICAL ISSUES ─────────────────────────────────────────────────────────
    [QA_ISSUE_CODES.LOW_RESOLUTION]: {
        code: 'LOW_RESOLUTION',
        severity: 'major',
        category: 'technical',
        description: 'Image resolution too low for print quality',
        detectionCriteria: 'Resolution below 300 DPI at target print size',
        autoRepairable: false,
        repairStrategy: 'Request higher resolution output',
    },
    [QA_ISSUE_CODES.ARTIFACTS_PRESENT]: {
        code: 'ARTIFACTS_PRESENT',
        severity: 'minor',
        category: 'technical',
        description: 'Compression artifacts or noise present',
        detectionCriteria: 'Visible JPEG artifacts, noise, or distortion',
        autoRepairable: false,
        repairStrategy: 'Regenerate or request PNG format',
    },
    [QA_ISSUE_CODES.BLURRY_LINES]: {
        code: 'BLURRY_LINES',
        severity: 'major',
        category: 'technical',
        description: 'Line edges are blurry or soft',
        detectionCriteria: 'Lines lack crisp edges, appear out of focus',
        autoRepairable: true,
        repairStrategy: 'Regenerate with sharp line instruction',
    },
    [QA_ISSUE_CODES.ANTI_ALIASING_GREY]: {
        code: 'ANTI_ALIASING_GREY',
        severity: 'minor',
        category: 'technical',
        description: 'Excessive grey from anti-aliasing (acceptable in small amounts)',
        detectionCriteria: 'Grey pixels along line edges exceed normal anti-aliasing threshold',
        autoRepairable: false,
        repairStrategy: 'Accept for screen, flag for print post-processing',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface QaIssue {
    code: QaIssueCode;
    severity: 'critical' | 'major' | 'minor' | 'high';
    category: string;
    message: string;
    details?: string;
    location?: string;
    confidence: number;
    autoRepairable: boolean;
}

export interface QaResult {
    passed: boolean;
    score: number;
    isPublishable: boolean;
    issues: QaIssue[];
    criticalCount: number;
    majorCount: number;
    minorCount: number;
    summary: string;
    analysisTimestamp: string;
    requestId: string;
    recommendations: string[];
}

export interface QaConfig {
    mode: 'production' | 'preview';
    minimumPassScore: number;
    strictTextureCheck: boolean;
    strictColorCheck: boolean;
    checkRestAreas: boolean;
    checkMockupFormat: boolean;
}

export interface AnalyzeRequest {
    imageUrl: string;
    requestId: string;
    styleId: string;
    complexityId: string;
    audienceId: string;
    userPrompt: string;
    apiKey?: string;
    signal?: AbortSignal;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI ANALYSIS PROMPT (v2.1 - Enhanced Detection)
// ═══════════════════════════════════════════════════════════════════════════════

const buildAnalysisPrompt = (
    styleId: string,
    complexityId: string,
    audienceId: string
): string => {
    const styleSpec = STYLE_SPECS[styleId as StyleId] || STYLE_SPECS['Cozy Hand-Drawn'];
    const complexitySpec = COMPLEXITY_SPECS[complexityId as ComplexityId] || COMPLEXITY_SPECS['Moderate'];
    const audienceSpec = AUDIENCE_SPECS[audienceId as AudienceId] || AUDIENCE_SPECS['adults'];

    return `
You are an expert Quality Assurance analyst for professional coloring book production.
Your task is to analyze this image and identify ANY issues that would make it unsuitable for publication.

═══════════════════════════════════════════════════════════════════════════════
TARGET SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

STYLE: ${styleId}
- Style: ${styleSpec.styleKeyword}
- Line Weight: ${styleSpec.lineWeight}
- Requirements: ${styleSpec.visualRequirements.join(', ')}

COMPLEXITY: ${complexityId}
- Region Range: ${complexitySpec.regionRange}
- Rest Areas: ${complexitySpec.restAreaRule}

AUDIENCE: ${audienceId}
- Maximum Complexity: ${audienceSpec.maxComplexity}
- Content Guidance: ${audienceSpec.contentGuidance}

═══════════════════════════════════════════════════════════════════════════════
CRITICAL CHECKS (Must pass for publication)
═══════════════════════════════════════════════════════════════════════════════

1. COLOR CHECK:
   □ Is the image ONLY pure black lines on pure white background?
   □ Are there ANY grey tones, gradients, or shading? (FAIL if yes, code: GREY_TONES_DETECTED)
   □ Are there any colors other than black and white? (FAIL if yes, code: COLOR_DETECTED)

2. TEXTURE CHECK (NO texture allowed for coloring books):
   □ Is there STIPPLING (dots creating tonal effects)? (FAIL if yes, code: STIPPLING_DETECTED)
   □ Is there HATCHING (parallel lines for shading)? (FAIL if yes, code: HATCHING_DETECTED)
   □ Is there CROSS-HATCHING? (FAIL if yes, code: CROSSHATCHING_DETECTED)
   □ Are there decorative texture MARKS on surfaces (fur strokes, fabric lines, wood grain lines)? (FAIL if yes, code: DECORATIVE_TEXTURE_LINES)
   □ Texture should be represented by SHAPE OUTLINES only, not decorative strokes (code: TEXTURE_MARKS_DETECTED)

3. REGION CHECK:
   □ Are ALL regions CLOSED (would hold paint without leaking)? (FAIL if gaps, code: UNCLOSED_REGIONS)
   □ Is WATER/WAVES depicted as enclosed shapes or just wavy lines? (FAIL if wavy lines, code: UNCLOSED_WATER_REGIONS)
   □ Is HAIR depicted as enclosed sections or individual strands? (FAIL if strands, code: UNCLOSED_HAIR_STRANDS)
   □ Are there any SOLID BLACK FILLS (not just thick lines)? (FAIL if yes, code: SOLID_BLACK_FILLS)
   □ Are regions large enough to color?2 (FAIL if too small, code: REGIONS_TOO_SMALL)

4. COMPOSITION CHECK:
   □ Are there clear REST AREAS (white space zones)?
   □ For ${complexityId}: ${complexitySpec.restAreaRule} (FAIL if missing, code: NO_REST_AREAS or INSUFFICIENT_REST_AREAS)
   □ Is the entire canvas filled with detail (HORROR VACUI)? (FAIL if yes for Moderate or below, code: HORROR_VACUI)
   □ What percentage is white space? (Should be at least 15% for Moderate)

5. FORMAT CHECK:
   □ Is this a MOCKUP showing paper/table/art supplies? (FAIL if yes, code: MOCKUP_FORMAT_DETECTED)
   □ Does it show MULTIPLE separate images/panels? (FAIL if yes, code: MULTIPLE_IMAGES_DETECTED)
   □ Is there an unwanted FRAME or BORDER? (code: CONTAINS_FRAME_BORDER)
   □ Is there TEXT when none was requested? (code: CONTAINS_TEXT)

6. STYLE CHECK:
   □ Does line weight match specification (${styleSpec.lineWeight})? (FAIL if wrong, code: LINE_WEIGHT_WRONG)
   ${styleId === 'Geometric' ? '□ Are there ANY curved lines? (FAIL if yes, code: CURVES_IN_GEOMETRIC)' : ''}
   ${styleId === 'Kawaii' ? '□ Are all corners rounded? (FAIL if sharp angles, code: SHARP_ANGLES_IN_KAWAII)' : ''}
   ${styleId === 'Hand Drawn Bold & Easy' ? '□ Are all lines thick (4mm+)? (FAIL if thin lines, code: THIN_LINES_IN_BOLD)' : ''}

7. AUDIENCE CHECK:
   □ Is content appropriate for ${audienceId}? (FAIL if inappropriate, code: INAPPROPRIATE_CONTENT)
   □ Content guidance: ${audienceSpec.contentGuidance}
   ${audienceId === 'toddlers' || audienceId === 'preschool' ? '□ Is everything friendly and non-scary? (FAIL if scary, code: SCARY_FOR_YOUNG)' : ''}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

{
  "overallPass": true/false,
  "qualityScore": 0-100,
  "isPublishable": true/false,
  "issues": [
    {
      "code": "ISSUE_CODE",
      "severity": "critical|major|minor",
      "message": "Description of the issue",
      "details": "Specific details about where/what",
      "location": "e.g., 'cat fur', 'water area', 'top-left corner'",
      "confidence": 0.0-1.0
    }
  ],
  "positives": ["Things done well"],
  "estimatedRegionCount": number,
  "estimatedWhiteSpacePercent": number,
  "restAreaCount": number,
  "recommendations": ["Suggestions for improvement"]
}

IMPORTANT: Be STRICT. A coloring book page that cannot be colored properly is worthless.
- Any grey = FAIL
- Any stippling = FAIL (unless Botanical with sparse stippling)
- Any unclosed regions = FAIL
- No rest areas for Moderate complexity = FAIL
- Mockup format = FAIL
- Multiple images = FAIL

Analyze the image now and provide your assessment.
`.trim();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze a coloring page image for quality issues
 */
export const analyzeColoringPage = async (
    request: AnalyzeRequest,
    config: QaConfig = {
        mode: 'production',
        minimumPassScore: 70,
        strictTextureCheck: true,
        strictColorCheck: true,
        checkRestAreas: true,
        checkMockupFormat: true,
    }
): Promise<QaResult> => {
    const {
        imageUrl,
        requestId,
        styleId,
        complexityId,
        audienceId,
        userPrompt,
        apiKey,
        signal,
    } = request;

    // Check abort
    if (signal?.aborted) {
        throw new Error('Aborted');
    }

    // Validate API key
    if (!apiKey) {
        throw new Error('API key required for QA analysis');
    }

    const ai = new GoogleGenAI({ apiKey });
    const analysisPrompt = buildAnalysisPrompt(styleId, complexityId, audienceId);

    // Extract base64 from data URL if needed
    const imageData = imageUrl.startsWith('data:')
        ? imageUrl.split(',')[1]
        : imageUrl;

    const mimeType = imageUrl.startsWith('data:')
        ? imageUrl.split(';')[0].split(':')[1]
        : 'image/png';

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: {
                parts: [
                    { text: analysisPrompt },
                    {
                        inlineData: {
                            data: imageData,
                            mimeType,
                        },
                    },
                ],
            },
            config: {
                responseMimeType: 'application/json',
                temperature: 0.2, // Low temperature for consistent analysis
            },
        });

        if (signal?.aborted) {
            throw new Error('Aborted');
        }

        // Parse response
        const analysisText = response.text || '{}';
        let analysis: any;

        try {
            analysis = JSON.parse(analysisText);
        } catch (parseError) {
            console.error('Failed to parse QA response:', analysisText);
            // Return a fail-safe result
            return createFailSafeResult(requestId, 'Failed to parse QA analysis');
        }

        // Convert to QaResult format
        const issues: QaIssue[] = (analysis.issues || []).map((issue: any) => {
            const definition = ISSUE_DEFINITIONS[issue.code as QaIssueCode];
            return {
                code: issue.code,
                severity: issue.severity || definition?.severity || 'major',
                category: definition?.category || 'unknown',
                message: issue.message,
                details: issue.details,
                location: issue.location,
                confidence: issue.confidence || 0.8,
                autoRepairable: definition?.autoRepairable ?? true,
            };
        });

        // Count by severity
        const criticalCount = issues.filter(i => i.severity === 'critical').length;
        const majorCount = issues.filter(i => i.severity === 'major').length;
        const minorCount = issues.filter(i => i.severity === 'minor').length;

        // Calculate score
        const score = analysis.qualityScore ?? calculateScore(issues);

        // Determine pass/fail
        const passed = config.mode === 'preview'
            ? criticalCount === 0 && score >= 50
            : criticalCount === 0 && majorCount <= 2 && score >= config.minimumPassScore;

        const isPublishable = criticalCount === 0 && majorCount === 0 && score >= 80;

        // Build summary
        const summary = buildSummary(passed, score, criticalCount, majorCount, minorCount);

        return {
            passed,
            score,
            isPublishable,
            issues,
            criticalCount,
            majorCount,
            minorCount,
            summary,
            analysisTimestamp: new Date().toISOString(),
            requestId,
            recommendations: analysis.recommendations || [],
        };

    } catch (error: any) {
        if (error.message === 'Aborted') {
            throw error;
        }

        console.error('QA Analysis failed:', error);
        return createFailSafeResult(requestId, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate quality score from issues
 */
const calculateScore = (issues: QaIssue[]): number => {
    let score = 100;

    for (const issue of issues) {
        const penalty = issue.severity === 'critical' ? 25 : issue.severity === 'major' ? 10 : 3;
        score -= penalty * issue.confidence;
    }

    return Math.max(0, Math.round(score));
};

/**
 * Build human-readable summary
 */
const buildSummary = (
    passed: boolean,
    score: number,
    critical: number,
    major: number,
    minor: number
): string => {
    if (passed && score >= 90) {
        return `Excellent quality (${score}/100). Ready for publication.`;
    }
    if (passed && score >= 70) {
        return `Good quality (${score}/100). ${major} major and ${minor} minor issues found.`;
    }
    if (!passed && critical > 0) {
        return `Failed QA (${score}/100). ${critical} critical issue(s) must be resolved.`;
    }
    return `Below threshold (${score}/100). ${major} major issues require attention.`;
};

/**
 * Create fail-safe result when analysis fails
 */
const createFailSafeResult = (requestId: string, errorMessage: string): QaResult => ({
    passed: false,
    score: 0,
    isPublishable: false,
    issues: [{
        code: 'ARTIFACTS_PRESENT' as QaIssueCode,
        severity: 'critical',
        category: 'technical',
        message: `QA analysis failed: ${errorMessage}`,
        confidence: 1,
        autoRepairable: false,
    }],
    criticalCount: 1,
    majorCount: 0,
    minorCount: 0,
    summary: `QA analysis failed: ${errorMessage}`,
    analysisTimestamp: new Date().toISOString(),
    requestId,
    recommendations: ['Regenerate the image and retry QA'],
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK CHECK FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick check for specific issue categories
 */
export const quickCheckForTexture = async (
    imageUrl: string,
    apiKey: string
): Promise<{ hasTexture: boolean; type?: string }> => {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: {
            parts: [
                {
                    text: `Analyze this coloring book image. Does it contain ANY of the following texture techniques?
1. STIPPLING (dots creating tonal effect)
2. HATCHING (parallel lines for shading)
3. CROSS-HATCHING (intersecting parallel lines)
4. DECORATIVE TEXTURE MARKS (fur strokes, fabric lines, wood grain)

Respond with JSON: {"hasTexture": true/false, "type": "stippling|hatching|crosshatching|decorative|none", "location": "where found"}`,
                },
                {
                    inlineData: {
                        data: imageUrl.startsWith('data:') ? imageUrl.split(',')[1] : imageUrl,
                        mimeType: 'image/png',
                    },
                },
            ],
        },
        config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
        },
    });

    try {
        const result = JSON.parse(response.text || '{}');
        return { hasTexture: result.hasTexture || false, type: result.type };
    } catch {
        return { hasTexture: false };
    }
};

/**
 * Quick check for grey tones
 */
export const quickCheckForGrey = async (
    imageUrl: string,
    apiKey: string
): Promise<{ hasGrey: boolean; severity?: string }> => {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: {
            parts: [
                {
                    text: `Analyze this coloring book image. Does it contain ANY grey tones, gradients, or shading?
A proper coloring book should have ONLY pure black lines on pure white background.

Respond with JSON: {"hasGrey": true/false, "severity": "none|minor|moderate|severe", "description": "what was found"}`,
                },
                {
                    inlineData: {
                        data: imageUrl.startsWith('data:') ? imageUrl.split(',')[1] : imageUrl,
                        mimeType: 'image/png',
                    },
                },
            ],
        },
        config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
        },
    });

    try {
        const result = JSON.parse(response.text || '{}');
        return { hasGrey: result.hasGrey || false, severity: result.severity };
    } catch {
        return { hasGrey: false };
    }
};

/**
 * Quick check for mockup/multiple images
 */
export const quickCheckFormat = async (
    imageUrl: string,
    apiKey: string
): Promise<{ isMockup: boolean; isMultiple: boolean }> => {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: {
            parts: [
                {
                    text: `Analyze this image format:
1. Is this a MOCKUP showing the coloring page on a table/desk with art supplies visible?
2. Does this show MULTIPLE separate images/panels/pages in a grid or collage?

A valid output should be a SINGLE illustration filling the canvas, not a photo of paper or multiple images.

Respond with JSON: {"isMockup": true/false, "isMultiple": true/false, "description": "what was detected"}`,
                },
                {
                    inlineData: {
                        data: imageUrl.startsWith('data:') ? imageUrl.split(',')[1] : imageUrl,
                        mimeType: 'image/png',
                    },
                },
            ],
        },
        config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
        },
    });

    try {
        const result = JSON.parse(response.text || '{}');
        return { isMockup: result.isMockup || false, isMultiple: result.isMultiple || false };
    } catch {
        return { isMockup: false, isMultiple: false };
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { QA_ISSUE_CODES as ISSUE_CODES };
