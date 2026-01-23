import { useState, useEffect, useRef, useCallback } from 'react';
import type { SavedProject } from '../types';

/**
 * Canva-style Auto-Save Status
 * - 'saved': All changes persisted ✓
 * - 'saving': Currently writing to backend
 * - 'pending': Local changes not yet saved (debounce window)
 * - 'offline': No network connection
 * - 'error': Last save failed
 */
export type SaveStatus = 'saved' | 'saving' | 'pending' | 'offline' | 'error';

interface UseAutosaveProps {
    project: SavedProject;
    onSave: (project: SavedProject) => Promise<SavedProject>;
    /** Debounce delay in ms. Default 1500ms (Canva-style responsive). */
    interval?: number;
    /** Whether autosave is active. Tip: set false during generation to avoid partial saves. */
    enabled?: boolean;
}

export function useAutosave({ project, onSave, interval = 1500, enabled = true }: UseAutosaveProps) {
    const [status, setStatus] = useState<SaveStatus>('saved');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Track latest project state without re-triggering effects
    const projectRef = useRef(project);
    // Baseline for dirty detection
    const lastSavedProjectJson = useRef<string>(JSON.stringify(project));
    // Retry queue for offline recovery
    const pendingSaveRef = useRef<boolean>(false);

    // Update ref when project changes
    useEffect(() => {
        projectRef.current = project;
    }, [project]);

    // Online/Offline detection (Canva-style)
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Retry pending save when back online
            if (pendingSaveRef.current && enabled) {
                performSave();
            }
        };
        const handleOffline = () => {
            setIsOnline(false);
            setStatus('offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [enabled]);

    // Internal save implementation (can be forced even when disabled)
    const performSave = useCallback(async (force = false): Promise<SavedProject | null> => {
        if (!enabled && !force) return null;

        // Offline? Queue for later.
        if (!navigator.onLine) {
            pendingSaveRef.current = true;
            setStatus('offline');
            return null;
        }

        // Skip if project has no meaningful content (Canva saves even without ID)
        const proj = projectRef.current;
        const hasMeaningfulContent = !!(proj.projectName || proj.userPrompt || (proj.pages && proj.pages.length > 0));
        if (!hasMeaningfulContent && !force) {
            return null;
        }

        // Check if actually changed (dirty detection)
        const currentJson = JSON.stringify(projectRef.current);
        if (currentJson === lastSavedProjectJson.current && !force) {
            setStatus('saved');
            return null;
        }

        try {
            setStatus('saving');
            setError(null);
            pendingSaveRef.current = false;

            const saved = await onSave(projectRef.current);

            // Update ref to match saved project (prevents ID-change false positives)
            projectRef.current = saved;
            lastSavedProjectJson.current = JSON.stringify(saved);
            
            setLastSavedAt(new Date());
            setStatus('saved');

            return saved;
        } catch (err) {
            console.error('Autosave failed:', err);
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
            pendingSaveRef.current = true; // Queue for retry
            throw err;
        }
    }, [onSave, enabled]);

    // saveNow allows manual trigger even when autosave is disabled
    // Returns the saved project with its ID
    const saveNow = useCallback(async (): Promise<SavedProject | null> => {
        return await performSave(true);
    }, [performSave]);

    // Debounce effect - Canva-style immediate feedback
    useEffect(() => {
        const currentJson = JSON.stringify(project);
        const isDirty = currentJson !== lastSavedProjectJson.current;

        if (!isDirty) {
            // Only set 'saved' if we're online and not in error state
            if (isOnline && status !== 'error') {
                setStatus('saved');
            }
            return;
        }

        // Immediately show pending state (Canva shows this instantly)
        if (isOnline) {
            setStatus('pending');
        }

        // Only auto-save if enabled and online
        if (!enabled || !isOnline) return;

        const handler = setTimeout(() => {
            performSave();
        }, interval);

        return () => {
            clearTimeout(handler);
        };
    }, [project, interval, performSave, enabled, isOnline, status]);

    return {
        status,
        lastSavedAt,
        error,
        isOnline,
        isSaving: status === 'saving',
        isDirty: status === 'pending' || status === 'error',
        saveNow
    };
}
