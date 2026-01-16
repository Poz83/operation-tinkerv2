/**
 * Upload Avatar to R2
 * 
 * Handles uploading user avatars to the AVATARS_BUCKET.
 */

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { env, request } = context;

        if (!env.AVATARS_BUCKET) {
            throw new Error('AVATARS_BUCKET binding not configured.');
        }

        // Generate unique filename
        const filename = `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;

        const contentType = request.headers.get('content-type');

        if (contentType?.includes('image/')) {
            // Direct upload
            const imageData = await request.arrayBuffer();

            await env.AVATARS_BUCKET.put(filename, imageData, {
                httpMetadata: {
                    contentType: contentType || 'image/png',
                },
            });

            return new Response(JSON.stringify({
                success: true,
                key: filename,
                url: `/api/view-avatar?key=${filename}`
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            // Return key for client to PUT
            return new Response(JSON.stringify({
                key: filename,
                uploadUrl: `/api/upload-avatar?key=${filename}`,
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

    } catch (err: any) {
        console.error('Upload avatar error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
    try {
        const { env, request } = context;
        const url = new URL(request.url);
        const key = url.searchParams.get('key');

        if (!key) {
            return new Response('Missing key parameter', { status: 400 });
        }

        if (!env.AVATARS_BUCKET) {
            throw new Error('AVATARS_BUCKET binding not configured');
        }

        const imageData = await request.arrayBuffer();

        await env.AVATARS_BUCKET.put(key, imageData, {
            httpMetadata: {
                contentType: request.headers.get('content-type') || 'image/png',
            },
        });

        return new Response(JSON.stringify({
            success: true,
            key,
            url: `/api/view-avatar?key=${key}`
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('Upload avatar PUT error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
