
import React from 'react';
import { VISUAL_STYLES, TARGET_AUDIENCES, PAGE_SIZES } from '../types';

interface SummaryCardProps {
    onConfirm: () => void;
    onCancel: () => void;
    settings: {
        prompt: string;
        styleId: string;
        audienceId: string;
        pageSizeId: string;
        pageAmount: number;
        complexity: string;
    };
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ onConfirm, onCancel, settings }) => {
    const styleLabel = (settings.styleId && VISUAL_STYLES.find(s => s.id === settings.styleId)?.label) || settings.styleId || 'Default Style';
    const audienceLabel = (settings.audienceId && TARGET_AUDIENCES.find(a => a.id === settings.audienceId)?.label) || settings.audienceId || 'Default Audience';
    const sizeLabel = (settings.pageSizeId && PAGE_SIZES.find(s => s.id === settings.pageSizeId)?.label) || settings.pageSizeId || 'Default Size';

    // Calculate estimated credits (mock calculation)
    const baseCost = 1; // Standard cost
    const detailMulti = ['Intricate', 'Extreme Detail'].includes(settings.complexity) ? 4 : 1;
    const totalCost = settings.pageAmount * baseCost * detailMulti;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-3 border border-indigo-500/30">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Ready to Create?</h3>
                    <p className="text-zinc-400 text-xs">Review your book details below</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 space-y-3 text-sm border border-white/5 mb-6">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Style</span>
                        <span className="text-zinc-200 font-medium text-right truncate max-w-[150px]">{styleLabel}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Format</span>
                        <span className="text-zinc-200 font-medium">{settings.pageAmount} Pages • {sizeLabel}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Detail</span>
                        <span className="text-zinc-200 font-medium">{settings.complexity}</span>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-zinc-400">Total Cost</span>
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                            {totalCost} Credits
                        </span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl btn-secondary text-zinc-400 hover:text-white transition-colors text-sm"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 rounded-xl btn-primary shadow-lg shadow-indigo-500/20 text-sm font-semibold"
                    >
                        Start Creating
                    </button>
                </div>
            </div>
        </div>
    );
};
