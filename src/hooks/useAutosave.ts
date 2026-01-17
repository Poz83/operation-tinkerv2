import { useState, useEffect, useRef, useCallback } from 'react';
import type { SavedProject } from '../types';

export type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved';

interface UseAutosaveProps {
    project: SavedProject;
    onSave: (project: SavedProject) => Promise<SavedProject>;
    interval?: number; // millisecond debounce delay, default 3000
    enabled?: boolean;
}

export function useAutosave({ project, onSave, interval = 3000, enabled = true }: UseAutosaveProps) {
    const [status, setStatus] = useState<SaveStatus>('saved');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    // We use a ref to track the latest project state without triggering effects loop
    const projectRef = useRef(project);
    // Track previous saved state to compare equality (simple JSON stringify for now)
    const lastSavedProjectJson = useRef<string>(JSON.stringify(project));

    // Update ref when project changes
    useEffect(() => {
        projectRef.current = project;
    }, [project]);

    // Internal save implementation (can be forced even when disabled)
    // Returns the saved project or null if no save was needed/failed
    const performSave = useCallback(async (force = false): Promise<SavedProject | null> => {
        if (!enabled && !force) return null;

        // Check if actually changed
        const currentJson = JSON.stringify(projectRef.current);
        if (currentJson === lastSavedProjectJson.current) {
            return null;
        }

        try {
            setStatus('saving');
            setError(null);

            const saved = await onSave(projectRef.current);

            setLastSavedAt(new Date());
            setStatus('saved');
            lastSavedProjectJson.current = JSON.stringify(saved); // Update baseline

            return saved;
        } catch (err) {
            console.error('Autosave failed:', err);
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
            throw err; // Re-throw so caller can handle
        }
    }, [onSave, enabled]);

    // saveNow allows manual trigger even when autosave is disabled
    // Returns the saved project with its ID
    const saveNow = useCallback(async (): Promise<SavedProject | null> => {
        return await performSave(true);
    }, [performSave]);

    // Debounce effect
    useEffect(() => {
        const currentJson = JSON.stringify(project);
        if (currentJson === lastSavedProjectJson.current) {
            setStatus('saved');
            return;
        }

        // Mark as unsaved even if disabled (so UI can show status)
        setStatus('unsaved');

        // Only auto-save if enabled
        if (!enabled) return;

        const handler = setTimeout(() => {
            performSave();
        }, interval);

        return () => {
            clearTimeout(handler);
        };
    }, [project, interval, performSave, enabled]);

    return {
        status,
        lastSavedAt,
        error,
        saveNow // Allow manual trigger
    };
}
