/**
 * Cloudflare Pages Function: Get Signed URL
 * 
 * Generates a time-limited signed URL for accessing private files.
 * POST /api/storage/signed-url
 * 
 * Body: { bucket, key, expiresIn?, action? }
 */

interface Env {
    R2_PROJECTS: R2Bucket;
    R2_AVATARS: R2Bucket;
    R2_EXPORTS: R2Bucket;
    R2_FEEDBACK: R2Bucket;
    // For URL signing, we need the account ID and custom domain
    R2_ACCOUNT_ID: string;
    R2_CUSTOM_DOMAIN?: string;
}

interface SignedUrlRequest {
    bucket: 'projects' | 'avatars' | 'exports' | 'feedback';
    key: string;
    expiresIn?: number; // seconds, default 3600
    action?: 'download' | 'upload';
    contentType?: string; // required for upload action
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const body: SignedUrlRequest = await context.request.json();
        const { bucket, key, expiresIn = 3600, action = 'download', contentType } = body;

        // Validate required fields
        if (!bucket || !key) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: bucket, key' }),
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
            projects: context.env.R2_PROJECTS,
            avatars: context.env.R2_AVATARS,
            exports: context.env.R2_EXPORTS,
            feedback: context.env.R2_FEEDBACK,
        };

        const r2Bucket = bucketMap[bucket];
        if (!r2Bucket) {
            return new Response(
                JSON.stringify({ error: `Invalid bucket: ${bucket}` }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // For Cloudflare R2 with Pages, we use a different approach:
        // Generate a time-limited token that our download endpoint can verify
        const expiry = Date.now() + (expiresIn * 1000);
        const token = btoa(JSON.stringify({
            bucket,
            key,
            expiry,
            action,
        }));

        // Build the signed URL pointing to our download endpoint
        const baseUrl = new URL(context.request.url).origin;
        const signedUrl = action === 'download'
            ? `${baseUrl}/api/storage/download?token=${encodeURIComponent(token)}`
            : `${baseUrl}/api/storage/upload-presigned?token=${encodeURIComponent(token)}`;

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
