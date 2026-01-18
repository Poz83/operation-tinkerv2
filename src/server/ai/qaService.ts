
import { PageQa, QaTag } from '../../types';
import { generateObject } from './gemini-client';

export const analyzeImageQuality = async (
    imageUrl: string,
    audience: string,
    style?: string,     // Added context
    complexity?: string // Added context
): Promise<PageQa> => {

    const prompt = `
    ROLE: Senior Technical Art Director.
    TASK: Grade this coloring page for: ${audience}.
    STYLE TARGET: ${style || 'General'}.
    COMPLEXITY TARGET: ${complexity || 'Standard'}.

    CRITICAL RULES:
    1. PRINTABILITY: Lines must be pure BLACK. No gray, no fuzzy edges.
    2. TOPOLOGY: Main shapes must be CLOSED (watertight).
    3. CONTENT: No text, no grayscale shading, no cut-off subjects.

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
                        "low_contrast_lines", "shading_present"
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
