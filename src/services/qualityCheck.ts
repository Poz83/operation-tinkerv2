/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUALITY CHECK v1.0 — Client-Side Image Quality Detection
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Lightweight client-side quality checks for generated coloring pages.
 * Runs in the browser to detect common issues like grayscale shading.
 *
 * This replaces the heavy server-side QA loop with fast client-side detection.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Quality check result
 */
export interface QualityCheckResult {
    /** Overall pass/fail */
    isClean: boolean;
    /** Percentage of gray pixels detected (0-100) */
    grayPercent: number;
    /** Threshold used for detection */
    threshold: number;
    /** Whether image has grayscale shading issues */
    hasGrayscale: boolean;
    /** Human-readable summary */
    summary: string;
}

/**
 * Check if an image has unwanted grayscale shading
 * 
 * For coloring book pages, we want pure black (#000) and white (#FFF) only.
 * Any gray pixels indicate shading that shouldn't be there.
 * 
 * @param imageUrl - Data URL or blob URL of the image
 * @param threshold - Maximum allowed gray percentage (default: 5%)
 * @returns Promise<QualityCheckResult>
 * 
 * @example
 * const result = await checkImageQuality(dataUrl);
 * if (!result.isClean) {
 *   showWarning(`Image has ${result.grayPercent}% gray shading`);
 * }
 */
export const checkImageQuality = async (
    imageUrl: string,
    threshold: number = 5
): Promise<QualityCheckResult> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            // Create canvas to analyze pixels
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve({
                    isClean: true,
                    grayPercent: 0,
                    threshold,
                    hasGrayscale: false,
                    summary: 'Could not analyze image (no canvas context)',
                });
                return;
            }

            // Sample at reduced resolution for performance
            const maxDimension = 400;
            const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            let grayPixels = 0;
            let totalPixels = 0;

            // Check each pixel
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];

                // Skip transparent pixels
                if (a < 128) continue;

                totalPixels++;

                // Check if pixel is gray (not pure black or white)
                // Pure black: RGB close to 0
                // Pure white: RGB close to 255
                // Gray: anywhere in between
                const isBlack = r < 30 && g < 30 && b < 30;
                const isWhite = r > 225 && g > 225 && b > 225;

                if (!isBlack && !isWhite) {
                    grayPixels++;
                }
            }

            const grayPercent = totalPixels > 0
                ? Math.round((grayPixels / totalPixels) * 100 * 10) / 10
                : 0;

            const hasGrayscale = grayPercent > threshold;
            const isClean = !hasGrayscale;

            let summary: string;
            if (isClean) {
                summary = grayPercent === 0
                    ? '✅ Perfect: Pure black and white'
                    : `✅ Clean: ${grayPercent}% gray (below ${threshold}% threshold)`;
            } else {
                summary = `⚠️ Warning: ${grayPercent}% gray shading detected`;
            }

            resolve({
                isClean,
                grayPercent,
                threshold,
                hasGrayscale,
                summary,
            });
        };

        img.onerror = () => {
            resolve({
                isClean: true,
                grayPercent: 0,
                threshold,
                hasGrayscale: false,
                summary: 'Could not load image for analysis',
            });
        };

        img.src = imageUrl;
    });
};

/**
 * Check multiple images and return aggregate results
 */
export const checkImagesQuality = async (
    imageUrls: string[],
    threshold: number = 5
): Promise<{
    results: QualityCheckResult[];
    allClean: boolean;
    avgGrayPercent: number;
}> => {
    const results = await Promise.all(
        imageUrls.map(url => checkImageQuality(url, threshold))
    );

    const allClean = results.every(r => r.isClean);
    const avgGrayPercent = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.grayPercent, 0) / results.length * 10) / 10
        : 0;

    return { results, allClean, avgGrayPercent };
};
