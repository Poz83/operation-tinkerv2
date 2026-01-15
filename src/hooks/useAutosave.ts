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

    const save = useCallback(async () => {
        if (!enabled) return;

        // Check if actually changed
        const currentJson = JSON.stringify(projectRef.current);
        if (currentJson === lastSavedProjectJson.current) {
            return;
        }

        try {
            setStatus('saving');
            setError(null);

            const saved = await onSave(projectRef.current);

            setLastSavedAt(new Date());
            setStatus('saved');
            lastSavedProjectJson.current = JSON.stringify(saved); // Update baseline

        } catch (err) {
            console.error('Autosave failed:', err);
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    }, [onSave, enabled]);

    // Debounce effect
    useEffect(() => {
        if (!enabled) return;

        const currentJson = JSON.stringify(project);
        if (currentJson === lastSavedProjectJson.current) {
            setStatus('saved');
            return;
        }

        setStatus('unsaved');

        const handler = setTimeout(() => {
            save();
        }, interval);

        return () => {
            clearTimeout(handler);
        };
    }, [project, interval, save, enabled]);

    return {
        status,
        lastSavedAt,
        error,
        saveNow: save // Allow manual trigger
    };
}
