/**
 * Cloudflare Pages Function: Get Signed URL
 * 
 * Generates a time-limited signed URL for accessing private files.
 * POST /api/storage/signed-url
 * 
 * Body: { bucket, key, expiresIn?, action? }
 */

interface Env {
    PROJECTS_BUCKET: R2Bucket;
    AVATARS_BUCKET: R2Bucket;
    EXPORTS_BUCKET: R2Bucket;
    FEEDBACK_BUCKET: R2Bucket;
    // Variables
    CLOUDFLARE_ACCOUNT_ID: string;
}

interface SignedUrlRequest {
    bucket: 'projects' | 'avatars' | 'exports' | 'feedback';
    key?: string; // Optional for single mode
    keys?: string[]; // Optional for batch mode
    expiresIn?: number; // seconds, default 3600
    action?: 'download' | 'upload';
    contentType?: string; // required for upload action
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const body: SignedUrlRequest = await context.request.json();
        const { bucket, key, keys, expiresIn = 3600, action = 'download', contentType } = body;

        // Validate required fields
        if (!bucket || (!key && (!keys || keys.length === 0))) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: bucket, and either key or keys' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'upload' && !contentType) {
            return new Response(
                JSON.stringify({ error: 'contentType required for upload action' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get the appropriate bucket binding
        const bucketMap: Record<string, R2Bucket> = {
            projects: context.env.PROJECTS_BUCKET,
            avatars: context.env.AVATARS_BUCKET,
            exports: context.env.EXPORTS_BUCKET,
            feedback: context.env.FEEDBACK_BUCKET,
        };

        const r2Bucket = bucketMap[bucket];
        if (!r2Bucket) {
            return new Response(
                JSON.stringify({ error: `Invalid bucket: ${bucket}` }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const expiry = Date.now() + (expiresIn * 1000);
        const baseUrl = new URL(context.request.url).origin;

        // Helper to generate a single signed URL
        const generateUrl = (targetKey: string) => {
            // For Cloudflare R2 with Pages, we use a different approach:
            // Generate a time-limited token that our download endpoint can verify
            const token = btoa(JSON.stringify({
                bucket,
                key: targetKey,
                expiry,
                action,
            }));

            // Build the signed URL pointing to our download endpoint
            return action === 'download'
                ? `${baseUrl}/api/storage/download?token=${encodeURIComponent(token)}`
                : `${baseUrl}/api/storage/upload-presigned?token=${encodeURIComponent(token)}`;
        };

        // Handle Batch Mode
        if (keys && keys.length > 0) {
            const results: Record<string, string> = {};
            keys.forEach(k => {
                results[k] = generateUrl(k);
            });

            return new Response(
                JSON.stringify({
                    success: true,
                    urls: results, // Map of key -> url
                    expiresAt: new Date(expiry).toISOString(),
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Handle Single Mode (Backward Compatibility)
        if (key) {
            const signedUrl = generateUrl(key);

            return new Response(
                JSON.stringify({
                    success: true,
                    url: signedUrl,
                    expiresAt: new Date(expiry).toISOString(),
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return new Response(
            JSON.stringify({ error: 'Invalid request parameters' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Signed URL error:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to generate signed URL',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
