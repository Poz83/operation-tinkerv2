/**
 * View Avatar Image from R2
 * 
 * Serves avatar images stored in R2.
 */

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const key = url.searchParams.get('key');

        if (!key) {
            return new Response('Missing key parameter', { status: 400 });
        }

        if (!env.AVATARS_BUCKET) {
            throw new Error('AVATARS_BUCKET binding not configured.');
        }

        // Get the object from R2
        const object = await env.AVATARS_BUCKET.get(key);

        if (!object) {
            return new Response('Avatar not found', { status: 404 });
        }

        // Return the image with proper headers
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/png');
        headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        headers.set('ETag', object.httpEtag);

        return new Response(object.body, { headers });

    } catch (err: any) {
        console.error('View avatar error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
