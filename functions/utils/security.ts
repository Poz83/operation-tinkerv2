
// Basic security checks for image uploads

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/**
 * Validates the request for basic security:
 * 1. Checks content length (if available)
 * 2. Checks content type
 */
export function validateImageRequest(request: Request, maxSize = MAX_FILE_SIZE) {
    // 1. Check Content-Length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
        const sizeLabel = maxSize < 1024 * 1024 ? `${Math.round(maxSize / 1024)}KB` : `${maxSize / (1024 * 1024)}MB`;
        throw new Error(`File too large (max ${sizeLabel})`);
    }

    // 2. Check Content-Type
    const contentType = request.headers.get('content-type');

    // For POST requests (getting a signed URL), we might receive JSON or no content-type if empty body
    // But usually for the actual upload (PUT), or the POST with body, valid type is needed.

    // If it's the specific JSON POST to get a key, we allow 'application/json'
    if (request.method === 'POST' && contentType?.includes('application/json')) {
        return;
    }

    if (!contentType || !ALLOWED_MIME_TYPES.some(type => contentType.includes(type))) {
        // If it's a multipart form, checks are harder, but we are doing raw uploads or JSON.
        throw new Error(`Invalid content type: ${contentType}. Only images (PNG, JPEG, WEBP) are allowed.`);
    }
}
