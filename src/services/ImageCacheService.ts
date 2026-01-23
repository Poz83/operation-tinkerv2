/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ImageCacheService - Client-side image caching using IndexedDB
 * 
 * Caches generated coloring book images locally to enable instant loading
 * when navigating between pages. Uses LRU eviction to manage storage.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Logger } from '../lib/logger';

interface CachedImage {
    id: string;           // Image UUID from DB
    blob: Blob;
    storagePath: string;  // R2 key for invalidation matching
    cachedAt: number;     // Timestamp for LRU eviction
    size: number;         // Blob size in bytes
}

interface ImageCacheDB extends DBSchema {
    images: {
        key: string;
        value: CachedImage;
        indexes: { 'by-cachedAt': number };
    };
}

// Configuration
const DB_NAME = 'myjoe-cache-v1';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const MAX_CACHE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

// Track active Blob URLs to prevent memory leaks
const activeBlobUrls = new Map<string, string>();

let dbPromise: Promise<IDBPDatabase<ImageCacheDB>> | null = null;

/**
 * Get or create the database connection
 */
function getDB(): Promise<IDBPDatabase<ImageCacheDB>> {
    if (!dbPromise) {
        dbPromise = openDB<ImageCacheDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('by-cachedAt', 'cachedAt');
            },
        });
    }
    return dbPromise;
}

/**
 * Get a cached image as a Blob URL
 * Returns null if not cached
 */
export async function getCachedImage(id: string): Promise<string | null> {
    try {
        const db = await getDB();
        const cached = await db.get(STORE_NAME, id);

        if (!cached) return null;

        // Revoke previous URL for this ID if exists
        const existingUrl = activeBlobUrls.get(id);
        if (existingUrl) {
            URL.revokeObjectURL(existingUrl);
        }

        // Create new Blob URL and track it
        const blobUrl = URL.createObjectURL(cached.blob);
        activeBlobUrls.set(id, blobUrl);

        return blobUrl;
    } catch (err) {
        Logger.warn('SYSTEM', 'ImageCache: Failed to get cached image', err);
        return null;
    }
}

/**
 * Cache an image blob
 */
export async function cacheImage(
    id: string,
    blob: Blob,
    storagePath: string
): Promise<void> {
    try {
        const db = await getDB();

        const entry: CachedImage = {
            id,
            blob,
            storagePath,
            cachedAt: Date.now(),
            size: blob.size
        };

        await db.put(STORE_NAME, entry);

        // Check if we need to evict old entries
        await evictIfNeeded(db);
    } catch (err) {
        Logger.warn('SYSTEM', 'ImageCache: Failed to cache image', err);
    }
}

/**
 * Cache an image from a remote URL
 */
export async function cacheFromUrl(
    id: string,
    imageUrl: string,
    storagePath: string
): Promise<void> {
    try {
        // Don't cache data URLs or blob URLs (already local)
        if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
            return;
        }

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to fetch image');

        const blob = await response.blob();
        await cacheImage(id, blob, storagePath);
    } catch (err) {
        Logger.warn('SYSTEM', 'ImageCache: Failed to cache from URL', err);
    }
}

/**
 * Check if an image is cached
 */
export async function hasCachedImage(id: string): Promise<boolean> {
    try {
        const db = await getDB();
        const cached = await db.get(STORE_NAME, id);
        return !!cached;
    } catch {
        return false;
    }
}

/**
 * Invalidate a single cached image
 */
export async function invalidateImage(id: string): Promise<void> {
    try {
        const db = await getDB();
        await db.delete(STORE_NAME, id);

        // Revoke Blob URL if exists
        const url = activeBlobUrls.get(id);
        if (url) {
            URL.revokeObjectURL(url);
            activeBlobUrls.delete(id);
        }
    } catch (err) {
        Logger.warn('SYSTEM', 'ImageCache: Failed to invalidate', err);
    }
}

/**
 * Clear entire cache
 */
export async function clearCache(): Promise<void> {
    try {
        const db = await getDB();
        await db.clear(STORE_NAME);

        // Revoke all Blob URLs
        activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
        activeBlobUrls.clear();

        Logger.info('SYSTEM', 'ImageCache: Cleared');
    } catch (err) {
        Logger.warn('SYSTEM', 'ImageCache: Failed to clear', err);
    }
}

/**
 * Get cache statistics (for debugging)
 */
export async function getCacheStats(): Promise<{ count: number; sizeBytes: number }> {
    try {
        const db = await getDB();
        const all = await db.getAll(STORE_NAME);

        const sizeBytes = all.reduce((sum, entry) => sum + entry.size, 0);
        return { count: all.length, sizeBytes };
    } catch {
        return { count: 0, sizeBytes: 0 };
    }
}

/**
 * Evict oldest entries if cache exceeds max size (LRU)
 */
async function evictIfNeeded(db: IDBPDatabase<ImageCacheDB>): Promise<void> {
    try {
        const all = await db.getAll(STORE_NAME);
        const totalSize = all.reduce((sum, entry) => sum + entry.size, 0);

        if (totalSize <= MAX_CACHE_SIZE_BYTES) return;

        // Sort by cachedAt (oldest first)
        all.sort((a, b) => a.cachedAt - b.cachedAt);

        let currentSize = totalSize;
        const toDelete: string[] = [];

        for (const entry of all) {
            if (currentSize <= MAX_CACHE_SIZE_BYTES * 0.8) break; // Keep 20% buffer

            toDelete.push(entry.id);
            currentSize -= entry.size;
        }

        // Delete old entries
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await Promise.all([
            ...toDelete.map(id => tx.store.delete(id)),
            tx.done
        ]);

        // Revoke Blob URLs
        toDelete.forEach(id => {
            const url = activeBlobUrls.get(id);
            if (url) {
                URL.revokeObjectURL(url);
                activeBlobUrls.delete(id);
            }
        });

        Logger.info('SYSTEM', `ImageCache: Evicted ${toDelete.length} entries`);
    } catch (err) {
        Logger.warn('SYSTEM', 'ImageCache: Eviction failed', err);
    }
}
