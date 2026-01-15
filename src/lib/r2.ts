/**
 * Cloudflare R2 Storage Client
 * 
 * R2 is S3-compatible, so we use the AWS SDK.
 * This module provides helpers for uploading, downloading, and managing files.
 * 
 * IMPORTANT: This client is for SERVER-SIDE use only (API routes, server functions).
 * Never expose R2 credentials to the browser.
 */

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Environment variables (server-side only)
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

// Bucket names
export const BUCKETS = {
    AVATARS: process.env.CLOUDFLARE_R2_BUCKET_AVATARS || 'myjoe-avatars',
    PROJECTS: process.env.CLOUDFLARE_R2_BUCKET_PROJECTS || 'myjoe-projects',
    EXPORTS: process.env.CLOUDFLARE_R2_BUCKET_EXPORTS || 'myjoe-exports',
    FEEDBACK: process.env.CLOUDFLARE_R2_BUCKET_FEEDBACK || 'myjoe-feedback',
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

// Validate required environment variables
function validateConfig() {
    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error(
            'Missing Cloudflare R2 environment variables. ' +
            'Please ensure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, ' +
            'and CLOUDFLARE_R2_SECRET_ACCESS_KEY are set.'
        );
    }
}

/**
 * Create S3 client configured for Cloudflare R2
 */
function createR2Client(): S3Client {
    validateConfig();

    return new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: accessKeyId!,
            secretAccessKey: secretAccessKey!,
        },
    });
}

// Lazy-initialized client
let r2Client: S3Client | null = null;

function getClient(): S3Client {
    if (!r2Client) {
        r2Client = createR2Client();
    }
    return r2Client;
}

// ============================================================================
// UPLOAD HELPERS
// ============================================================================

export interface UploadOptions {
    /** The bucket to upload to */
    bucket: BucketName;
    /** The key (path) for the file, e.g., 'user123/project456/image.png' */
    key: string;
    /** File content as Buffer, Uint8Array, or string */
    body: Buffer | Uint8Array | string;
    /** MIME type, e.g., 'image/png' */
    contentType: string;
    /** Optional metadata */
    metadata?: Record<string, string>;
}

export interface UploadResult {
    success: boolean;
    key: string;
    bucket: string;
    url?: string;
    error?: string;
}

/**
 * Upload a file to R2
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
    const { bucket, key, body, contentType, metadata } = options;

    try {
        const client = getClient();

        await client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
            Metadata: metadata,
        }));

        return {
            success: true,
            key,
            bucket,
            // For public buckets (avatars), return direct URL
            url: bucket === BUCKETS.AVATARS
                ? `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${key}`
                : undefined,
        };
    } catch (error) {
        console.error('R2 upload error:', error);
        return {
            success: false,
            key,
            bucket,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Upload an image from base64 data
 */
export async function uploadBase64Image(options: {
    bucket: BucketName;
    key: string;
    base64Data: string;
    metadata?: Record<string, string>;
}): Promise<UploadResult> {
    const { bucket, key, base64Data, metadata } = options;

    // Parse base64 data URL (e.g., "data:image/png;base64,iVBORw0...")
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);

    if (!matches) {
        return {
            success: false,
            key,
            bucket,
            error: 'Invalid base64 data URL format',
        };
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    return uploadFile({
        bucket,
        key,
        body: buffer,
        contentType,
        metadata,
    });
}

// ============================================================================
// SIGNED URL HELPERS
// ============================================================================

export interface SignedUrlOptions {
    /** The bucket containing the file */
    bucket: BucketName;
    /** The key (path) of the file */
    key: string;
    /** Expiration time in seconds (default: 3600 = 1 hour) */
    expiresIn?: number;
}

/**
 * Generate a signed URL for downloading a private file
 */
export async function getSignedDownloadUrl(options: SignedUrlOptions): Promise<string> {
    const { bucket, key, expiresIn = 3600 } = options;

    const client = getClient();

    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate a signed URL for uploading a file (presigned PUT)
 * Useful for direct browser-to-R2 uploads
 */
export async function getSignedUploadUrl(options: SignedUrlOptions & {
    contentType: string;
}): Promise<string> {
    const { bucket, key, expiresIn = 3600, contentType } = options;

    const client = getClient();

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(client, command, { expiresIn });
}

// ============================================================================
// DELETE HELPERS
// ============================================================================

/**
 * Delete a file from R2
 */
export async function deleteFile(options: {
    bucket: BucketName;
    key: string;
}): Promise<{ success: boolean; error?: string }> {
    const { bucket, key } = options;

    try {
        const client = getClient();

        await client.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        }));

        return { success: true };
    } catch (error) {
        console.error('R2 delete error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed',
        };
    }
}

/**
 * Delete multiple files from R2
 */
export async function deleteFiles(options: {
    bucket: BucketName;
    keys: string[];
}): Promise<{ success: boolean; deleted: string[]; failed: string[] }> {
    const { bucket, keys } = options;
    const deleted: string[] = [];
    const failed: string[] = [];

    // Delete files in parallel (with concurrency limit)
    const results = await Promise.allSettled(
        keys.map(key => deleteFile({ bucket, key }))
    );

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
            deleted.push(keys[index]);
        } else {
            failed.push(keys[index]);
        }
    });

    return {
        success: failed.length === 0,
        deleted,
        failed,
    };
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Check if a file exists in R2
 */
export async function fileExists(options: {
    bucket: BucketName;
    key: string;
}): Promise<boolean> {
    const { bucket, key } = options;

    try {
        const client = getClient();

        await client.send(new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        }));

        return true;
    } catch {
        return false;
    }
}

/**
 * List files in a bucket with optional prefix
 */
export async function listFiles(options: {
    bucket: BucketName;
    prefix?: string;
    maxKeys?: number;
}): Promise<{ keys: string[]; truncated: boolean }> {
    const { bucket, prefix, maxKeys = 1000 } = options;

    try {
        const client = getClient();

        const response = await client.send(new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            MaxKeys: maxKeys,
        }));

        const keys = response.Contents?.map(obj => obj.Key!).filter(Boolean) || [];

        return {
            keys,
            truncated: response.IsTruncated || false,
        };
    } catch (error) {
        console.error('R2 list error:', error);
        return { keys: [], truncated: false };
    }
}

// ============================================================================
// PATH HELPERS
// ============================================================================

/**
 * Generate a storage path for project images
 * Format: {userId}/{projectId}/{imageId}.{ext}
 */
export function getProjectImagePath(
    userId: string,
    projectId: string,
    imageId: string,
    extension: string = 'png'
): string {
    return `${userId}/${projectId}/${imageId}.${extension}`;
}

/**
 * Generate a storage path for user avatars
 * Format: {userId}/avatar.{ext}
 */
export function getAvatarPath(userId: string, extension: string = 'png'): string {
    return `${userId}/avatar.${extension}`;
}

/**
 * Generate a storage path for exports
 * Format: {userId}/{exportId}.{ext}
 */
export function getExportPath(userId: string, exportId: string, extension: string = 'pdf'): string {
    return `${userId}/${exportId}.${extension}`;
}

/**
 * Generate a storage path for feedback screenshots
 * Format: {feedbackId}.{ext}
 */
export function getFeedbackScreenshotPath(feedbackId: string, extension: string = 'png'): string {
    return `${feedbackId}.${extension}`;
}

export default {
    BUCKETS,
    uploadFile,
    uploadBase64Image,
    getSignedDownloadUrl,
    getSignedUploadUrl,
    deleteFile,
    deleteFiles,
    fileExists,
    listFiles,
    getProjectImagePath,
    getAvatarPath,
    getExportPath,
    getFeedbackScreenshotPath,
};
