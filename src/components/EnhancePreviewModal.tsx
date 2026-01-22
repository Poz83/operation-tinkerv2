/**
 * EnhancePreviewModal - Shows enhanced prompt for review/editing before applying
 */

import React, { useState, useEffect } from 'react';

interface EnhancePreviewModalProps {
    isOpen: boolean;
    enhancedPrompt: string;
    onAccept: (finalPrompt: string) => void;
    onTryAgain: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const EnhancePreviewModal: React.FC<EnhancePreviewModalProps> = ({
    isOpen,
    enhancedPrompt,
    onAccept,
    onTryAgain,
    onCancel,
    isLoading = false
}) => {
    const [editedPrompt, setEditedPrompt] = useState(enhancedPrompt);

    // Sync when new enhanced prompt arrives
    useEffect(() => {
        setEditedPrompt(enhancedPrompt);
    }, [enhancedPrompt]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isLoading, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel p-6 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-[hsl(var(--border))]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Enhanced Prompt</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Review and edit before applying</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="p-2 rounded-lg hover:bg-[hsl(var(--muted))]/20 transition-colors disabled:opacity-50"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Prompt Textarea */}
                <div className="relative mb-4">
                    <textarea
                        value={editedPrompt}
                        onChange={(e) => setEditedPrompt(e.target.value)}
                        disabled={isLoading}
                        className="w-full h-48 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 text-[hsl(var(--foreground))] text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-wait"
                        placeholder="Your enhanced prompt will appear here..."
                    />
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                            <div className="flex items-center gap-2 text-purple-400">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-sm font-medium">Generating new version...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Character count */}
                <div className="text-xs text-[hsl(var(--muted-foreground))] mb-4 text-right">
                    {editedPrompt.length} characters
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onTryAgain}
                        disabled={isLoading}
                        className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/40 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                        </svg>
                        Try Again
                    </button>
                    <button
                        onClick={() => onAccept(editedPrompt)}
                        disabled={isLoading || !editedPrompt.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Use This
                    </button>
                </div>
            </div>
        </div>
    );
};
