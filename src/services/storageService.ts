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

/**
 * Get a signed URL for a private file in the 'projects' bucket.
 */
export async function getSignedUrl(key: string): Promise<string> {
    try {
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
            // If file doesn't exist or other error, return empty
            return '';
        }

        const data: SignedUrlResponse = await response.json();
        return data.url;
    } catch (error) {
        console.error('Failed to get signed URL:', error);
        return '';
    }
}

/**
 * Batch get signed URLs for multiple keys
 */
export async function getSignedUrls(keys: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    await Promise.all(
        keys.map(async (key) => {
            if (!key) return;
            results[key] = await getSignedUrl(key);
        })
    );
    return results;
}
