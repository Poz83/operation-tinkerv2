/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings, FEATURE_DESCRIPTIONS, StudioSettings } from '../context/settingsContext';
import { useApiKeyContext } from '../context/apiKeyContext';
import { useAuth } from '../context/AuthContext';
import settingsIcon from '../assets/settings.png';

// Toggle Switch Component
interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    id: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, id }) => (
    <button
        id={id}
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${enabled ? 'bg-white' : 'bg-white/10'
            }`}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out ${enabled
                ? 'translate-x-5 bg-black'
                : 'translate-x-0 bg-zinc-500'
                }`}
        />
    </button>
);

// Feature Toggle Row
interface FeatureToggleProps {
    settingKey: keyof Omit<StudioSettings, 'reducedMotion'>;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

const FeatureToggle: React.FC<FeatureToggleProps> = ({ settingKey, enabled, onChange }) => {
    const feature = FEATURE_DESCRIPTIONS[settingKey];

    return (
        <div className="flex items-center justify-between py-4 px-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-white/10 transition-colors">
                    {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <label
                        htmlFor={`toggle-${settingKey}`}
                        className="block text-sm font-semibold text-white cursor-pointer"
                    >
                        {feature.title}
                    </label>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        {feature.description}
                    </p>
                </div>
            </div>
            <div className="ml-4 flex-shrink-0">
                <ToggleSwitch
                    id={`toggle-${settingKey}`}
                    enabled={enabled}
                    onChange={onChange}
                />
            </div>
        </div>
    );
};

// Section Header
const SectionHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
    <div className="mb-4">
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            {title}
        </h2>
        {description && (
            <p className="text-xs text-zinc-600">{description}</p>
        )}
    </div>
);

export const Settings: React.FC = () => {
    const { settings, updateSetting, resetSettings, toggleTheme } = useSettings();
    const { hasApiKey, getMaskedKey, setApiKey, clearApiKey, validateKeyFormat } = useApiKeyContext();
    const { user, updateProfile } = useAuth();

    // API Key editing state
    const [isEditingKey, setIsEditingKey] = useState(false);
    const [newApiKey, setNewApiKey] = useState('');
    const [keyError, setKeyError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const featureKeys: (keyof Omit<StudioSettings, 'reducedMotion'>)[] = [
        'enableStylePreviews',
        'enableSmartDefaults',
        'enableKeyboardShortcuts',
        'enablePromptQuality',
        'enableSummaryCard',
        'enableCelebrations',
        'enableRecentPrompts',
    ];

    const enabledCount = featureKeys.filter(key => settings[key]).length;

    const handleUpdateKey = async () => {
        if (!newApiKey.trim()) {
            setKeyError('Please enter an API key');
            return;
        }

        setIsSubmitting(true);
        setKeyError(null);

        const result = await setApiKey(newApiKey);

        if (result.success) {
            setIsEditingKey(false);
            setNewApiKey('');
        } else {
            setKeyError(result.error || 'Failed to update key');
        }

        setIsSubmitting(false);
    };

    const handleRemoveKey = () => {
        if (window.confirm('Remove your API key? You will need to enter a new one to use the app.')) {
            clearApiKey();
        }
    };

    return (
        <div className="h-screen overflow-y-auto bg-[hsl(var(--background))] text-white">
            <div className="aurora-veil" />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[rgba(10,10,11,0.8)] backdrop-blur-xl border-b border-white/5">
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard"
                            className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors group"
                            aria-label="Back to Dashboard"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-zinc-400 group-hover:text-white transition-colors"
                            >
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center overflow-hidden">
                                <img src={settingsIcon} alt="" className="w-8 h-8 object-contain" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Settings</h1>
                                <p className="text-xs text-zinc-500">Customize your Studio experience</p>
                            </div>
                        </div>
                    </div>

                    {enabledCount > 0 && (
                        <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-zinc-300">
                            {enabledCount} feature{enabledCount !== 1 ? 's' : ''} enabled
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-6 py-8 space-y-10">

                {/* Profile Section */}
                <section>
                    <SectionHeader
                        title="Profile"
                        description="Manage your public profile"
                    />
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden p-5">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 overflow-hidden">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl text-zinc-500">
                                            {user?.email?.[0].toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                    <span className="text-xs font-medium text-white">Change</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            try {
                                                // 1. Get presigned URL or upload directly
                                                const contentType = file.type || 'image/png';

                                                const res = await fetch('/api/upload-avatar', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': contentType },
                                                    body: file
                                                });

                                                if (!res.ok) throw new Error('Upload failed');

                                                const data = await res.json() as any;
                                                let finalKey = data.key;

                                                // Handle 2-step upload (if server returned uploadUrl)
                                                if (data.uploadUrl) {
                                                    const putRes = await fetch(data.uploadUrl, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': contentType },
                                                        body: file
                                                    });

                                                    if (!putRes.ok) throw new Error('Upload PUT failed');
                                                }

                                                // 2. Update profile
                                                // view-avatar endpoint URL
                                                const avatarUrl = data.url || `/api/view-avatar?key=${finalKey}`;

                                                await updateProfile({ avatarUrl });

                                            } catch (err) {
                                                console.error('Failed to upload avatar', err);
                                                alert('Failed to upload avatar');
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">{user?.displayName || 'User'}</p>
                                <p className="text-xs text-zinc-500">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* API Key Section */}
                <section>
                    <SectionHeader
                        title="API Configuration"
                        description="Your Gemini API key for AI-powered features"
                    />
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                        {hasApiKey && !isEditingKey ? (
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">API Key Active</p>
                                            <p className="text-xs text-zinc-500 font-mono">{getMaskedKey()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditingKey(true)}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        Update Key
                                    </button>
                                    <button
                                        onClick={handleRemoveKey}
                                        className="py-2.5 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl">
                                        🔑
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {hasApiKey ? 'Update API Key' : 'Set API Key'}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            Get yours free at{' '}
                                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                                                Google AI Studio
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                <input
                                    type="password"
                                    value={newApiKey}
                                    onChange={(e) => {
                                        setNewApiKey(e.target.value);
                                        setKeyError(null);
                                    }}
                                    placeholder="AIza..."
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                    autoComplete="off"
                                />

                                {keyError && (
                                    <p className="text-red-400 text-xs">{keyError}</p>
                                )}

                                {newApiKey && !validateKeyFormat(newApiKey) && (
                                    <p className="text-amber-400 text-xs">
                                        Key format doesn't look right. Gemini keys start with "AIza"
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUpdateKey}
                                        disabled={isSubmitting || !newApiKey.trim()}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-semibold text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Key'}
                                    </button>
                                    {hasApiKey && (
                                        <button
                                            onClick={() => {
                                                setIsEditingKey(false);
                                                setNewApiKey('');
                                                setKeyError(null);
                                            }}
                                            className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-zinc-400 hover:text-white transition-all"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Security notice */}
                        <div className="px-5 py-3 bg-white/[0.01] border-t border-white/5 flex items-start gap-2">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <p className="text-xs text-zinc-500">
                                Your key is <span className="text-green-400">encrypted</span> and stored locally. It never leaves your browser.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Studio Enhancements Section */}
                <section>
                    <SectionHeader
                        title="Studio Enhancements"
                        description="Power-up your creative workflow with these features"
                    />
                    <div className="space-y-3">
                        {featureKeys.map(key => (
                            <FeatureToggle
                                key={key}
                                settingKey={key}
                                enabled={settings[key]}
                                onChange={(enabled) => updateSetting(key, enabled)}
                            />
                        ))}
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <SectionHeader title="Quick Actions" />
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                featureKeys.forEach(key => updateSetting(key, true));
                            }}
                            className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <span>✨</span>
                            Enable All
                        </button>
                        <button
                            onClick={() => {
                                featureKeys.forEach(key => updateSetting(key, false));
                            }}
                            className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <span>🧹</span>
                            Disable All
                        </button>
                    </div>
                </section>

                {/* Accessibility Section */}
                <section>
                    <SectionHeader
                        title="Display & Accessibility"
                        description="Settings that affect motion and visual presentation"
                    />
                    <div className="space-y-3">
                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between py-4 px-5 rounded-2xl bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] hover:border-[hsl(var(--border))]/80 hover:bg-[hsl(var(--card))]/80 transition-all group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-[hsl(var(--muted))] transition-colors">
                                    {settings.theme === 'light' ? '☀️' : '🌙'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label
                                        htmlFor="toggle-theme"
                                        className="block text-sm font-semibold text-[hsl(var(--foreground))] cursor-pointer"
                                    >
                                        Theme Mode
                                    </label>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                                        {settings.theme === 'light' ? 'Light mode enabled' : 'Dark mode enabled'}
                                    </p>
                                </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <ToggleSwitch
                                    id="toggle-theme"
                                    enabled={settings.theme === 'light'}
                                    onChange={toggleTheme}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-4 px-5 rounded-2xl bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] hover:border-[hsl(var(--border))]/80 hover:bg-[hsl(var(--card))]/80 transition-all group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-[hsl(var(--muted))] transition-colors">
                                    🎬
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label
                                        htmlFor="toggle-reducedMotion"
                                        className="block text-sm font-semibold text-[hsl(var(--foreground))] cursor-pointer"
                                    >
                                        Reduced Motion
                                    </label>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                                        Minimize animations throughout the app
                                    </p>
                                </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <ToggleSwitch
                                    id="toggle-reducedMotion"
                                    enabled={settings.reducedMotion}
                                    onChange={(enabled) => updateSetting('reducedMotion', enabled)}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Section */}
                <section>
                    <SectionHeader
                        title="Data & Storage"
                        description="Manage your local data and preferences"
                    />
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
                                    resetSettings();
                                }
                            }}
                            className="w-full py-4 px-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center justify-center gap-3"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Reset All Settings
                        </button>
                    </div>
                </section>

                {/* Keyboard Shortcuts Reference */}
                {settings.enableKeyboardShortcuts && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <SectionHeader
                            title="Keyboard Shortcuts Reference"
                            description="Quick actions available in Studio"
                        />
                        <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                            <div className="divide-y divide-white/5">
                                {[
                                    { keys: ['Ctrl', 'Enter'], action: 'Generate Book' },
                                    { keys: ['Ctrl', 'E'], action: 'Enhance Prompt' },
                                    { keys: ['Ctrl', 'S'], action: 'Save Project' },
                                    { keys: ['Ctrl', 'N'], action: 'New Project' },
                                ].map((shortcut, i) => (
                                    <div key={i} className="flex items-center justify-between py-3 px-5">
                                        <span className="text-sm text-zinc-400">{shortcut.action}</span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, j) => (
                                                <React.Fragment key={j}>
                                                    <kbd className="px-2 py-1 text-xs font-mono bg-white/10 border border-white/20 rounded-md text-white">
                                                        {key}
                                                    </kbd>
                                                    {j < shortcut.keys.length - 1 && (
                                                        <span className="text-zinc-600 text-xs">+</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-zinc-600 mt-2 text-center">
                            On Mac, use ⌘ Cmd instead of Ctrl
                        </p>
                    </section>
                )}

                {/* Footer */}
                <footer className="pt-8 pb-4 text-center">
                    <p className="text-xs text-zinc-600">
                        Settings are saved automatically to your browser
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default Settings;
