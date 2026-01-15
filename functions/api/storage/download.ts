/**
 * Cloudflare Pages Function: Download File
 * 
 * Serves files from R2 using a signed token.
 * GET /api/storage/download?token=...
 */

interface Env {
    PROJECTS_BUCKET: R2Bucket;
    AVATARS_BUCKET: R2Bucket;
    EXPORTS_BUCKET: R2Bucket;
    FEEDBACK_BUCKET: R2Bucket;
}

interface TokenPayload {
    bucket: string;
    key: string;
    expiry: number;
    action: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return new Response('Missing token', { status: 400 });
        }

        // Decode and verify token
        let payload: TokenPayload;
        try {
            payload = JSON.parse(atob(decodeURIComponent(token)));
        } catch {
            return new Response('Invalid token format', { status: 400 });
        }

        // Check expiry
        if (Date.now() > payload.expiry) {
            return new Response('Token expired', { status: 403 });
        }

        // Verify action
        if (payload.action !== 'download') {
            return new Response('Invalid token action', { status: 400 });
        }

        // Get the appropriate bucket binding
        const bucketMap: Record<string, R2Bucket> = {
            projects: context.env.PROJECTS_BUCKET,
            avatars: context.env.AVATARS_BUCKET,
            exports: context.env.EXPORTS_BUCKET,
            feedback: context.env.FEEDBACK_BUCKET,
        };

        const r2Bucket = bucketMap[payload.bucket];
        if (!r2Bucket) {
            return new Response('Invalid bucket', { status: 400 });
        }

        // Fetch object from R2
        const object = await r2Bucket.get(payload.key);

        if (!object) {
            return new Response('File not found', { status: 404 });
        }

        // Return the file with appropriate headers
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Cache-Control', 'private, max-age=3600');

        // Set content disposition for downloads
        const filename = payload.key.split('/').pop() || 'download';
        headers.set('Content-Disposition', `inline; filename="${filename}"`);

        return new Response(object.body, { headers });

    } catch (error) {
        console.error('Download error:', error);
        return new Response('Download failed', { status: 500 });
    }
};
