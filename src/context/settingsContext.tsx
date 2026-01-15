/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Studio Enhancement Settings
export interface StudioSettings {
    // Feature Toggles
    enableStylePreviews: boolean;      // Visual thumbnails for styles
    enableSmartDefaults: boolean;      // AI-suggested settings from prompt
    enableKeyboardShortcuts: boolean;  // Cmd+Enter, Cmd+E, etc.
    enablePromptQuality: boolean;      // Prompt strength meter
    enableSummaryCard: boolean;        // Pre-generation confirmation card
    enableCelebrations: boolean;       // Completion effects (confetti)
    enableRecentPrompts: boolean;      // Prompt history dropdown

    // Accessibility
    reducedMotion: boolean;            // Disable animations
}

// Default settings - all features OFF for clean experience
const DEFAULT_SETTINGS: StudioSettings = {
    enableStylePreviews: false,
    enableSmartDefaults: false,
    enableKeyboardShortcuts: false,
    enablePromptQuality: false,
    enableSummaryCard: false,
    enableCelebrations: false,
    enableRecentPrompts: false,
    reducedMotion: typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
};

const STORAGE_KEY = 'myjoe_studio_settings';

interface SettingsContextType {
    settings: StudioSettings;
    updateSetting: <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;
    updateSettings: (updates: Partial<StudioSettings>) => void;
    resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Load settings from localStorage
function loadSettings(): StudioSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to handle new settings added in updates
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch (e) {
        console.warn('Failed to load settings, using defaults:', e);
    }
    return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings: StudioSettings): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}

interface SettingsProviderProps {
    children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const [settings, setSettings] = useState<StudioSettings>(loadSettings);

    // Save to localStorage whenever settings change
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    // Listen for system reduced motion preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = (e: MediaQueryListEvent) => {
            setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const updateSetting = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateSettings = (updates: Partial<StudioSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, updateSettings, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

// Hook for consuming settings
export function useSettings(): SettingsContextType {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

// Feature flag descriptions for UI
export const FEATURE_DESCRIPTIONS: Record<keyof Omit<StudioSettings, 'reducedMotion'>, { title: string; description: string; icon: string }> = {
    enableStylePreviews: {
        title: 'Visual Style Previews',
        description: 'See thumbnail previews when selecting visual styles',
        icon: '🎨',
    },
    enableSmartDefaults: {
        title: 'Smart Defaults',
        description: 'AI analyzes your prompt and suggests optimal settings',
        icon: '🧠',
    },
    enableKeyboardShortcuts: {
        title: 'Keyboard Shortcuts',
        description: 'Use Ctrl/Cmd+Enter to generate, Ctrl/Cmd+E to enhance',
        icon: '⌨️',
    },
    enablePromptQuality: {
        title: 'Prompt Quality Indicator',
        description: 'Shows how detailed your prompt is for better results',
        icon: '📊',
    },
    enableSummaryCard: {
        title: 'Generation Summary',
        description: 'Review your settings before creating your book',
        icon: '📋',
    },
    enableCelebrations: {
        title: 'Celebration Effects',
        description: 'Confetti and animations when your book is complete',
        icon: '🎉',
    },
    enableRecentPrompts: {
        title: 'Recent Prompts',
        description: 'Quick access to your previously used prompts',
        icon: '📝',
    },
};
