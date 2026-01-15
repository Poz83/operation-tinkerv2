/**
 * View Feedback Image from R2
 * 
 * Serves images stored in R2 for the admin dashboard.
 * Uses R2 bucket bindings for direct access.
 */

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const key = url.searchParams.get('key');

        if (!key) {
            return new Response('Missing key parameter', { status: 400 });
        }

        if (!env.FEEDBACK_BUCKET) {
            throw new Error('FEEDBACK_BUCKET binding not configured. Add it in Cloudflare Pages Settings.');
        }

        // Get the object from R2
        const object = await env.FEEDBACK_BUCKET.get(key);

        if (!object) {
            return new Response('Image not found', { status: 404 });
        }

        // Return the image with proper headers
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/png');
        headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        headers.set('ETag', object.httpEtag);

        return new Response(object.body, { headers });

    } catch (err: any) {
        console.error('View feedback image error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
