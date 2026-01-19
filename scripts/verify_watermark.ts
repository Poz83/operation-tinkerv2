import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Sourced from .env.local
const API_KEY = 'AIzaSyDAiMhmc96mvTjbpBSMrArAPuos8oPvObY';
const MODEL = 'gemini-3-pro-image-preview';

async function main() {
    console.log('Generating test image with Gemini 3 Pro...');

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Using a prompt similar to the app's style to replicate conditions
    const prompt = `
  A high-quality hand-drawn coloring book illustration of a cute robot.
  
  SCENE: A cute robot sitting in a garden.
  
  STYLE: Bold outlines (1.5-2mm) with thinner internal lines (0.5mm). Clean dynamic cartoon style.
  
  COMPOSITION: Complete scene with balanced detail distribution.
  
  OUTPUT: A single black and white coloring book page. Pure black lines on pure white background. Every area is a closed shape that can be colored in.
  
  CRITICAL REQUIREMENTS - COLORING BOOK PAGE:
  1. COLORS: Pure black lines on pure white ONLY. Zero grey. Zero gradients.
  2. LINES: Clean outlines only. Zero stippling.
  3. NO FILLS: Pupils are outlined circles.
  `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                temperature: 1.0,
                responseModalities: ['image', 'text'],
            },
        });

        let base64Data: string | null = null;

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    base64Data = part.inlineData.data;
                    break;
                }
            }
        }

        if (base64Data) {
            const buffer = Buffer.from(base64Data, 'base64');
            const outputPath = path.join(process.cwd(), 'watermark_test_image.png');
            fs.writeFileSync(outputPath, buffer);
            console.log(`Success! Image saved to: ${outputPath}`);
            console.log('Please open this file and check the bottom-right corner for an "AI" or "Gemini" watermark.');
        } else {
            console.error('No image data found in response.');
            console.log(JSON.stringify(response, null, 2));
        }
    } catch (error) {
        console.error('Error generating image:', error);
    }
}

main();
