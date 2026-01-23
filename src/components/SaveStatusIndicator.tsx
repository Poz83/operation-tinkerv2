/**
 * Canva-Style Auto-Save Status Indicator
 * Shows real-time save status with subtle animations
 */

import React from 'react';
import type { SaveStatus } from '../hooks/useAutosave';

interface SaveStatusIndicatorProps {
    status: SaveStatus;
    lastSavedAt: Date | null;
    isOnline?: boolean;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
    status,
    lastSavedAt,
    isOnline = true
}) => {
    // Format relative time (e.g., "2 min ago")
    const getRelativeTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);

        if (diffSec < 10) return 'Just now';
        if (diffSec < 60) return `${diffSec}s ago`;
        if (diffMin < 60) return `${diffMin}m ago`;
        return `${diffHr}h ago`;
    };

    // Status configurations
    const statusConfig: Record<SaveStatus, { icon: React.ReactNode; text: string; className: string }> = {
        saved: {
            icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ),
            text: lastSavedAt ? `Saved ${getRelativeTime(lastSavedAt)}` : 'Saved',
            className: 'text-emerald-500'
        },
        saving: {
            icon: (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
            ),
            text: 'Saving...',
            className: 'text-amber-500'
        },
        pending: {
            icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="4" />
                </svg>
            ),
            text: 'Unsaved',
            className: 'text-amber-400'
        },
        offline: {
            icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                    <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
            ),
            text: 'Offline',
            className: 'text-zinc-400'
        },
        error: {
            icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            ),
            text: 'Save failed',
            className: 'text-red-400'
        }
    };

    const config = statusConfig[status];

    return (
        <div
            className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ${config.className}`}
            title={lastSavedAt ? `Last saved: ${lastSavedAt.toLocaleTimeString()}` : undefined}
        >
            <span className="transition-transform duration-200">{config.icon}</span>
            <span className="opacity-80">{config.text}</span>
        </div>
    );
};
