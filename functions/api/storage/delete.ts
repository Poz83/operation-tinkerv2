/**
 * Cloudflare Pages Function: Delete File
 * 
 * Deletes a file from R2.
 * DELETE /api/storage/delete
 * 
 * Body: { bucket, key } or { bucket, keys: string[] }
 */

interface Env {
    R2_PROJECTS: R2Bucket;
    R2_AVATARS: R2Bucket;
    R2_EXPORTS: R2Bucket;
    R2_FEEDBACK: R2Bucket;
}

interface DeleteRequest {
    bucket: 'projects' | 'avatars' | 'exports' | 'feedback';
    key?: string;
    keys?: string[];
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
    try {
        const body: DeleteRequest = await context.request.json();
        const { bucket, key, keys } = body;

        // Validate required fields
        if (!bucket) {
            return new Response(
                JSON.stringify({ error: 'Missing required field: bucket' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!key && (!keys || keys.length === 0)) {
            return new Response(
                JSON.stringify({ error: 'Missing required field: key or keys' }),
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

        // Delete single file or multiple
        const keysToDelete = keys || [key!];
        const results: { deleted: string[]; failed: string[] } = {
            deleted: [],
            failed: [],
        };

        await Promise.all(
            keysToDelete.map(async (k) => {
                try {
                    await r2Bucket.delete(k);
                    results.deleted.push(k);
                } catch {
                    results.failed.push(k);
                }
            })
        );

        return new Response(
            JSON.stringify({
                success: results.failed.length === 0,
                ...results,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Delete error:', error);
        return new Response(
            JSON.stringify({
                error: 'Delete failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
