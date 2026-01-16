/**
 * Frontend Storage Client
 * 
 * This client makes secure API calls to the Cloudflare Pages Functions
 * that handle R2 operations on the server side.
 * 
 * Safe to use in browser code.
 */

// ============================================================================
// TYPES
// ============================================================================

export type BucketName = 'projects' | 'avatars' | 'exports' | 'feedback';

export interface UploadResult {
    success: boolean;
    key: string;
    bucket: string;
    isPublic?: boolean;
    error?: string;
}

export interface SignedUrlResult {
    success: boolean;
    url?: string;
    expiresAt?: string;
    error?: string;
}

export interface DeleteResult {
    success: boolean;
    deleted?: string[];
    failed?: string[];
    error?: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

const API_BASE = '/api/storage';

/**
 * Upload an image to R2
 */
export async function uploadImage(options: {
    bucket: BucketName;
    key: string;
    base64Data: string;
    metadata?: Record<string, string>;
}): Promise<UploadResult> {
    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options),
        });

        const data = await response.json() as { error?: string };

        if (!response.ok) {
            return {
                success: false,
                key: options.key,
                bucket: options.bucket,
                error: data.error || 'Upload failed',
            };
        }

        return data as UploadResult;
    } catch (error) {
        return {
            success: false,
            key: options.key,
            bucket: options.bucket,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Upload a File object to R2
 */
export async function uploadFile(options: {
    bucket: BucketName;
    key: string;
    file: File;
    metadata?: Record<string, string>;
}): Promise<UploadResult> {
    const { bucket, key, file, metadata } = options;

    // Convert File to base64
    const base64Data = await fileToBase64(file);

    return uploadImage({ bucket, key, base64Data, metadata });
}

/**
 * Convert a File to base64 data URL
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Get a signed URL for downloading a private file
 */
export async function getSignedDownloadUrl(options: {
    bucket: BucketName;
    key: string;
    expiresIn?: number;
}): Promise<SignedUrlResult> {
    try {
        const response = await fetch(`${API_BASE}/signed-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...options,
                action: 'download',
            }),
        });

        const data = await response.json() as { error?: string };

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Failed to get signed URL',
            };
        }

        return data as SignedUrlResult;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Get a signed URL for uploading a file directly
 */
export async function getSignedUploadUrl(options: {
    bucket: BucketName;
    key: string;
    contentType: string;
    expiresIn?: number;
}): Promise<SignedUrlResult> {
    try {
        const response = await fetch(`${API_BASE}/signed-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...options,
                action: 'upload',
            }),
        });

        const data = await response.json() as { error?: string };

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Failed to get signed URL',
            };
        }

        return data as SignedUrlResult;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Delete a file from R2
 */
export async function deleteImage(options: {
    bucket: BucketName;
    key: string;
}): Promise<DeleteResult> {
    try {
        const response = await fetch(`${API_BASE}/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options),
        });

        const data = await response.json() as { error?: string };

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Delete failed',
            };
        }

        return data as DeleteResult;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Delete multiple files from R2
 */
export async function deleteImages(options: {
    bucket: BucketName;
    keys: string[];
}): Promise<DeleteResult> {
    try {
        const response = await fetch(`${API_BASE}/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options),
        });

        const data = await response.json() as { error?: string };

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Delete failed',
            };
        }

        return data as DeleteResult;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
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
 * Generate a unique ID for images
 */
export function generateImageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default {
    uploadImage,
    uploadFile,
    getSignedDownloadUrl,
    getSignedUploadUrl,
    deleteImage,
    deleteImages,
    getProjectImagePath,
    getAvatarPath,
    getExportPath,
    generateImageId,
};
