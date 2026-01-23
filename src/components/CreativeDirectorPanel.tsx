/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CREATIVE DIRECTOR PANEL — Magic Book Planning UI
 * myJoe Creative Suite - Coloring Book Studio
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * A wizard-style panel that uses the Creative Director to generate
 * a full book plan with 40 unique ideas.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react';
import { useCreativeDirector } from '../hooks/useCreativeDirector';
import { QualityTier, QUALITY_TIERS } from '../server/ai/QualityTiers';
import { AudienceId, ComplexityId, StyleId } from '../server/ai/gemini-client';
import { TARGET_AUDIENCES, VISUAL_STYLES, COMPLEXITY_LEVELS } from '../types';

interface CreativeDirectorPanelProps {
    pageCount: number;
    audienceId: AudienceId;
    complexityId: ComplexityId;
    styleId: StyleId;
    onComplete: (prompts: { pageNumber: number; prompt: string; title: string }[]) => void;
    onCancel: () => void;
    showToast?: (type: 'success' | 'error' | 'warning' | 'info', message: string, emoji?: string) => void;
}

export const CreativeDirectorPanel: React.FC<CreativeDirectorPanelProps> = ({
    pageCount,
    audienceId,
    complexityId,
    styleId,
    onComplete,
    onCancel,
    showToast,
}) => {
    const [concept, setConcept] = useState('');
    const [selectedTier, setSelectedTier] = useState<QualityTier>('swift');
    const [step, setStep] = useState<'input' | 'planning' | 'review'>('input');

    const {
        result,
        prompts,
        currentPhase,
        phaseMessage,
        progress,
        isLoading,
        error,
        createPlan,
        getImagePrompts,
        estimateCost,
        reset,
    } = useCreativeDirector();

    const handleStartPlanning = useCallback(async () => {
        if (!concept.trim()) {
            showToast?.('error', 'Please enter a book concept!', '📝');
            return;
        }

        setStep('planning');

        const planResult = await createPlan(concept, pageCount, {
            audienceId,
            complexityId,
            styleId,
            tier: selectedTier,
        });

        if (planResult?.success) {
            setStep('review');
            showToast?.('success', `Created ${planResult.prompts.length} unique ideas!`, '🎉');
        } else {
            setStep('input');
            showToast?.('error', planResult?.error || 'Planning failed', '😢');
        }
    }, [concept, pageCount, audienceId, complexityId, styleId, selectedTier, createPlan, showToast]);

    const handleApprove = useCallback(() => {
        const imagePrompts = getImagePrompts();
        onComplete(imagePrompts);
    }, [getImagePrompts, onComplete]);

    const handleReset = useCallback(() => {
        reset();
        setStep('input');
        setConcept('');
    }, [reset]);

    const costEstimate = estimateCost(selectedTier, pageCount);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: Input Step
    // ═══════════════════════════════════════════════════════════════════════════

    if (step === 'input') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-sm font-medium mb-4">
                        <span>✨</span>
                        <span>Creative Director</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/30">NEW</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">What's Your Book About?</h2>
                    <p className="text-sm text-zinc-400">
                        Give us a theme and we'll create {pageCount} unique page ideas for you.
                    </p>
                </div>

                {/* Concept Input */}
                <div className="space-y-3">
                    <textarea
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        placeholder="e.g., 'funny dumb ways to die with dark humor' or 'cats doing yoga in cozy settings'"
                        className="glass-textarea h-28 text-base leading-relaxed"
                        autoFocus
                    />
                    <p className="text-[11px] text-zinc-500">
                        💡 Be specific about the vibe! "Dark humor workplace accidents" works better than just "funny".
                    </p>
                </div>

                {/* Quality Tier Selection */}
                <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Quality Tier
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {(['swift', 'studio'] as QualityTier[]).map((tier) => {
                            const config = QUALITY_TIERS[tier];
                            const isSelected = selectedTier === tier;
                            return (
                                <button
                                    key={tier}
                                    onClick={() => setSelectedTier(tier)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                                        isSelected
                                            ? 'border-purple-500 bg-purple-500/10'
                                            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">{config.emoji}</span>
                                        <span className="font-bold text-white">{config.name}</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mb-2">{config.description}</p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-500">{config.tokenCostPerImage} token/image</span>
                                        <span className="text-emerald-400">${config.estimatedCostPerImage.toFixed(3)}/img</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Cost Estimate */}
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-white">Estimated Cost</div>
                            <div className="text-xs text-zinc-400">{pageCount} pages × {costEstimate.tierName}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-emerald-400">${costEstimate.estimatedDollars.toFixed(2)}</div>
                            <div className="text-xs text-zinc-500">{costEstimate.tokens} tokens</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStartPlanning}
                        disabled={!concept.trim()}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                        ✨ Create Book Plan
                    </button>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: Planning Step
    // ═══════════════════════════════════════════════════════════════════════════

    if (step === 'planning') {
        const phases = [
            { id: 'research', label: 'Market Research', emoji: '📊' },
            { id: 'persona', label: 'Buyer Persona', emoji: '👤' },
            { id: 'matrix', label: 'Idea Matrix', emoji: '🧩' },
            { id: 'arc', label: 'Narrative Arc', emoji: '📈' },
            { id: 'generation', label: 'Generating Ideas', emoji: '💡' },
            { id: 'critique', label: 'Self-Review', emoji: '🔍' },
        ];

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header */}
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-bounce">🧠</div>
                    <h2 className="text-xl font-bold text-white mb-2">Creative Director is Thinking...</h2>
                    <p className="text-sm text-zinc-400">"{concept}"</p>
                </div>

                {/* Progress */}
                <div className="space-y-4">
                    <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-medium text-white">{phaseMessage}</div>
                        <div className="text-xs text-zinc-500 mt-1">{Math.round(progress)}% complete</div>
                    </div>
                </div>

                {/* Phase Indicators */}
                <div className="grid grid-cols-3 gap-2">
                    {phases.map((phase) => {
                        const isPast = phases.findIndex(p => p.id === currentPhase) > phases.findIndex(p => p.id === phase.id);
                        const isCurrent = currentPhase === phase.id;
                        return (
                            <div
                                key={phase.id}
                                className={`p-3 rounded-lg text-center transition-all ${
                                    isCurrent
                                        ? 'bg-purple-500/20 border border-purple-500/50'
                                        : isPast
                                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                                            : 'bg-zinc-900/50 border border-zinc-800'
                                }`}
                            >
                                <div className="text-lg mb-1">{isPast ? '✅' : phase.emoji}</div>
                                <div className={`text-[10px] font-medium ${
                                    isCurrent ? 'text-purple-300' : isPast ? 'text-emerald-400' : 'text-zinc-500'
                                }`}>
                                    {phase.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: Review Step
    // ═══════════════════════════════════════════════════════════════════════════

    if (step === 'review' && result) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header */}
                <div className="text-center">
                    <div className="text-4xl mb-4">🎉</div>
                    <h2 className="text-xl font-bold text-white mb-2">Your Book Plan is Ready!</h2>
                    <p className="text-sm text-zinc-400">
                        {prompts.length} unique page concepts created
                    </p>
                </div>

                {/* Brief Summary */}
                {result.brief && (
                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                            Market Insight
                        </div>
                        <p className="text-sm text-white leading-relaxed">
                            {result.brief.uniqueAngle}
                        </p>
                    </div>
                )}

                {/* Persona Preview */}
                {result.persona && (
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-lg">
                                👤
                            </div>
                            <div>
                                <div className="font-bold text-white">{result.persona.name}</div>
                                <div className="text-xs text-purple-300">{result.persona.ageRange} • {result.persona.occupation}</div>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-400 italic">
                            "{result.persona.whyTheyBuy}"
                        </p>
                    </div>
                )}

                {/* Page Preview (First 5) */}
                <div className="space-y-2">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        Preview ({Math.min(5, prompts.length)} of {prompts.length} pages)
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {prompts.slice(0, 5).map((prompt, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-zinc-500">#{prompt.pageNumber}</span>
                                    <span className="font-medium text-white text-sm">{prompt.title}</span>
                                </div>
                                <p className="text-xs text-zinc-400 line-clamp-2">
                                    {prompt.visualDescription}
                                </p>
                            </div>
                        ))}
                        {prompts.length > 5 && (
                            <div className="text-center text-xs text-zinc-500 py-2">
                                + {prompts.length - 5} more pages...
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-zinc-900/50">
                        <div className="text-lg font-bold text-white">{prompts.length}</div>
                        <div className="text-[10px] text-zinc-500">Pages</div>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900/50">
                        <div className="text-lg font-bold text-emerald-400">{(result.totalDurationMs / 1000).toFixed(1)}s</div>
                        <div className="text-[10px] text-zinc-500">Planning Time</div>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900/50">
                        <div className="text-lg font-bold text-purple-400">{result.critique?.cutPrompts?.length || 0}</div>
                        <div className="text-[10px] text-zinc-500">Ideas Cut</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-3 rounded-xl btn-secondary"
                    >
                        🔄 Start Over
                    </button>
                    <button
                        onClick={handleApprove}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:opacity-90 transition-opacity"
                    >
                        ✅ Generate Images
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default CreativeDirectorPanel;
