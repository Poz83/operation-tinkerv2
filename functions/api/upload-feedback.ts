/**
 * Upload Feedback Screenshot to R2
 * 
 * Uses R2 bucket bindings for simpler, more secure access.
 * Binding must be configured in Cloudflare Pages Settings > Functions > R2 bucket bindings
 */

import { validateImageRequest } from '../utils/security';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { env, request } = context;

        // Basic Security Check
        validateImageRequest(request);

        // Check if bucket binding exists
        if (!env.FEEDBACK_BUCKET) {
            throw new Error('FEEDBACK_BUCKET binding not configured. Add it in Cloudflare Pages Settings.');
        }

        // Generate unique filename
        const filename = `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;

        // Get the image data from request body (if sent directly)
        // Or just return a presigned-style response for client-side upload
        const contentType = request.headers.get('content-type');

        if (contentType?.includes('image/')) {
            // Direct upload - client sent the image in request body
            const imageData = await request.arrayBuffer();

            await env.FEEDBACK_BUCKET.put(filename, imageData, {
                httpMetadata: {
                    contentType: 'image/png',
                },
            });

            return new Response(JSON.stringify({
                success: true,
                key: filename,
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            // For multipart or JSON requests, just return the key
            // The client will use a separate PUT request
            return new Response(JSON.stringify({
                key: filename,
                // Construct the upload URL pointing to this same endpoint
                uploadUrl: `/api/upload-feedback?key=${filename}`,
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

    } catch (err: any) {
        console.error('Upload feedback error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

// Handle PUT requests for direct image upload
export const onRequestPut: PagesFunction<Env> = async (context) => {
    try {
        const { env, request } = context;

        // Basic Security Check
        validateImageRequest(request);

        const url = new URL(request.url);
        const key = url.searchParams.get('key');

        if (!key) {
            return new Response('Missing key parameter', { status: 400 });
        }

        if (!env.FEEDBACK_BUCKET) {
            throw new Error('FEEDBACK_BUCKET binding not configured');
        }

        const imageData = await request.arrayBuffer();

        await env.FEEDBACK_BUCKET.put(key, imageData, {
            httpMetadata: {
                contentType: request.headers.get('content-type') || 'image/png',
            },
        });

        return new Response(JSON.stringify({ success: true, key }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('Upload feedback PUT error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
