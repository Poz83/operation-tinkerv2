/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings, FEATURE_DESCRIPTIONS, StudioSettings } from '../context/settingsContext';
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
    const { settings, updateSetting, resetSettings } = useSettings();

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

    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-white">
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
                        title="Accessibility"
                        description="Settings that affect motion and visual presentation"
                    />
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-4 px-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-white/10 transition-colors">
                                    🎬
                                </div>
                                <div className="flex-1 min-w-0">
                                    <label
                                        htmlFor="toggle-reducedMotion"
                                        className="block text-sm font-semibold text-white cursor-pointer"
                                    >
                                        Reduced Motion
                                    </label>
                                    <p className="text-xs text-zinc-500 mt-0.5">
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
