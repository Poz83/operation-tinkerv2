/**
 * ClarifyVisionModal - Asks clarifying questions to help AI understand user's creative vision
 * Triggered by "Make it Better" button before prompt enhancement
 */

import React, { useState, useEffect } from 'react';

export interface ClarifyingQuestion {
    id: string;
    question: string;
    options: string[];
    allowMultiple?: boolean;
    freeTextPlaceholder?: string;
}

interface ClarifyVisionModalProps {
    isOpen: boolean;
    questions: ClarifyingQuestion[];
    isLoading?: boolean;
    onSubmit: (answers: Record<string, string[]>) => void;
    onSkip: () => void;
    onCancel: () => void;
}

export const ClarifyVisionModal: React.FC<ClarifyVisionModalProps> = ({
    isOpen,
    questions,
    isLoading = false,
    onSubmit,
    onSkip,
    onCancel,
}) => {
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [freeTextAnswers, setFreeTextAnswers] = useState<Record<string, string>>({});

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setAnswers({});
            setFreeTextAnswers({});
        }
    }, [isOpen]);

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

    const toggleOption = (questionId: string, option: string, allowMultiple: boolean) => {
        setAnswers(prev => {
            const current = prev[questionId] || [];
            if (allowMultiple) {
                return {
                    ...prev,
                    [questionId]: current.includes(option)
                        ? current.filter(o => o !== option)
                        : [...current, option]
                };
            } else {
                return {
                    ...prev,
                    [questionId]: current.includes(option) ? [] : [option]
                };
            }
        });
    };

    const handleSubmit = () => {
        // Combine selected options with free text
        const finalAnswers: Record<string, string[]> = { ...answers };
        const entries = Object.entries(freeTextAnswers) as [string, string][];
        for (const [qId, text] of entries) {
            if (text && text.trim()) {
                finalAnswers[qId] = [...(finalAnswers[qId] || []), text.trim()];
            }
        }
        onSubmit(finalAnswers);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel p-6 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-[hsl(var(--border))]">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Clarify Your Vision</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Help us understand your idea better (optional)</p>
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

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-2 text-amber-400">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm font-medium">Analyzing your idea...</span>
                        </div>
                    </div>
                )}

                {/* Questions */}
                {!isLoading && questions.length > 0 && (
                    <div className="space-y-5 max-h-[50vh] overflow-y-auto">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="space-y-2">
                                <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                                    {idx + 1}. {q.question}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {q.options.map(option => {
                                        const isSelected = (answers[q.id] || []).includes(option);
                                        return (
                                            <button
                                                key={option}
                                                onClick={() => toggleOption(q.id, option, q.allowMultiple || false)}
                                                className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                                                    isSelected
                                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                                }`}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                                {q.freeTextPlaceholder && (
                                    <input
                                        type="text"
                                        value={freeTextAnswers[q.id] || ''}
                                        onChange={(e) => setFreeTextAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                        placeholder={q.freeTextPlaceholder}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {!isLoading && (
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onSkip}
                            className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/40 font-medium transition-all"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Apply & Continue
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
