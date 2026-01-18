interface UploadResponse {
    success: boolean;
    key: string;
    bucket: string;
    url?: string;
    error?: string;
}

interface SignedUrlResponse {
    success: boolean;
    url: string;
    expiresAt: string;
    error?: string;
}

/**
 * Upload a base64 image to the 'projects' bucket via Cloudflare Functions.
 */
export async function uploadProjectImage(
    projectId: string,
    imageId: string,
    base64Data: string
): Promise<{ key: string }> {
    try {
        const key = `${projectId}/${imageId}.png`;

        // Check if base64Data is valid
        if (!base64Data || !base64Data.startsWith('data:image/')) {
            throw new Error('Invalid base64 data');
        }

        const response = await fetch('/api/storage/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bucket: 'projects',
                key,
                base64Data,
                metadata: {
                    projectId,
                    imageId
                }
            }),
        });

        if (!response.ok) {
            const errorData = (await response.json().catch(() => ({}))) as any;
            throw new Error(errorData.error || 'Upload failed');
        }

        const data: UploadResponse = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Upload returned unsuccessful');
        }

        return { key: data.key };
    } catch (error) {
        console.error('Failed to upload image:', error);
        throw error;
    }
}

// --- In-Memory Cache for Signed URLs ---
// Prevents re-signing the same key repeatedly, which changes the URL and breaks browser caching.
interface CachedUrl {
    url: string;
    expiresAt: number;
}

const signedUrlCache = new Map<string, CachedUrl>();
const CACHE_DURATION_MS = 23 * 60 * 60 * 1000; // 23 hours (buffer for 24h expiry)

/**
 * Get a signed URL for a private file in the 'projects' bucket.
 * Uses in-memory cache to stabilize URLs.
 */
export async function getSignedUrl(key: string): Promise<string> {
    try {
        // 1. Check Cache
        const cached = signedUrlCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.url;
        }

        // 2. Fetch New
        const response = await fetch('/api/storage/signed-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bucket: 'projects',
                key,
                action: 'download',
                expiresIn: 3600 * 24 // 24 hours
            }),
        });

        if (!response.ok) {
            return '';
        }

        const data: SignedUrlResponse = await response.json();

        // 3. Update Cache
        if (data.success && data.url) {
            signedUrlCache.set(key, {
                url: data.url,
                expiresAt: Date.now() + CACHE_DURATION_MS
            });
            return data.url;
        }

        return '';
    } catch (error) {
        console.error('Failed to get signed URL:', error);
        return '';
    }
}

interface BatchSignedUrlResponse {
    success: boolean;
    urls: Record<string, string>;
    expiresAt: string;
    error?: string;
}

/**
 * Batch get signed URLs for multiple keys
 * smart-batches: only fetches missing keys from server
 */
export async function getSignedUrls(keys: string[]): Promise<Record<string, string>> {
    try {
        const validKeys = keys.filter(k => !!k);
        if (validKeys.length === 0) return {};

        const results: Record<string, string> = {};
        const missingKeys: string[] = [];

        // 1. Check Cache
        for (const key of validKeys) {
            const cached = signedUrlCache.get(key);
            if (cached && cached.expiresAt > Date.now()) {
                results[key] = cached.url;
            } else {
                missingKeys.push(key);
            }
        }

        // If all found in cache, successful early return
        if (missingKeys.length === 0) {
            return results;
        }

        // 2. Fetch Missing
        const response = await fetch('/api/storage/signed-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bucket: 'projects',
                keys: missingKeys,
                action: 'download',
                expiresIn: 3600 * 24 // 24 hours
            }),
        });

        if (!response.ok) {
            console.error('Batch signed URL request failed');
            // Return whatever we had cached at least
            return results;
        }

        const data: BatchSignedUrlResponse = await response.json();

        // 3. Update Cache & Merge
        if (data.urls) {
            Object.entries(data.urls).forEach(([key, url]) => {
                signedUrlCache.set(key, {
                    url,
                    expiresAt: Date.now() + CACHE_DURATION_MS
                });
                results[key] = url;
            });
        }

        return results;

    } catch (error) {
        console.error('Failed to get signed URLs batch:', error);
        return {};
    }
}
