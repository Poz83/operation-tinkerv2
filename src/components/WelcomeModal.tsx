/**
 * Welcome Modal Component
 * 
 * First-login experience that welcomes new users, explains beta status,
 * and collects their Gemini API key.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiKeyContext } from '../context/apiKeyContext';

export const WelcomeModal: React.FC = () => {
    const { userEmail } = useAuth();
    const { setApiKey, markSetupComplete, validateKeyFormat } = useApiKeyContext();

    const [apiKeyInput, setApiKeyInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showKey, setShowKey] = useState(false);

    // Extract first name from email for personalization
    const firstName = userEmail ? userEmail.split('@')[0].split('.')[0] : 'there';
    const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (!apiKeyInput.trim()) {
            setError('Please enter your API key');
            setIsSubmitting(false);
            return;
        }

        const result = await setApiKey(apiKeyInput);

        if (result.success) {
            markSetupComplete();
        } else {
            setError(result.error || 'Failed to save API key');
        }

        setIsSubmitting(false);
    };

    const isValidFormat = apiKeyInput.length === 0 || validateKeyFormat(apiKeyInput);

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-in fade-in duration-500">
            <div className="max-w-lg w-full bg-[#131314] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header with gradient */}
                <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.15),transparent_50%)]" />

                    <div className="relative">
                        <div className="text-5xl mb-4">👋</div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Welcome, {displayName}!
                        </h1>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            We're thrilled to have you on board.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6 space-y-6">
                    {/* Beta Notice */}
                    <div className="flex gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <span className="text-xl flex-shrink-0">🚧</span>
                        <div>
                            <p className="text-amber-200/90 text-sm font-medium mb-1">
                                Early Access Beta
                            </p>
                            <p className="text-amber-200/60 text-xs leading-relaxed">
                                Things may not always work perfectly. We're actively improving!
                                Use the <strong>feedback widget</strong> in the bottom-right corner to let us know how we can do better.
                            </p>
                        </div>
                    </div>

                    {/* API Key Section */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Your Gemini API Key
                        </label>
                        <p className="text-xs text-zinc-500 mb-3">
                            To create AI-powered content, we need your personal Gemini API key.
                            Don't have one?{' '}
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 underline"
                            >
                                Get one free from Google AI Studio
                            </a>
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKeyInput}
                                    onChange={(e) => {
                                        setApiKeyInput(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="AIza..."
                                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${error
                                            ? 'border-red-500/50'
                                            : !isValidFormat
                                                ? 'border-amber-500/50'
                                                : 'border-white/10 focus:border-purple-500/50'
                                        }`}
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
                                    tabIndex={-1}
                                >
                                    {showKey ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {error && (
                                <p className="text-red-400 text-xs flex items-center gap-1.5">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {error}
                                </p>
                            )}

                            {!isValidFormat && apiKeyInput.length > 0 && (
                                <p className="text-amber-400 text-xs flex items-center gap-1.5">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    Key format doesn't look right. Gemini keys start with "AIza"
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || !apiKeyInput.trim()}
                                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25 active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Setting up...
                                    </span>
                                ) : (
                                    '🚀 Get Started'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Security Notice */}
                    <div className="flex items-start gap-2 text-xs text-zinc-500">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <p>
                            Your API key is <span className="text-green-400">encrypted</span> and stored locally on your device.
                            It never leaves your browser unencrypted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
