/**
 * Crypto Utilities for API Key Encryption
 * 
 * Uses Web Crypto API for AES-GCM encryption of sensitive data at rest.
 * This provides a layer of protection for API keys stored in localStorage.
 */

// Static app identifier used as part of key derivation
const APP_SALT = 'myjoe-creative-suite-v1';

/**
 * Derive an encryption key from the app salt
 * Uses PBKDF2 with a static salt for consistent key derivation
 */
async function deriveKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(APP_SALT),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('myjoe-api-key-salt'),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt an API key for secure storage
 * @param apiKey - The plain text API key to encrypt
 * @returns Base64-encoded encrypted string with IV prepended
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
    try {
        const key = await deriveKey();
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);

        // Generate a random IV for each encryption
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encryptedData.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedData), iv.length);

        // Convert to base64 for storage
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt API key');
    }
}

/**
 * Decrypt an API key from storage
 * @param encryptedKey - Base64-encoded encrypted string
 * @returns The decrypted plain text API key
 */
export async function decryptApiKey(encryptedKey: string): Promise<string> {
    try {
        const key = await deriveKey();

        // Decode from base64
        const combined = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));

        // Extract IV and encrypted data
        const iv = combined.slice(0, 12);
        const encryptedData = combined.slice(12);

        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encryptedData
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt API key');
    }
}

/**
 * Validate that a string looks like a Gemini API key
 * Gemini API keys typically start with 'AIza' and are 39 characters
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
    // Basic validation: starts with 'AIza' and has reasonable length
    return /^AIza[A-Za-z0-9_-]{35}$/.test(apiKey.trim());
}

/**
 * Mask an API key for display (e.g., "AIza...xYz1")
 */
export function maskApiKey(apiKey: string): string {
    if (apiKey.length < 8) return '••••••••';
    return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

const STORAGE_KEY = 'myjoe_encrypted_api_key';

/**
 * Get the stored API key from localStorage (decrypted)
 * Returns null if no key is stored or decryption fails
 * This is useful for services that need the key without going through React context
 */
export async function getStoredApiKey(): Promise<string | null> {
    try {
        const encryptedKey = localStorage.getItem(STORAGE_KEY);
        if (!encryptedKey) return null;
        return await decryptApiKey(encryptedKey);
    } catch (error) {
        console.error('Failed to retrieve stored API key:', error);
        return null;
    }
}
