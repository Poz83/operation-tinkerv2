
import { QaTag, PageQa } from '../../types';

/**
 * REPAIR LOGIC
 * Translates QA failures into specific engineering directives for the next attempt.
 */

// A dictionary mapping specific error tags to specific prompt fixes.
// We use uppercase "CRITICAL FIX" markers to force the AI to pay attention.
const REPAIR_STRATEGIES: Partial<Record<QaTag, string>> = {

    // 1. Line Quality Issues
    'low_contrast_lines':
        "CRITICAL FIX: The previous lines were too faint/gray. USE PURE BLACK (#000000). Increase stroke weight to 4px. Remove all opacity/transparency.",

    'too_noisy':
        "CRITICAL FIX: The image had too much scratchy detail. SIMPLIFY. Use clean, single vector strokes. Remove hatching/cross-hatching.",

    // 2. Topology/Colorability Issues
    'open_paths':
        "CRITICAL FIX: Shapes were not closed. Ensure every outline is WATERTIGHT. Connect all gaps so the image can be flood-filled.",

    'too_detailed':
        "CRITICAL FIX: Too complex for the target audience. ZOOM IN. Remove 50% of the background elements. Focus on the main subject only.",

    // 3. Composition Issues
    'cropped':
        "CRITICAL FIX: The subject was cut off. Zoom out (0.8x) to fit the entire character in the center. Add a white margin around the edges.",

    'touches_border':
        "CRITICAL FIX: Subject is touching the edge. Center the subject with whitespace padding on all sides.",

    // 4. Content Violations
    'text_present_unwanted':
        "CRITICAL FIX: Remove all text, letters, signatures, and watermarks. The image must be pictorial only.",

    'distorted_anatomy':
        "CRITICAL FIX: Correct the anatomy. Ensure symmetry in the face and correct number of limbs.",

    // 5. Fatal Errors
    'wrong_style':
        "CRITICAL FIX: Strictly adhere to the requested style. Do not hallucinate a different art style.",

    'background_wrong':
        "CRITICAL FIX: Remove the background. The background must be PURE WHITE.",

    // 6. Heuristic Failures (Legacy)
    'margin':
        "CRITICAL FIX: Leave a blank 10% border; keep all elements inside the safe margin.",

    'midtones':
        "CRITICAL FIX: Use pure black lines on pure white; no gray, no texture, no speckles.",

    'speckles':
        "CRITICAL FIX: Remove stray dots or dust; no scattered marks in the background.",

    'micro_clutter':
        "CRITICAL FIX: Merge tiny regions; enlarge enclosed areas; avoid tiny enclosed loops and micro-lines.",

    // 7. Additional AI Tags
    'scary_content':
        "CRITICAL FIX: Make the subject CUTE and CHILD-FRIENDLY. Remove scary elements.",

    'audience_mismatch':
        "CRITICAL FIX: Adjust complexity to match the target audience (Simple for Kids, Detailed for Adults).",

    'grayscale_shading':
        "CRITICAL FIX: Use ONLY black outlines. NO shading, NO gradients, NO gray."
};

/**
 * Generates a prompt append string based on the QA result.
 */
export const getRepairInstructions = (qaResult: PageQa): string => {
    // If the image passed or has no tags, no repairs needed.
    if (!qaResult.tags || qaResult.tags.length === 0) {
        return "";
    }

    // Map the tags to their fix instructions
    const activeRepairs = qaResult.tags
        .map((tag) => REPAIR_STRATEGIES[tag])
        .filter((instruction): instruction is string => !!instruction); // Filter out undefined

    // If we have tags but no defined strategy, give a generic boost
    if (activeRepairs.length === 0) {
        return "IMPORTANT: Improve image clarity and strictly follow the style guide.";
    }

    // Join the instructions into a strong directive block
    return `
    
    [PRIORITY REPAIR INSTRUCTIONS]
    The previous generation failed Quality Assurance. You MUST apply these fixes:
    ${activeRepairs.map(fix => `- ${fix}`).join('\n')}
    
    IGNORE previous conflicting instructions if they caused these errors.
  `.trim();
};
