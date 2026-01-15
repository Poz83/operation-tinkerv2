/**
 * Cloudflare Pages Function: Upload Image
 * 
 * Handles secure image uploads to R2 from the frontend.
 * POST /api/storage/upload
 * 
 * Body: { bucket, key, base64Data, metadata? }
 */

interface Env {
    PROJECTS_BUCKET: R2Bucket;
    AVATARS_BUCKET: R2Bucket;
    EXPORTS_BUCKET: R2Bucket;
    FEEDBACK_BUCKET: R2Bucket;
}

interface UploadRequest {
    bucket: 'projects' | 'avatars' | 'exports' | 'feedback';
    key: string;
    base64Data: string;
    metadata?: Record<string, string>;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const body: UploadRequest = await context.request.json();
        const { bucket, key, base64Data, metadata } = body;

        // Validate required fields
        if (!bucket || !key || !base64Data) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: bucket, key, base64Data' }),
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

        // Parse base64 data URL
        const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            return new Response(
                JSON.stringify({ error: 'Invalid base64 data URL format' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const contentType = matches[1];
        const rawBase64 = matches[2];

        // Convert base64 to binary
        const binaryString = atob(rawBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload to R2
        await r2Bucket.put(key, bytes, {
            httpMetadata: {
                contentType,
            },
            customMetadata: metadata,
        });

        // For avatars bucket (public), return direct URL
        // For other buckets, they'll need to request a signed URL
        const isPublic = bucket === 'avatars';

        return new Response(
            JSON.stringify({
                success: true,
                key,
                bucket,
                isPublic,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Upload error:', error);
        return new Response(
            JSON.stringify({
                error: 'Upload failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
