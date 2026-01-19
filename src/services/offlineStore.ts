/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OfflineStore - Client-side structured data caching using IndexedDB
 * 
 * Manages caching for projects, lists, and other structured data.
 * Complements ImageCacheService by handling metadata.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SavedProject } from '../types';

interface OfflineDB extends DBSchema {
    projects: {
        key: string; // public_id
        value: SavedProject;
        indexes: { 'by-updatedAt': number };
    };
    lists: {
        key: string; // e.g., 'user_projects', 'recent'
        value: {
            id: string;
            items: SavedProject[]; // Or just IDs if we want normalized, but full objects easier for list view
            updatedAt: number;
        };
    };
}

const DB_NAME = 'myjoe-data-v2'; // Renamed to ensure fresh start
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

function getDB(): Promise<IDBPDatabase<OfflineDB>> {
    if (!dbPromise) {
        dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                // If store names exist, we might be upgrading (though changing DB name avoids this, being safe)
                if (db.objectStoreNames.contains('projects')) {
                    db.deleteObjectStore('projects');
                }
                if (db.objectStoreNames.contains('lists')) {
                    db.deleteObjectStore('lists');
                }

                const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
                projectStore.createIndex('by-updatedAt', 'updatedAt');

                db.createObjectStore('lists', { keyPath: 'id' });
            },
        });
    }
    return dbPromise;
}

// --- Projects ---

export async function cacheProject(project: SavedProject): Promise<void> {
    const db = await getDB();
    await db.put('projects', project);
}

export async function getCachedProject(publicId: string): Promise<SavedProject | undefined> {
    const db = await getDB();
    return db.get('projects', publicId);
}

export async function deleteCachedProject(publicId: string): Promise<void> {
    const db = await getDB();
    await db.delete('projects', publicId);
}

export async function deleteCachedProjects(publicIds: string[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('projects', 'readwrite');
    await Promise.all([
        ...publicIds.map(id => tx.store.delete(id)),
        tx.done
    ]);
}

// --- Lists ---

export async function cacheProjectList(listId: string, projects: SavedProject[]): Promise<void> {
    const db = await getDB();
    await db.put('lists', {
        id: listId,
        items: projects,
        updatedAt: Date.now()
    });
}

export async function getCachedProjectList(listId: string): Promise<SavedProject[] | undefined> {
    const db = await getDB();
    const list = await db.get('lists', listId);
    return list?.items;
}

// --- General ---

export async function clearOfflineData(): Promise<void> {
    const db = await getDB();
    await db.clear('projects');
    await db.clear('lists');
}
