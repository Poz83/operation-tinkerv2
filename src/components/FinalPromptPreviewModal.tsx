/**
 * FinalPromptPreviewModal - Shows the fully assembled prompt before generation
 */

import React, { useEffect } from 'react';

interface PromptPreviewData {
    userPrompt: string;
    styleLabel: string;
    audienceLabel: string;
    complexityLabel: string;
    pageSizeLabel: string;
    systemPrompt: string;
}

interface FinalPromptPreviewModalProps {
    isOpen: boolean;
    promptData: PromptPreviewData | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const FinalPromptPreviewModal: React.FC<FinalPromptPreviewModalProps> = ({
    isOpen,
    promptData,
    onConfirm,
    onCancel
}) => {
    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen || !promptData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full max-h-[80vh] shadow-2xl animate-in zoom-in-95 duration-200 border border-[hsl(var(--border))] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Final Prompt Preview</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">This is what will be sent to the AI</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg hover:bg-[hsl(var(--muted))]/20 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Settings Summary */}
                <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
                    <span className="px-2 py-1 rounded-full bg-[hsl(var(--muted))]/30 text-xs text-[hsl(var(--muted-foreground))]">
                        🎨 {promptData.styleLabel}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-[hsl(var(--muted))]/30 text-xs text-[hsl(var(--muted-foreground))]">
                        👤 {promptData.audienceLabel}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-[hsl(var(--muted))]/30 text-xs text-[hsl(var(--muted-foreground))]">
                        📐 {promptData.complexityLabel}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-[hsl(var(--muted))]/30 text-xs text-[hsl(var(--muted-foreground))]">
                        📄 {promptData.pageSizeLabel}
                    </span>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {/* User Scene Section */}
                    <div>
                        <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2">
                            Your Scene Description
                        </label>
                        <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 text-[hsl(var(--foreground))] text-sm leading-relaxed">
                            {promptData.userPrompt || <span className="italic text-[hsl(var(--muted-foreground))]">No prompt provided</span>}
                        </div>
                    </div>

                    {/* System Instructions Section */}
                    <div>
                        <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2 flex items-center gap-2">
                            System Instructions
                            <span className="text-[8px] font-normal bg-[hsl(var(--muted))]/30 px-1.5 py-0.5 rounded">Read-only</span>
                        </label>
                        <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/10 text-[hsl(var(--muted-foreground))] text-xs leading-relaxed font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {promptData.systemPrompt}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-shrink-0">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/40 font-medium transition-all"
                    >
                        Close
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl btn-primary text-white font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
};
