/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HERO LAB SERVICE v2.0
 * myJoe Creative Suite - Hero Lab
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Handles all AI operations for the Hero Lab character consistency system:
 * - extractCharacterDNA(): Analyzes uploaded character images to extract DNA profile
 * - validateCharacterForAudience(): Checks if character is appropriate for target audience
 * - generateCharacterVariation(): Creates consistent character in new pose/scene
 *
 * v2.0 Changes:
 * - Style IDs aligned with prompts-v5.0 exactly
 * - Audience validation integrated (removed deprecated 'sen' audience)
 * - Improved DNA extraction with coloring-book-specific attributes
 * - Added character variation generation
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/// <reference types="vite/client" />

import { GoogleGenAI } from '@google/genai';
import { GEMINI_TEXT_MODEL } from '../server/ai/gemini-client';
import { getStoredApiKey } from '../lib/crypto';
import type { CharacterDNA } from '../types';
import { VALID_STYLE_IDS, VALID_AUDIENCE_IDS, type StyleId, type AudienceId } from './ColoringStudioService';

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIENCE SAFETY RULES
// ═══════════════════════════════════════════════════════════════════════════════

const AUDIENCE_CHARACTER_RULES: Record<string, {
    prohibited: string[];
    required: string[];
    adjustments: string;
}> = {
    'toddlers': {
        prohibited: ['scary', 'angry', 'weapons', 'claws', 'fangs', 'blood', 'skulls', 'fire', 'sharp objects'],
        required: ['friendly expression', 'rounded features', 'approachable pose'],
        adjustments: 'Make character 100% cute and non-threatening. Soften any sharp features.',
    },
    'preschool': {
        prohibited: ['scary', 'weapons', 'violence', 'angry expressions', 'blood'],
        required: ['friendly', 'age-appropriate'],
        adjustments: 'Ensure character is friendly and approachable for young children.',
    },
    'kids': {
        prohibited: ['gore', 'sexual content', 'extreme violence', 'realistic weapons'],
        required: ['age-appropriate', 'engaging'],
        adjustments: 'Character can be adventurous but must remain appropriate for children.',
    },
    'teens': {
        prohibited: ['gore', 'sexual content', 'drug references'],
        required: ['stylish', 'relatable'],
        adjustments: 'Character can have edge but must remain teen-appropriate.',
    },
    'adults': {
        prohibited: ['illegal content'],
        required: ['artistic merit'],
        adjustments: 'Full creative freedom within legal bounds.',
    },
    'seniors': {
        prohibited: ['overly complex details', 'tiny features'],
        required: ['clear features', 'dignified representation'],
        adjustments: 'Ensure character features are clearly visible and not too intricate.',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface CharacterDNAExtended extends CharacterDNA {
    /** Art style locked to valid style IDs */
    styleLock: StyleId;
    /** Coloring-book-specific attributes */
    coloringBookAttributes?: {
        /** Recommended line weight for this character */
        lineWeight: 'fine' | 'medium' | 'bold';
        /** Whether character has complex patterns (affects complexity) */
        hasComplexPatterns: boolean;
        /** Estimated region count when drawn */
        estimatedRegions: 'few' | 'moderate' | 'many';
        /** Special rendering notes */
        renderingNotes: string;
    };
    /** Audience compatibility assessment */
    audienceCompatibility?: {
        safe: AudienceId[];
        warnings: { audience: AudienceId; reason: string }[];
    };
}

export interface CharacterValidationResult {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
    adjustedDNA?: Partial<CharacterDNA>;
}

export interface CharacterVariationRequest {
    dna: CharacterDNA;
    scene: string;
    pose?: string;
    expression?: string;
    style: StyleId;
    signal?: AbortSignal;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * HeroLabService v2.0
 * 
 * Handles all AI operations for character consistency in the Hero Lab.
 * Integrated with prompts-v5.0 style system.
 */
export class HeroLabService {
    private ai: GoogleGenAI | null = null;
    private apiKey: string | null = null;

    constructor(apiKey?: string) {
        if (apiKey) {
            this.apiKey = apiKey;
            this.ai = new GoogleGenAI({ apiKey });
        }
    }

    /**
     * Initialize or reinitialize with an API key
     */
    async initialize(apiKey?: string): Promise<void> {
        const key = apiKey || await getStoredApiKey() || undefined;

        if (!key) {
            console.warn('HeroLabService: No API key available');
            this.ai = null;
            this.apiKey = null;
            return;
        }

        if (key !== this.apiKey) {
            this.apiKey = key;
            this.ai = new GoogleGenAI({ apiKey: key });
        }
    }

    /**
     * Ensure service is initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.ai) {
            await this.initialize();
        }
        if (!this.ai) {
            throw new Error('Gemini API Key is not configured. Please add your key in Settings.');
        }
    }

    /**
     * Create instance with specific API key
     */
    static async createWithKey(apiKey: string): Promise<HeroLabService> {
        const service = new HeroLabService(apiKey);
        await service.initialize(apiKey);
        return service;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHARACTER DNA EXTRACTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Extract Character DNA from an uploaded image.
     * Uses AI vision to analyze the character and populate DNA fields.
     * 
     * @example
     * const dna = await service.extractCharacterDNA(base64, 'image/png');
     * // Returns full CharacterDNA with styleLock matching valid style IDs
     */
    async extractCharacterDNA(
        imageBase64: string,
        mimeType: string,
        signal?: AbortSignal
    ): Promise<CharacterDNAExtended | null> {
        await this.ensureInitialized();

        const systemInstruction = `
ROLE: Expert Character Analyst for coloring book illustrations.
TASK: Analyze this character image and extract a detailed "Character DNA" profile.

This DNA will be used to maintain CONSISTENCY when generating the character in different poses and scenes.
The output must be optimized for BLACK AND WHITE LINE ART reproduction.

═══════════════════════════════════════════════════════════════════════════════
VALID STYLE IDS (styleLock MUST be one of these exactly)
═══════════════════════════════════════════════════════════════════════════════

${VALID_STYLE_IDS.map(id => `- "${id}"`).join('\n')}

Match the character's art style to the closest option above.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON only, no markdown)
═══════════════════════════════════════════════════════════════════════════════

{
  "name": "[Suggest a fitting name, or 'Unknown Hero' if unclear]",
  "role": "[Character's role: 'Space Explorer', 'Forest Guardian', 'Young Wizard', etc.]",
  "age": "[Age range: 'Child (8-10)', 'Young Adult', 'Middle-aged', etc.]",
  "face": "[Face description: jaw shape, cheekbones, nose, distinctive features]",
  "eyes": "[Eye details: shape, size, expression, unique marks]",
  "hair": "[Hair: length, style, texture, accessories like bows/clips]",
  "skin": "[Skin tone description or art style note]",
  "body": "[Body type: athletic, slim, round, chibi, etc.]",
  "signatureFeatures": "[CRITICAL - ALL distinctive features that MUST appear in every image: scars, birthmarks, accessories, jewelry, tattoos, unique clothing elements]",
  "outfitCanon": "[Detailed outfit: main clothing, accessories, footwear]",
  "styleLock": "[MUST be one of the valid style IDs listed above]",
  "coloringBookAttributes": {
    "lineWeight": "[fine|medium|bold] - recommended for this character",
    "hasComplexPatterns": true/false,
    "estimatedRegions": "[few|moderate|many] - when drawn as coloring page",
    "renderingNotes": "[Special notes for consistent rendering in line art]"
  },
  "audienceCompatibility": {
    "safe": ["[list of audience IDs this character is safe for]"],
    "warnings": [
      {"audience": "[audience ID]", "reason": "[why there might be concerns]"}
    ]
  }
}

═══════════════════════════════════════════════════════════════════════════════
ANALYSIS GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

1. SIGNATURE FEATURES are the most critical - these are the anchors for consistency.
   Include: distinctive accessories, unique clothing elements, character-defining marks.

2. For STYLE LOCK, analyze:
   - Line weight and consistency
   - Level of detail
   - Proportion style (realistic vs chibi vs cartoon)
   - Overall aesthetic

3. For COLORING BOOK ATTRIBUTES:
   - lineWeight: Based on the art style's typical line thickness
   - hasComplexPatterns: Does the character have intricate clothing/armor/patterns?
   - estimatedRegions: How many distinct areas when converted to coloring page?
   - renderingNotes: Any special considerations (fur texture, scale pattern, etc.)

4. For AUDIENCE COMPATIBILITY:
   - safe: List all audiences this character works for
   - warnings: Note any potential issues (e.g., fantasy warrior might concern toddler audience)

   Valid audience IDs: ${VALID_AUDIENCE_IDS.join(', ')}

5. Describe what you SEE, not what you imagine.

RESPOND WITH JSON ONLY. No explanations.
`.trim();

        try {
            if (signal?.aborted) throw new Error('Aborted');

            const response = await this.ai!.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: {
                    parts: [
                        { text: 'Analyze this character image and extract its DNA profile:' },
                        {
                            inlineData: {
                                data: imageBase64,
                                mimeType,
                            },
                        },
                    ],
                },
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
                    temperature: 0.3, // Low temperature for consistent analysis
                },
            });

            if (signal?.aborted) throw new Error('Aborted');

            if (response.text) {
                try {
                    const parsed = JSON.parse(response.text) as CharacterDNAExtended;

                    // Validate styleLock is a valid ID
                    if (!VALID_STYLE_IDS.includes(parsed.styleLock as StyleId)) {
                        console.warn(`Invalid styleLock "${parsed.styleLock}", finding closest match`);

                        // Find closest match
                        const closestMatch = VALID_STYLE_IDS.find(id =>
                            parsed.styleLock?.toLowerCase().includes(id.toLowerCase()) ||
                            id.toLowerCase().includes(parsed.styleLock?.toLowerCase() || '')
                        );
                        parsed.styleLock = (closestMatch || 'Cartoon') as StyleId;
                    }

                    // Validate audience IDs in compatibility
                    if (parsed.audienceCompatibility?.safe) {
                        parsed.audienceCompatibility.safe = parsed.audienceCompatibility.safe.filter(
                            id => VALID_AUDIENCE_IDS.includes(id as AudienceId)
                        ) as AudienceId[];
                    }

                    console.log('🧬 Character DNA extracted:', parsed);
                    return parsed;

                } catch (parseError) {
                    console.error('Failed to parse CharacterDNA JSON:', parseError, response.text);
                    return null;
                }
            }

            return null;

        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'Aborted' || signal?.aborted) {
                throw new Error('Aborted');
            }
            console.error('Failed to extract character DNA:', error);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHARACTER VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Validate a character DNA against a target audience
     * Returns issues and suggestions for making the character appropriate
     */
    validateCharacterForAudience(
        dna: CharacterDNA,
        audienceId: AudienceId
    ): CharacterValidationResult {
        const rules = AUDIENCE_CHARACTER_RULES[audienceId] || AUDIENCE_CHARACTER_RULES['kids'];
        const issues: string[] = [];
        const suggestions: string[] = [];

        // Check all text fields for prohibited content
        const textToCheck = [
            dna.name,
            dna.role,
            dna.face,
            dna.eyes,
            dna.body,
            dna.signatureFeatures,
            dna.outfitCanon,
        ].join(' ').toLowerCase();

        for (const prohibited of rules.prohibited) {
            if (textToCheck.includes(prohibited.toLowerCase())) {
                issues.push(`Character description contains "${prohibited}" which is not suitable for ${audienceId}.`);
                suggestions.push(`Consider removing or softening the "${prohibited}" element.`);
            }
        }

        // Check for required characteristics (soft check)
        const hasRequiredTone = rules.required.some(req =>
            textToCheck.includes(req.toLowerCase())
        );

        if (!hasRequiredTone && (audienceId === 'toddlers' || audienceId === 'preschool')) {
            suggestions.push(`Consider adding more ${rules.required.join(' or ')} elements for this young audience.`);
        }

        // Style-specific checks
        if (dna.styleLock === 'Gothic' && (audienceId === 'toddlers' || audienceId === 'preschool')) {
            issues.push('Gothic style may be too intense for young children.');
            suggestions.push('Consider using "Kawaii" or "Cozy Hand-Drawn" style instead.');
        }

        if (dna.styleLock === 'Fantasy' && audienceId === 'toddlers') {
            suggestions.push('Fantasy style may need simplification for toddlers. Consider "Bold & Easy" with the character concept.');
        }

        return {
            isValid: issues.length === 0,
            issues,
            suggestions,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHARACTER PROMPT GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Generate a prompt fragment for consistent character rendering
     * Used to inject into image generation prompts
     */
    generateCharacterPromptFragment(dna: CharacterDNA): string {
        const parts: string[] = [];

        // Core identity
        if (dna.name && dna.name !== 'Unknown Hero') {
            parts.push(`The character is ${dna.name}, ${dna.role || 'a unique character'}.`);
        } else if (dna.role) {
            parts.push(`The character is ${dna.role}.`);
        }

        // Physical description
        const physicalParts: string[] = [];
        if (dna.body) physicalParts.push(dna.body);
        if (dna.face) physicalParts.push(dna.face);
        if (dna.eyes) physicalParts.push(`eyes: ${dna.eyes}`);
        if (dna.hair) physicalParts.push(`hair: ${dna.hair}`);

        if (physicalParts.length > 0) {
            parts.push(`Physical appearance: ${physicalParts.join('. ')}.`);
        }

        // Signature features (CRITICAL)
        if (dna.signatureFeatures) {
            parts.push(`SIGNATURE FEATURES (must always include): ${dna.signatureFeatures}.`);
        }

        // Outfit
        if (dna.outfitCanon) {
            parts.push(`Outfit: ${dna.outfitCanon}.`);
        }

        // Style lock
        if (dna.styleLock) {
            parts.push(`Render in ${dna.styleLock} style.`);
        }

        return parts.join('\n');
    }

    /**
     * Generate a complete prompt for a character in a new scene
     */
    async generateCharacterScenePrompt(
        request: CharacterVariationRequest
    ): Promise<string> {
        const { dna, scene, pose, expression, style } = request;

        const characterFragment = this.generateCharacterPromptFragment(dna);

        const promptParts = [
            characterFragment,
            '',
            `SCENE: ${scene}`,
        ];

        if (pose) {
            promptParts.push(`POSE: ${pose}`);
        }

        if (expression) {
            promptParts.push(`EXPRESSION: ${expression}`);
        }

        promptParts.push('');
        promptParts.push('CONSISTENCY REQUIREMENTS:');
        promptParts.push('- Maintain ALL signature features exactly as described');
        promptParts.push('- Keep body proportions consistent');
        promptParts.push('- Preserve outfit details unless scene requires different attire');
        promptParts.push(`- Render in ${style} style`);

        return promptParts.join('\n');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get audience safety rules for display
     */
    getAudienceRules(audienceId: AudienceId): typeof AUDIENCE_CHARACTER_RULES[string] | null {
        return AUDIENCE_CHARACTER_RULES[audienceId] || null;
    }

    /**
     * Check if a character is compatible with an audience
     */
    isCompatibleWithAudience(dna: CharacterDNA, audienceId: AudienceId): boolean {
        const validation = this.validateCharacterForAudience(dna, audienceId);
        return validation.isValid;
    }

    /**
     * Get all compatible audiences for a character
     */
    getCompatibleAudiences(dna: CharacterDNA): AudienceId[] {
        return VALID_AUDIENCE_IDS.filter(audience =>
            this.isCompatibleWithAudience(dna, audience)
        );
    }

    /**
     * Suggest style based on character DNA
     */
    suggestStyleForCharacter(dna: CharacterDNA): StyleId {
        // If already has a valid style lock, use it
        if (dna.styleLock && VALID_STYLE_IDS.includes(dna.styleLock as StyleId)) {
            return dna.styleLock as StyleId;
        }

        const description = [
            dna.body,
            dna.face,
            dna.signatureFeatures,
            dna.outfitCanon,
        ].join(' ').toLowerCase();

        // Style inference rules
        if (description.includes('chibi') || description.includes('cute') || description.includes('kawaii')) {
            return 'Kawaii';
        }
        if (description.includes('armor') || description.includes('sword') || description.includes('dragon')) {
            return 'Fantasy';
        }
        if (description.includes('realistic') || description.includes('detailed anatomy')) {
            return 'Realistic';
        }
        if (description.includes('simple') || description.includes('bold')) {
            return 'Bold & Easy';
        }
        if (description.includes('whimsical') || description.includes('fairy') || description.includes('magical')) {
            return 'Whimsical';
        }
        if (description.includes('geometric') || description.includes('angular') || description.includes('faceted')) {
            return 'Geometric';
        }
        if (description.includes('botanical') || description.includes('plant') || description.includes('flower')) {
            return 'Botanical';
        }
        if (description.includes('gothic') || description.includes('dark') || description.includes('ornate')) {
            return 'Gothic';
        }

        // Default to Cartoon as it's versatile
        return 'Cartoon';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

let defaultInstance: HeroLabService | null = null;

/**
 * Get the default service instance
 */
export const getHeroLabService = async (): Promise<HeroLabService> => {
    if (!defaultInstance) {
        defaultInstance = new HeroLabService();
        await defaultInstance.initialize();
    }
    return defaultInstance;
};

/**
 * Reset the default instance
 */
export const resetHeroLabService = (): void => {
    defaultInstance = null;
};
