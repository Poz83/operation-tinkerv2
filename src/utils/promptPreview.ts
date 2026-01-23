/**
 * Prompt Preview Utility
 * 
 * Client-side utility to build a preview of the final prompt that will be sent to Gemini.
 * This mirrors the buildPrompt logic in gemini-client.ts for display purposes.
 */

import { VISUAL_STYLES, TARGET_AUDIENCES, COMPLEXITY_LEVELS, PAGE_SIZES } from '../types';

// Style specifications (mirrored from gemini-client.ts)
const STYLE_SPECS: Record<string, { styleKeyword: string; positiveDescription: string }> = {
    'Kawaii': { styleKeyword: 'kawaii coloring page', positiveDescription: 'adorable rounded characters with large sparkly eyes' },
    'Mandala': { styleKeyword: 'mandala coloring page', positiveDescription: 'intricate radial symmetry with geometric patterns' },
    'Cozy': { styleKeyword: 'cozy coloring page', positiveDescription: 'warm and inviting hygge-inspired scene' },
    'HandDrawn': { styleKeyword: 'Hand-drawn hygge coloring page', positiveDescription: 'cozy domestic lifestyle with ultra-thick hand-drawn marker lines and empowering characters' },
    'Gothic': { styleKeyword: 'gothic woodcut coloring page', positiveDescription: 'Victorian engraving style with bold dramatic lines' },
    'Fantasy': { styleKeyword: 'fantasy coloring page', positiveDescription: 'epic adventure with magical creatures' },
    'Geometric': { styleKeyword: 'geometric coloring page', positiveDescription: 'low-poly abstract shapes and patterns' },
    'Floral': { styleKeyword: 'botanical coloring page', positiveDescription: 'elegant flowers and natural elements' },
    'StainedGlass': { styleKeyword: 'stained glass coloring page', positiveDescription: 'bold lead lines with geometric segments' },
    'Whimsical': { styleKeyword: 'whimsical coloring page', positiveDescription: 'playful and imaginative scene' },
    'Realistic': { styleKeyword: 'fine art engraving coloring page', positiveDescription: 'museum-quality steel engraving style' },
};

// Complexity specifications
const COMPLEXITY_SPECS: Record<string, { detailLevel: string; regionRange: string }> = {
    'Very Simple': { detailLevel: 'Very few elements, large shapes', regionRange: '5-15 colorable regions' },
    'Simple': { detailLevel: 'Minimal details, clear outlines', regionRange: '15-30 colorable regions' },
    'Moderate': { detailLevel: 'Balanced detail level', regionRange: '30-60 colorable regions' },
    'Intricate': { detailLevel: 'Rich details, many elements', regionRange: '60-100 colorable regions' },
    'Extreme Detail': { detailLevel: 'Maximum complexity', regionRange: '100+ colorable regions' },
};

// Audience specifications
const AUDIENCE_SPECS: Record<string, { contentGuidance: string }> = {
    'toddlers': { contentGuidance: 'Very simple, no scary elements, rounded friendly shapes' },
    'kids': { contentGuidance: 'Fun and engaging, age-appropriate themes' },
    'teens': { contentGuidance: 'Trendy themes, moderate complexity' },
    'adults': { contentGuidance: 'Sophisticated designs, stress-relief patterns' },
    'seniors': { contentGuidance: 'Clear outlines, nostalgic themes, easy to see' },
};

export interface PromptPreviewData {
    userPrompt: string;
    styleLabel: string;
    audienceLabel: string;
    complexityLabel: string;
    pageSizeLabel: string;
    systemPrompt: string;
}

export function buildPromptPreview(params: {
    userPrompt: string;
    styleId: string;
    complexityId: string;
    audienceId: string;
    pageSizeId: string;
}): PromptPreviewData {
    const { userPrompt, styleId, complexityId, audienceId, pageSizeId } = params;

    // Get labels
    const styleLabel = VISUAL_STYLES.find(s => s.id === styleId)?.label || styleId;
    const audienceLabel = TARGET_AUDIENCES.find(a => a.id === audienceId)?.label || audienceId;
    const complexityLabel = complexityId;
    const pageSizeLabel = PAGE_SIZES.find(p => p.id === pageSizeId)?.label || pageSizeId;

    // Get specs with fallbacks
    const styleSpec = STYLE_SPECS[styleId] || { styleKeyword: styleId, positiveDescription: 'creative illustration' };
    const complexitySpec = COMPLEXITY_SPECS[complexityId] || { detailLevel: 'Standard detail', regionRange: '30-60 regions' };
    const audienceSpec = AUDIENCE_SPECS[audienceId] || { contentGuidance: 'General audience appropriate' };

    // Build system prompt (simplified version for preview)
    const systemPrompt = `ROLE: Expert digital illustrator
TASK: Generate a high-quality ${styleSpec.styleKeyword}, ${styleSpec.positiveDescription}. Designed for ${audienceId} audience.

AUDIENCE GUIDANCE: ${audienceSpec.contentGuidance}

STYLE: ${styleSpec.positiveDescription}

COMPOSITION: ${complexitySpec.regionRange}. ${complexitySpec.detailLevel}.

OUTPUT: A single high-contrast black and white coloring book page. Pure black lines on pure white background.

CRITICAL REQUIREMENTS:
1. DIGITAL INK: Pure black (#000000) lines on pure white (#FFFFFF) background. Vector quality.
2. NO GREYSCALE: Zero shading. Zero gradients. Zero grey areas. Strictly line art.
3. CLEAN LINES: Solid continuous lines. No sketching. No disconnects.
4. CLOSED SHAPES: Every element must be a closed loop for coloring.`;

    return {
        userPrompt,
        styleLabel,
        audienceLabel,
        complexityLabel,
        pageSizeLabel,
        systemPrompt,
    };
}
