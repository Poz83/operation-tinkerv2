import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { env } = context;

        // Use environment variables for credentials
        // Note: In Cloudflare Pages, set these in Settings > Environment variables
        const R2_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
        const R2_ACCESS_KEY_ID = env.CLOUDFLARE_R2_ACCESS_KEY_ID;
        const R2_SECRET_ACCESS_KEY = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
        const R2_BUCKET_NAME = env.CLOUDFLARE_R2_BUCKET_FEEDBACK;

        if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
            throw new Error('Missing R2 environment variables');
        }

        const S3 = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });

        const url = new URL(context.request.url);
        // Generate a unique filename
        const filename = `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;

        // Create the command
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: filename,
            ContentType: 'image/png',
        });

        // Generate the pre-signed URL (valid for 5 minutes)
        const uploadUrl = await getSignedUrl(S3, command, { expiresIn: 300 });

        // Construct the public URL (assuming the bucket is public or behind a domain)
        // If not mapped to a custom domain, you might need to use the R2 dev URL or worker proxy
        // For now returning the default R2 structure, but usually you map a custom domain like assets.myjoe.app
        // Or we use the S3 client to GetObject signed url if private.
        // Assuming for 'feedback' we want it public enough for admin dashboard.
        // Let's assume we have a public domain variable or we construct it.
        // Using a placeholder or the worker url if needed.
        // Actually, for now, let's just return the filename so we can construct the URL or fetch it signed later?
        // User asked for "my 'inbox' feature recalls it".
        // If we use signed URLs for upload, we should probably save the storage path.
        // But let's verify if the bucket has public access.
        // For now, let's return the key so we can save it.

        // BETTER: Return the direct public URL if mapped, or a worker URL.
        // Since we don't know the custom domain, let's assume we can access it via R2 public endpoint if enabled,
        // or we might need another function to read it.
        // Let's assume we save the Key, but code expects a URL.
        // Let's try to construct a public URL if possible, otherwise just the R2 object URL.
        // R2 doesn't have a default public URL unless you enable "R2.dev subdomain" or custom domain.
        // Let's assume R2.dev is enabled for now or we will figure it out.
        // https://pub-<hash>.r2.dev/<key>

        // Re-reading user request: "my 'inbox' feature recalls it"
        // The inbox is in the admin dashboard.
        // If the bucket is private, the admin dashboard will need a signed URL to read it.
        // For simplicity, let's assume the user will setup public access or we just store the Key and use a signed URL to view (which is safer).
        // BUT the current Admin Dashboard expects `screenshot_url` to be an image src. It won't generating signed URLs on the fly easily without refactor.
        // SO, to keep changes minimal, let's try to make the URL permanent or public.
        // I will return the KEY as well, but for `publicUrl` I will use a placeholder that needs to be replaced with the real public domain.

        // Actually, let's look at `lib/r2.ts` or similar if it existed... it didn't.
        // Let's verify if user has a domain. `myjoe.co.uk`.
        // Maybe `assets.myjoe.co.uk`?
        // I'll return the object key and the upload URL.

        return new Response(JSON.stringify({
            uploadUrl,
            key: filename,
            // If you have a public domain mapped:
            // publicUrl: `https://feedback-assets.myjoe.app/${filename}`
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

// Define Env interface for TypeScript
interface Env {
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_R2_ACCESS_KEY_ID: string;
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: string;
    CLOUDFLARE_R2_BUCKET_FEEDBACK: string;
}
