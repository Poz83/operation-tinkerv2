
import { PageQa, QaTag } from '../../types';
import { generateObject } from './gemini-client';

export const analyzeImageQuality = async (
    imageUrl: string,
    audience: string,
    style?: string,     // Added context
    complexity?: string // Added context
): Promise<PageQa> => {

    // [NEW] Updated System Prompt with Safety Checks
    const prompt = `
    ROLE: Senior Technical Art Director.
    TASK: Grade this coloring page for target audience: ${audience}.
    
    CRITICAL FAILURE CONDITIONS (Immediate Fail):
    1. COLOR DETECTED: Any pixel that is not Black (#000000) or White (#FFFFFF). (e.g., Red glasses, blue water, gray shadows).
    2. MOCKUP DETECTED: Image looks like a photo of paper on a table, has pencils, shadows, or wood texture.
    3. BAD TOPOLOGY: Open shapes that cannot be filled.
    4. AGE APPROPRIATENESS (Safety Check):
       - If Audience is 'Toddler/Preschool': IMMEDIATE FAIL if the image is scary, aggressive, or has sharp/angry faces. Must be 100% cute.
       - If Audience is 'Kids': FAIL if there is blood, gore, or realistic horror. "Cartoon Spooky" is OK.
    
    TAGGING RULES:
    - 'colored_artifacts': Image contains color or gray shading.
    - 'mockup_style': Image looks like a photo/flatlay.
    - 'scary_content': Inappropriate for audience.
    - 'low_contrast_lines': Lines are grey or weak.
    - 'wrong_tone': The style or emotion is too mature/immature for the audience.

    Return the exact JSON object defined in the schema.
  `;

    // THE FIX: Official Google JSON Schema Definition (using string literals)
    const googleSchema = {
        type: "OBJECT",
        properties: {
            tags: {
                type: "ARRAY",
                items: {
                    type: "STRING",
                    // Limit to exact tags from your types.ts to prevent hallucinations
                    enum: [
                        "cropped", "touches_border", "open_paths", "too_noisy",
                        "too_detailed", "too_simple", "missing_subject", "wrong_style",
                        "text_present_unwanted", "distorted_anatomy", "background_wrong",
                        "low_contrast_lines", "shading_present",
                        "scary_content", "wrong_tone",
                        "colored_artifacts", "mockup_style"
                    ]
                }
            },
            score: { type: "NUMBER", description: "0-100 quality score" },
            hardFail: { type: "BOOLEAN" },
            reasons: {
                type: "ARRAY",
                items: { type: "STRING" }
            },
            rubricBreakdown: {
                type: "OBJECT",
                properties: {
                    printCleanliness: { type: "NUMBER" },
                    colorability: { type: "NUMBER" },
                    composition: { type: "NUMBER" },
                    audienceAlignment: { type: "NUMBER" },
                    consistency: { type: "NUMBER" }
                }
            }
        },
        required: ["tags", "score", "hardFail", "reasons", "rubricBreakdown"]
    };

    try {
        const result = await generateObject<PageQa>({
            model: "gemini-1.5-pro", // Pro Vision is auto-selected by the model router usually, but 1.5 Pro is safest for Vision+JSON
            system: "You are a precise technical auditor for vector line art.",
            prompt: prompt,
            image: imageUrl,
            schema: googleSchema // Passing the Strict Schema
        });

        return result;

    } catch (error) {
        console.error("QA Service Failed:", error);
        return {
            tags: [],
            score: 50,
            hardFail: false, // Default to pass to avoid blocking user on API error
            reasons: ["QA Service unavailable"],
            rubricBreakdown: {
                printCleanliness: 0, colorability: 0, composition: 0, audienceAlignment: 0, consistency: 0
            }
        };
    }
};
