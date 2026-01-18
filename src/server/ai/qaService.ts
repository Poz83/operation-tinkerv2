/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QA SERVICE v2.0 — Specification-Driven Quality Assurance
 * Paint-by-Numbers SaaS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Architecture:
 * 1. Imports validation rules directly from style/complexity/audience specs
 * 2. Generates dynamic QA prompts based on actual constraints used
 * 3. Validates against structural requirements (regions, closures, line weights)
 * 4. Correlates results with generation metadata
 * 5. Categorises issues by severity (critical/major/minor)
 *
 * Design Principles:
 * - Closed-loop validation: QA checks the SAME specs used for generation
 * - Deterministic failure criteria: no subjective judgements on spec violations
 * - Actionable feedback: every issue includes remediation guidance
 * - Configurable strictness: production vs preview modes
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { generateObject, GEMINI_TEXT_MODEL } from './gemini-client';
import { BuildPromptResult } from './prompts';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Severity levels for QA issues
 * - critical: Blocks publication, image is unusable
 * - major: Strongly recommends regeneration, significant quality issue
 * - minor: Logged for analytics, doesn't block user
 */
export type IssueSeverity = 'critical' | 'major' | 'minor';

/**
 * Structured QA issue with actionable information
 */
export interface QaIssue {
    /** Unique issue code for programmatic handling */
    code: string;
    /** Severity level */
    severity: IssueSeverity;
    /** Human-readable description */
    description: string;
    /** Specific location or element affected (if applicable) */
    location?: string;
    /** Suggested fix or regeneration parameters */
    remediation: string;
    /** Confidence score 0-100 (from AI analysis) */
    confidence: number;
}

/**
 * Rubric scores for each quality dimension
 */
export interface QaRubric {
    /** Pure black lines, no grey, no artifacts (0-100) */
    lineQuality: number;
    /** All regions closed, colourable, correct sizes (0-100) */
    regionIntegrity: number;
    /** Composition, framing, visual balance (0-100) */
    composition: number;
    /** Appropriate for target demographic (0-100) */
    audienceAlignment: number;
    /** Matches requested style characteristics (0-100) */
    styleCompliance: number;
    /** Matches requested complexity level (0-100) */
    complexityCompliance: number;
}

/**
 * Complete QA result
 */
export interface QaResult {
    /** Unique ID correlating to generation request */
    requestId: string;
    /** Overall pass/fail determination */
    passed: boolean;
    /** Overall quality score 0-100 */
    overallScore: number;
    /** Detailed rubric breakdown */
    rubric: QaRubric;
    /** All identified issues */
    issues: QaIssue[];
    /** Critical issues that block publication */
    criticalIssues: QaIssue[];
    /** Major issues that warrant user attention */
    majorIssues: QaIssue[];
    /** Minor issues logged for analytics */
    minorIssues: QaIssue[];
    /** Whether image is publishable (no critical issues) */
    isPublishable: boolean;
    /** Whether regeneration is recommended */
    shouldRegenerate: boolean;
    /** Timestamp of QA analysis */
    timestamp: string;
    /** Duration of QA analysis in ms */
    analysisDurationMs: number;
    /** Raw AI analysis (for debugging) */
    rawAnalysis?: RawAiAnalysis;
}

/**
 * Raw response from AI model (internal use)
 */
interface RawAiAnalysis {
    lineQuality: number;
    regionIntegrity: number;
    composition: number;
    audienceAlignment: number;
    styleCompliance: number;
    complexityCompliance: number;
    issues: Array<{
        code: string;
        severity: 'critical' | 'major' | 'minor';
        description: string;
        location?: string;
        confidence: number;
    }>;
    overallAssessment: string;
}

/**
 * Context required for QA analysis
 */
export interface QaContext {
    /** The generated image as data URL or base64 */
    imageUrl: string;
    /** Request ID for correlation */
    requestId: string;
    /** Style ID used for generation */
    styleId: string;
    /** Complexity ID used for generation */
    complexityId: string;
    /** Audience ID used for generation */
    audienceId: string;
    /** Original user prompt */
    userPrompt: string;
    /** Full prompt result from buildPrompt (contains resolved params) */
    promptResult?: BuildPromptResult;
    /** Optional API key override */
    apiKey?: string;
    /** Abort signal */
    signal?: AbortSignal;
    /** Enable verbose logging */
    enableLogging?: boolean;
}

/**
 * QA configuration options
 */
export interface QaConfig {
    /** Strictness mode: 'production' (strict), 'preview' (lenient) */
    mode: 'production' | 'preview';
    /** Minimum overall score to pass (default: 70) */
    minimumPassScore: number;
    /** Whether to include raw AI analysis in result */
    includeRawAnalysis: boolean;
    /** Custom issue code overrides for severity */
    severityOverrides?: Record<string, IssueSeverity>;
}

const DEFAULT_CONFIG: QaConfig = {
    mode: 'production',
    minimumPassScore: 70,
    includeRawAnalysis: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE SPECIFICATIONS (Imported from prompts-v4 logic)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Style-specific validation rules
 * These MUST match the specifications in prompts-v4.ts
 */
const STYLE_VALIDATION_RULES: Record<string, {
    minRegionMm: number;
    minGapMm: number;
    maxRegions: number | null;
    lineWeightMm: string;
    allowsTextureMarks: boolean;
    specificChecks: string[];
}> = {
    'Bold & Easy': {
        minRegionMm: 8,
        minGapMm: 2,
        maxRegions: 50,
        lineWeightMm: '4mm consistent',
        allowsTextureMarks: false,
        specificChecks: [
            'Line weight must be consistently 4mm (no thin lines)',
            'No fine details or intricate patterns',
            'Minimum 2mm gap between parallel lines',
            'Maximum 50 distinct regions total',
        ],
    },
    'Kawaii': {
        minRegionMm: 6,
        minGapMm: 1.5,
        maxRegions: 80,
        lineWeightMm: '3mm consistent',
        allowsTextureMarks: false,
        specificChecks: [
            'All corners must be rounded (2mm+ radius)',
            'Eye highlights must be enclosed regions, not filled white',
            'No sharp angles anywhere',
            'Chibi proportions (1:2 head-to-body ratio)',
        ],
    },
    'Botanical': {
        minRegionMm: 3,
        minGapMm: 0.5,
        maxRegions: 150,
        lineWeightMm: '0.3mm fine',
        allowsTextureMarks: true,
        specificChecks: [
            'Stipple dots must NOT form enclosed regions',
            'Hatch lines must be OPEN-ENDED (not closing spaces)',
            'White space must exceed 60% within plant forms',
            'Fine controlled lines throughout',
        ],
    },
    'Gothic': {
        minRegionMm: 15,
        minGapMm: 3,
        maxRegions: 60,
        lineWeightMm: '5mm+ minimum',
        allowsTextureMarks: false,
        specificChecks: [
            'No line thinner than 3mm',
            'All regions must exceed 15mm²',
            'Compartmentalised stained-glass structure',
            'Angular shapes preferred over curves',
        ],
    },
    'Geometric': {
        minRegionMm: 5,
        minGapMm: 0.8,
        maxRegions: 120,
        lineWeightMm: '0.8mm consistent',
        allowsTextureMarks: false,
        specificChecks: [
            'ZERO curved lines (absolute requirement)',
            'All shapes must be straight-edged polygons',
            'Clean vertex intersections',
            'Triangular/polygonal tessellation only',
        ],
    },
    'Wildlife': {
        minRegionMm: 4,
        minGapMm: 0.8,
        maxRegions: 120,
        lineWeightMm: '1mm contours, 0.4mm texture',
        allowsTextureMarks: true,
        specificChecks: [
            'Texture lines must be directional strokes, NOT boundaries',
            'No texture line may enclose a sub-region',
            'White space must exceed 70%',
            'Anatomically accurate proportions',
        ],
    },
    'Zentangle': {
        minRegionMm: 4,
        minGapMm: 0.8,
        maxRegions: 120,
        lineWeightMm: '0.8mm consistent',
        allowsTextureMarks: true,
        specificChecks: [
            'Pattern marks must NOT create sub-regions',
            'Each string section must be independently closed',
            'No pattern area smaller than 4mm²',
            'Clear string boundary divisions',
        ],
    },
    'Realistic': {
        minRegionMm: 4,
        minGapMm: 0.8,
        maxRegions: 120,
        lineWeightMm: '0.6mm uniform (Ligne Claire)',
        allowsTextureMarks: false,
        specificChecks: [
            'Line weight must be uniform throughout (0.6mm)',
            'No hatching or cross-hatching present',
            'No rendering or tonal indication',
            'Anatomically correct proportions',
        ],
    },
    'default': {
        minRegionMm: 5,
        minGapMm: 1.5,
        maxRegions: 120,
        lineWeightMm: '1mm consistent',
        allowsTextureMarks: false,
        specificChecks: [
            'Clean, continuous vector lines',
            'All regions fully enclosed',
            'No stylistic flourishes',
            'Professional neutral appearance',
        ],
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLEXITY VALIDATION RULES
// ═══════════════════════════════════════════════════════════════════════════════

const COMPLEXITY_VALIDATION_RULES: Record<string, {
    maxShapes: number | null;
    minGapMm: number;
    allowsBackground: boolean;
    allowsTexture: boolean;
    densityDescription: string;
    specificChecks: string[];
}> = {
    'Very Simple': {
        maxShapes: 5,
        minGapMm: 5,
        allowsBackground: false,
        allowsTexture: false,
        densityDescription: '3-5 major shapes only',
        specificChecks: [
            'Maximum 3-5 major shapes total',
            'No internal divisions within shapes',
            'No background elements',
            'Subject instantly recognisable',
        ],
    },
    'Simple': {
        maxShapes: 25,
        minGapMm: 3,
        allowsBackground: true,
        allowsTexture: false,
        densityDescription: '10-25 distinct regions',
        specificChecks: [
            'Clear separation between all elements',
            'Minimal internal detail',
            'Sparse background (max 2-3 elements)',
        ],
    },
    'Moderate': {
        maxShapes: 80,
        minGapMm: 1.5,
        allowsBackground: true,
        allowsTexture: false,
        densityDescription: '40-80 distinct regions',
        specificChecks: [
            'Standard colouring book density',
            'Balanced foreground/background',
            'Appropriate internal detail',
        ],
    },
    'Intricate': {
        maxShapes: 120,
        minGapMm: 0.8,
        allowsBackground: true,
        allowsTexture: true,
        densityDescription: '80-120 distinct regions',
        specificChecks: [
            'High element density appropriate',
            'Textures permitted',
            'Fine motor control required',
        ],
    },
    'Extreme Detail': {
        maxShapes: 150,
        minGapMm: 0.5,
        allowsBackground: true,
        allowsTexture: true,
        densityDescription: '120-150+ distinct regions',
        specificChecks: [
            'Fractal detail appropriate',
            '90% space utilisation expected',
            'Maximum density permitted',
        ],
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIENCE VALIDATION RULES
// ═══════════════════════════════════════════════════════════════════════════════

const AUDIENCE_VALIDATION_RULES: Record<string, {
    maxComplexity: string;
    prohibitedContent: string[];
    requiredCharacteristics: string[];
    specificChecks: string[];
}> = {
    'toddlers': {
        maxComplexity: 'Very Simple',
        prohibitedContent: ['scary', 'teeth', 'claws', 'fire', 'weapons', 'villains', 'aggressive expressions'],
        requiredCharacteristics: ['friendly', 'cute', 'simple', 'recognisable'],
        specificChecks: [
            'Subject must be instantly recognisable',
            'Must be 100% friendly/cute aesthetic',
            'No scary or aggressive elements',
            'Centre-weighted composition',
        ],
    },
    'preschool': {
        maxComplexity: 'Simple',
        prohibitedContent: ['scary', 'violence', 'weapons', 'death', 'aggressive'],
        requiredCharacteristics: ['happy', 'friendly', 'simple story'],
        specificChecks: [
            'Simple storytelling scene appropriate',
            'Characters must be clearly friendly',
            'No violent or scary elements',
        ],
    },
    'kids': {
        maxComplexity: 'Moderate',
        prohibitedContent: ['gore', 'sexual content', 'extreme violence', 'drugs'],
        requiredCharacteristics: ['fun', 'energetic', 'age-appropriate'],
        specificChecks: [
            'Content must be age-appropriate',
            'Action/adventure themes OK',
            'Cartoon-style "spooky" acceptable',
        ],
    },
    'teens': {
        maxComplexity: 'Intricate',
        prohibitedContent: ['gore', 'sexual content', 'drug use'],
        requiredCharacteristics: ['stylish', 'dynamic'],
        specificChecks: [
            'Mature themes handled appropriately',
            'Stylish aesthetic appropriate',
        ],
    },
    'adults': {
        maxComplexity: 'Extreme Detail',
        prohibitedContent: ['illegal content'],
        requiredCharacteristics: ['sophisticated', 'artistic'],
        specificChecks: [
            'Adult complexity appropriate',
            'Artistic sophistication expected',
        ],
    },
    'seniors': {
        maxComplexity: 'Moderate',
        prohibitedContent: ['tiny details', 'cluttered compositions'],
        requiredCharacteristics: ['clear', 'visible', 'dignified'],
        specificChecks: [
            'All details clearly visible',
            'No tiny hard-to-see elements',
            'Clear section divisions',
        ],
    },
    'sen': {
        maxComplexity: 'Simple',
        prohibitedContent: ['chaotic', 'busy', 'unpredictable', 'scary', 'overwhelming'],
        requiredCharacteristics: ['calming', 'predictable', 'structured'],
        specificChecks: [
            'Calm, predictable composition',
            'No chaotic or busy areas',
            'Structured, orderly layout',
        ],
    },
    'default': {
        maxComplexity: 'Moderate',
        prohibitedContent: ['inappropriate content'],
        requiredCharacteristics: ['broadly appealing'],
        specificChecks: [
            'Generally appropriate content',
        ],
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ISSUE CODE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Comprehensive issue codes with default severities and remediations
 */
const ISSUE_DEFINITIONS: Record<string, {
    defaultSeverity: IssueSeverity;
    category: string;
    remediation: string;
}> = {
    // Critical: Fundamental failures
    'COLOR_DETECTED': {
        defaultSeverity: 'critical',
        category: 'output_format',
        remediation: 'Regenerate with emphasis on black-and-white only. Check negative prompt includes color terms.',
    },
    'GREY_SHADING': {
        defaultSeverity: 'critical',
        category: 'output_format',
        remediation: 'Regenerate. Add "grey, gray, shading, gradient" to negative prompt.',
    },
    'SOLID_BLACK_FILL': {
        defaultSeverity: 'critical',
        category: 'output_format',
        remediation: 'Regenerate. Ensure prompt specifies "outline only, no fills".',
    },
    'MOCKUP_DETECTED': {
        defaultSeverity: 'critical',
        category: 'output_format',
        remediation: 'Regenerate. Add "mockup, photo, staged, paper texture, pencils" to negative prompt.',
    },
    'UNCLOSED_REGIONS': {
        defaultSeverity: 'critical',
        category: 'topology',
        remediation: 'Regenerate. This is a fundamental failure for paint-by-numbers. Emphasise "closed paths" in prompt.',
    },
    'INAPPROPRIATE_CONTENT': {
        defaultSeverity: 'critical',
        category: 'safety',
        remediation: 'Regenerate with modified prompt. Content violates audience safety guidelines.',
    },

    // Major: Significant quality issues
    'REGIONS_TOO_SMALL': {
        defaultSeverity: 'major',
        category: 'topology',
        remediation: 'Regenerate with lower complexity or different style with larger minimum regions.',
    },
    'REGIONS_TOO_MANY': {
        defaultSeverity: 'major',
        category: 'complexity',
        remediation: 'Regenerate with lower complexity setting.',
    },
    'REGIONS_TOO_FEW': {
        defaultSeverity: 'major',
        category: 'complexity',
        remediation: 'Regenerate with higher complexity setting.',
    },
    'LINE_WEIGHT_WRONG': {
        defaultSeverity: 'major',
        category: 'style',
        remediation: 'Regenerate. Style-specific line weight not achieved.',
    },
    'STYLE_MISMATCH': {
        defaultSeverity: 'major',
        category: 'style',
        remediation: 'Regenerate. Image does not match requested style characteristics.',
    },
    'COMPLEXITY_MISMATCH': {
        defaultSeverity: 'major',
        category: 'complexity',
        remediation: 'Regenerate with adjusted complexity or clearer prompt.',
    },
    'TEXTURE_WHERE_FORBIDDEN': {
        defaultSeverity: 'major',
        category: 'style',
        remediation: 'Regenerate. This style does not permit texture marks.',
    },
    'CURVES_IN_GEOMETRIC': {
        defaultSeverity: 'major',
        category: 'style',
        remediation: 'Regenerate. Geometric style requires straight lines only.',
    },
    'SHARP_ANGLES_IN_KAWAII': {
        defaultSeverity: 'major',
        category: 'style',
        remediation: 'Regenerate. Kawaii style requires all rounded corners.',
    },
    'THIN_LINES_IN_BOLD': {
        defaultSeverity: 'major',
        category: 'style',
        remediation: 'Regenerate. Bold & Easy requires 4mm consistent line weight.',
    },
    'AUDIENCE_MISMATCH': {
        defaultSeverity: 'major',
        category: 'audience',
        remediation: 'Regenerate with clearer audience-appropriate content guidance.',
    },
    'SCARY_FOR_YOUNG': {
        defaultSeverity: 'major',
        category: 'safety',
        remediation: 'Regenerate. Content too scary for target young audience.',
    },

    // Minor: Quality observations
    'COMPOSITION_IMBALANCED': {
        defaultSeverity: 'minor',
        category: 'composition',
        remediation: 'Consider regenerating for better visual balance.',
    },
    'SUBJECT_OFF_CENTER': {
        defaultSeverity: 'minor',
        category: 'composition',
        remediation: 'Acceptable, but centre-weighted composition preferred for this audience.',
    },
    'BACKGROUND_SPARSE': {
        defaultSeverity: 'minor',
        category: 'composition',
        remediation: 'Background could be more developed for this complexity level.',
    },
    'BACKGROUND_BUSY': {
        defaultSeverity: 'minor',
        category: 'composition',
        remediation: 'Background may be too busy for comfortable colouring.',
    },
    'MINOR_STYLE_DEVIATION': {
        defaultSeverity: 'minor',
        category: 'style',
        remediation: 'Minor style inconsistencies detected. Acceptable for publication.',
    },
    'LINE_QUALITY_VARIABLE': {
        defaultSeverity: 'minor',
        category: 'style',
        remediation: 'Some line weight variation detected. May be acceptable depending on style.',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a QA prompt dynamically based on the actual specifications used
 */
const buildQaPrompt = (context: QaContext): string => {
    const styleRules = STYLE_VALIDATION_RULES[context.styleId] || STYLE_VALIDATION_RULES['default'];
    const complexityRules = COMPLEXITY_VALIDATION_RULES[context.complexityId] || COMPLEXITY_VALIDATION_RULES['Moderate'];
    const audienceRules = AUDIENCE_VALIDATION_RULES[context.audienceId] || AUDIENCE_VALIDATION_RULES['default'];

    return `
ROLE: Senior Technical Art Director and Quality Assurance Specialist for commercial coloring books.

TASK: Analyse this coloring page image against EXACT specifications used during generation.

═══════════════════════════════════════════════════════════════════════════════
GENERATION CONTEXT
═══════════════════════════════════════════════════════════════════════════════
User Prompt: "${context.userPrompt}"
Style: ${context.styleId}
Complexity: ${context.complexityId}
Audience: ${context.audienceId}

═══════════════════════════════════════════════════════════════════════════════
UNIVERSAL REQUIREMENTS (Non-Negotiable)
═══════════════════════════════════════════════════════════════════════════════
These are CRITICAL requirements. Violation = immediate failure.

1. OUTPUT FORMAT:
   - ONLY pure black (#000000) lines on pure white (#FFFFFF) background
   - ZERO colour pixels (no red, blue, green, etc.)
   - ZERO grey tones or gradients
   - ZERO solid black filled areas (everything outlined only)

2. TOPOLOGY:
   - ALL shapes must be fully CLOSED (no gaps in outlines)
   - Every white area must be a distinct, colourable region
   - No open-ended strokes

3. PRESENTATION:
   - Must be line art, NOT a mockup/photo
   - No paper texture, shadows, or staged photography
   - No art supplies visible in frame

═══════════════════════════════════════════════════════════════════════════════
STYLE-SPECIFIC REQUIREMENTS: ${context.styleId}
═══════════════════════════════════════════════════════════════════════════════
Line Weight: ${styleRules.lineWeightMm}
Minimum Region Size: ${styleRules.minRegionMm}mm²
Minimum Gap Between Lines: ${styleRules.minGapMm}mm
Maximum Regions: ${styleRules.maxRegions || 'No limit'}
Texture Marks Allowed: ${styleRules.allowsTextureMarks ? 'YES' : 'NO'}

Style-Specific Checks:
${styleRules.specificChecks.map(check => `• ${check}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
COMPLEXITY REQUIREMENTS: ${context.complexityId}
═══════════════════════════════════════════════════════════════════════════════
Density: ${complexityRules.densityDescription}
Maximum Shapes: ${complexityRules.maxShapes || 'No limit'}
Minimum Gap: ${complexityRules.minGapMm}mm
Background Elements: ${complexityRules.allowsBackground ? 'Allowed' : 'NOT allowed'}
Texture: ${complexityRules.allowsTexture ? 'Allowed' : 'NOT allowed'}

Complexity-Specific Checks:
${complexityRules.specificChecks.map(check => `• ${check}`).join('\n')}

SCORING GUIDANCE FOR COMPLEXITY:
${context.complexityId === 'Very Simple' || context.complexityId === 'Simple' ? `
⚠️ IMPORTANT: This is a LOW complexity image.
- High scores (80+) are CORRECT for clear, bold, simple shapes
- Do NOT penalise for "lack of detail" — simplicity IS the goal
- Few regions is CORRECT, not a failure
` : `
Standard complexity scoring applies.
`}

═══════════════════════════════════════════════════════════════════════════════
AUDIENCE REQUIREMENTS: ${context.audienceId}
═══════════════════════════════════════════════════════════════════════════════
Maximum Appropriate Complexity: ${audienceRules.maxComplexity}
Required Characteristics: ${audienceRules.requiredCharacteristics.join(', ')}

PROHIBITED CONTENT (Immediate Fail):
${audienceRules.prohibitedContent.map(item => `• ${item}`).join('\n')}

Audience-Specific Checks:
${audienceRules.specificChecks.map(check => `• ${check}`).join('\n')}

${context.audienceId === 'toddlers' || context.audienceId === 'preschool' ? `
⚠️ CRITICAL SAFETY CHECK:
This is for YOUNG CHILDREN. Immediate fail if:
- Image is scary, aggressive, or threatening
- Sharp/angry faces or expressions
- Weapons, fire, or violence of any kind
- Must be 100% cute/friendly
` : ''}

═══════════════════════════════════════════════════════════════════════════════
ANALYSIS INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════
Score each dimension 0-100 based on compliance with the above specifications.

For ISSUES, use ONLY these codes with appropriate severity:
- CRITICAL (blocks publication): COLOR_DETECTED, GREY_SHADING, SOLID_BLACK_FILL, MOCKUP_DETECTED, UNCLOSED_REGIONS, INAPPROPRIATE_CONTENT
- MAJOR (recommend regeneration): REGIONS_TOO_SMALL, REGIONS_TOO_MANY, REGIONS_TOO_FEW, LINE_WEIGHT_WRONG, STYLE_MISMATCH, COMPLEXITY_MISMATCH, TEXTURE_WHERE_FORBIDDEN, CURVES_IN_GEOMETRIC, SHARP_ANGLES_IN_KAWAII, THIN_LINES_IN_BOLD, AUDIENCE_MISMATCH, SCARY_FOR_YOUNG
- MINOR (logged only): COMPOSITION_IMBALANCED, SUBJECT_OFF_CENTER, BACKGROUND_SPARSE, BACKGROUND_BUSY, MINOR_STYLE_DEVIATION, LINE_QUALITY_VARIABLE

Be PRECISE and OBJECTIVE. Score against the specifications, not subjective aesthetics.

Return ONLY the JSON object defined in the schema.
`.trim();
};

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE SCHEMA DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

const QA_RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        lineQuality: {
            type: "NUMBER",
            description: "Score 0-100 for line quality: pure black, consistent weight, no grey"
        },
        regionIntegrity: {
            type: "NUMBER",
            description: "Score 0-100 for region closure: all paths closed, correct sizes"
        },
        composition: {
            type: "NUMBER",
            description: "Score 0-100 for composition: framing, balance, visual flow"
        },
        audienceAlignment: {
            type: "NUMBER",
            description: "Score 0-100 for audience appropriateness"
        },
        styleCompliance: {
            type: "NUMBER",
            description: "Score 0-100 for matching requested style characteristics"
        },
        complexityCompliance: {
            type: "NUMBER",
            description: "Score 0-100 for matching requested complexity level"
        },
        issues: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    code: {
                        type: "STRING",
                        enum: [
                            "COLOR_DETECTED", "GREY_SHADING", "SOLID_BLACK_FILL", "MOCKUP_DETECTED",
                            "UNCLOSED_REGIONS", "INAPPROPRIATE_CONTENT",
                            "REGIONS_TOO_SMALL", "REGIONS_TOO_MANY", "REGIONS_TOO_FEW",
                            "LINE_WEIGHT_WRONG", "STYLE_MISMATCH", "COMPLEXITY_MISMATCH",
                            "TEXTURE_WHERE_FORBIDDEN", "CURVES_IN_GEOMETRIC", "SHARP_ANGLES_IN_KAWAII",
                            "THIN_LINES_IN_BOLD", "AUDIENCE_MISMATCH", "SCARY_FOR_YOUNG",
                            "COMPOSITION_IMBALANCED", "SUBJECT_OFF_CENTER", "BACKGROUND_SPARSE",
                            "BACKGROUND_BUSY", "MINOR_STYLE_DEVIATION", "LINE_QUALITY_VARIABLE"
                        ]
                    },
                    severity: {
                        type: "STRING",
                        enum: ["critical", "major", "minor"]
                    },
                    description: {
                        type: "STRING",
                        description: "Specific description of the issue found"
                    },
                    location: {
                        type: "STRING",
                        description: "Where in the image the issue was found (optional)"
                    },
                    confidence: {
                        type: "NUMBER",
                        description: "Confidence score 0-100 for this issue detection"
                    }
                },
                required: ["code", "severity", "description", "confidence"]
            }
        },
        overallAssessment: {
            type: "STRING",
            description: "Brief overall assessment in 1-2 sentences"
        }
    },
    required: [
        "lineQuality", "regionIntegrity", "composition",
        "audienceAlignment", "styleCompliance", "complexityCompliance",
        "issues", "overallAssessment"
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QA FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyse a generated coloring page against its specifications
 *
 * @example
 * const qaResult = await analyzeColoringPage({
 *   imageUrl: generationResult.imageUrl,
 *   requestId: generationResult.metadata.requestId,
 *   styleId: 'Bold & Easy',
 *   complexityId: 'Simple',
 *   audienceId: 'preschool',
 *   userPrompt: 'A cute dragon eating a taco',
 * });
 *
 * if (!qaResult.isPublishable) {
 *   console.log('Critical issues:', qaResult.criticalIssues);
 * }
 */
export const analyzeColoringPage = async (
    context: QaContext,
    config: Partial<QaConfig> = {}
): Promise<QaResult> => {
    const startTime = Date.now();
    const finalConfig: QaConfig = { ...DEFAULT_CONFIG, ...config };

    if (context.enableLogging) {
        console.log(`[QA ${context.requestId}] Starting analysis`, {
            style: context.styleId,
            complexity: context.complexityId,
            audience: context.audienceId,
        });
    }

    try {
        // Check abort
        if (context.signal?.aborted) {
            throw new Error('Aborted');
        }

        // Build dynamic prompt
        const qaPrompt = buildQaPrompt(context);

        // Call AI for analysis
        const rawAnalysis = await generateObject<RawAiAnalysis>({
            model: GEMINI_TEXT_MODEL,
            system: "You are a precise technical auditor for commercial coloring book line art. Analyse objectively against specifications.",
            prompt: qaPrompt,
            image: context.imageUrl,
            schema: QA_RESPONSE_SCHEMA,
            apiKey: context.apiKey,
            signal: context.signal,
            temperature: 0.1, // Very low for consistent analysis
            enableLogging: context.enableLogging,
        });

        // Process issues with definitions
        const processedIssues: QaIssue[] = rawAnalysis.issues.map(issue => {
            const definition = ISSUE_DEFINITIONS[issue.code] || {
                defaultSeverity: issue.severity,
                category: 'unknown',
                remediation: 'Review and consider regenerating.',
            };

            // Apply severity overrides if configured
            const severity = finalConfig.severityOverrides?.[issue.code] || definition.defaultSeverity;

            return {
                code: issue.code,
                severity,
                description: issue.description,
                location: issue.location,
                remediation: definition.remediation,
                confidence: issue.confidence,
            };
        });

        // Categorise issues by severity
        const criticalIssues = processedIssues.filter(i => i.severity === 'critical');
        const majorIssues = processedIssues.filter(i => i.severity === 'major');
        const minorIssues = processedIssues.filter(i => i.severity === 'minor');

        // Build rubric
        const rubric: QaRubric = {
            lineQuality: rawAnalysis.lineQuality,
            regionIntegrity: rawAnalysis.regionIntegrity,
            composition: rawAnalysis.composition,
            audienceAlignment: rawAnalysis.audienceAlignment,
            styleCompliance: rawAnalysis.styleCompliance,
            complexityCompliance: rawAnalysis.complexityCompliance,
        };

        // Calculate overall score (weighted average)
        const overallScore = Math.round(
            (rubric.lineQuality * 0.25) +
            (rubric.regionIntegrity * 0.25) +
            (rubric.styleCompliance * 0.20) +
            (rubric.complexityCompliance * 0.10) +
            (rubric.audienceAlignment * 0.10) +
            (rubric.composition * 0.10)
        );

        // Determine pass/fail
        const hasCriticalIssues = criticalIssues.length > 0;
        const meetsMinimumScore = overallScore >= finalConfig.minimumPassScore;
        const passed = !hasCriticalIssues && meetsMinimumScore;

        // Publishability and regeneration recommendation
        const isPublishable = !hasCriticalIssues;
        const shouldRegenerate = hasCriticalIssues || majorIssues.length >= 2 || overallScore < 60;

        const analysisDurationMs = Date.now() - startTime;

        if (context.enableLogging) {
            console.log(`[QA ${context.requestId}] Analysis complete`, {
                passed,
                overallScore,
                criticalCount: criticalIssues.length,
                majorCount: majorIssues.length,
                durationMs: analysisDurationMs,
            });
        }

        return {
            requestId: context.requestId,
            passed,
            overallScore,
            rubric,
            issues: processedIssues,
            criticalIssues,
            majorIssues,
            minorIssues,
            isPublishable,
            shouldRegenerate,
            timestamp: new Date().toISOString(),
            analysisDurationMs,
            rawAnalysis: finalConfig.includeRawAnalysis ? rawAnalysis : undefined,
        };

    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // Propagate abort
        if (err.message === 'Aborted' || context.signal?.aborted) {
            throw new Error('Aborted');
        }

        console.error(`[QA ${context.requestId}] Analysis failed:`, err.message);

        // Return safe fallback based on mode
        const analysisDurationMs = Date.now() - startTime;

        if (finalConfig.mode === 'production') {
            // In production, failure to QA = fail the image (safety first)
            return {
                requestId: context.requestId,
                passed: false,
                overallScore: 0,
                rubric: {
                    lineQuality: 0,
                    regionIntegrity: 0,
                    composition: 0,
                    audienceAlignment: 0,
                    styleCompliance: 0,
                    complexityCompliance: 0,
                },
                issues: [{
                    code: 'QA_SERVICE_ERROR',
                    severity: 'critical',
                    description: `QA analysis failed: ${err.message}`,
                    remediation: 'Retry QA analysis or manually review image.',
                    confidence: 100,
                }],
                criticalIssues: [{
                    code: 'QA_SERVICE_ERROR',
                    severity: 'critical',
                    description: `QA analysis failed: ${err.message}`,
                    remediation: 'Retry QA analysis or manually review image.',
                    confidence: 100,
                }],
                majorIssues: [],
                minorIssues: [],
                isPublishable: false,
                shouldRegenerate: true,
                timestamp: new Date().toISOString(),
                analysisDurationMs,
            };
        } else {
            // In preview mode, allow through with warning
            return {
                requestId: context.requestId,
                passed: true,
                overallScore: 50,
                rubric: {
                    lineQuality: 50,
                    regionIntegrity: 50,
                    composition: 50,
                    audienceAlignment: 50,
                    styleCompliance: 50,
                    complexityCompliance: 50,
                },
                issues: [{
                    code: 'QA_SERVICE_ERROR',
                    severity: 'minor',
                    description: `QA analysis unavailable: ${err.message}`,
                    remediation: 'Image not validated. Manual review recommended.',
                    confidence: 100,
                }],
                criticalIssues: [],
                majorIssues: [],
                minorIssues: [{
                    code: 'QA_SERVICE_ERROR',
                    severity: 'minor',
                    description: `QA analysis unavailable: ${err.message}`,
                    remediation: 'Image not validated. Manual review recommended.',
                    confidence: 100,
                }],
                isPublishable: true,
                shouldRegenerate: false,
                timestamp: new Date().toISOString(),
                analysisDurationMs,
            };
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH QA FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyse multiple images in parallel with rate limiting
 */
export const analyzeColoringPageBatch = async (
    contexts: QaContext[],
    config: Partial<QaConfig> = {},
    concurrency = 3
): Promise<QaResult[]> => {
    const results: QaResult[] = [];
    const queue = [...contexts];

    const worker = async () => {
        while (queue.length > 0) {
            const context = queue.shift();
            if (context) {
                const result = await analyzeColoringPage(context, config);
                results.push(result);
            }
        }
    };

    // Run workers in parallel
    const workers = Array(Math.min(concurrency, contexts.length))
        .fill(null)
        .map(() => worker());

    await Promise.all(workers);

    // Sort results to match input order
    return contexts.map(ctx =>
        results.find(r => r.requestId === ctx.requestId)!
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Legacy wrapper for backwards compatibility with existing code
 * @deprecated Use analyzeColoringPage instead
 */
export const analyzeImageQuality = async (
    imageUrl: string,
    audience: string,
    style?: string,
    complexity?: string
): Promise<{
    tags: string[];
    score: number;
    hardFail: boolean;
    reasons: string[];
    rubricBreakdown: {
        printCleanliness: number;
        colorability: number;
        composition: number;
        audienceAlignment: number;
        consistency: number;
    };
}> => {
    const result = await analyzeColoringPage({
        imageUrl,
        requestId: `legacy_${Date.now()}`,
        styleId: style || 'default',
        complexityId: complexity || 'Moderate',
        audienceId: audience || 'default',
        userPrompt: 'Unknown (legacy call)',
    }, { mode: 'preview' });

    // Map to legacy format
    return {
        tags: result.issues.map(i => i.code.toLowerCase()),
        score: result.overallScore,
        hardFail: !result.isPublishable,
        reasons: result.issues.map(i => i.description),
        rubricBreakdown: {
            printCleanliness: result.rubric.lineQuality,
            colorability: result.rubric.regionIntegrity,
            composition: result.rubric.composition,
            audienceAlignment: result.rubric.audienceAlignment,
            consistency: result.rubric.styleCompliance,
        },
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    STYLE_VALIDATION_RULES,
    COMPLEXITY_VALIDATION_RULES,
    AUDIENCE_VALIDATION_RULES,
    ISSUE_DEFINITIONS,
};
