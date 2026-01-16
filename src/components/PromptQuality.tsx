
import React, { useMemo } from 'react';

interface PromptQualityProps {
    prompt: string;
}

export const PromptQuality: React.FC<PromptQualityProps> = ({ prompt }) => {
    const score = useMemo(() => {
        if (!prompt) return 0;

        let s = 0;
        const len = prompt.length;

        // Length contribution (up to 40%)
        s += Math.min(len / 100, 1) * 40;

        // Keyword density (up to 40%)
        const keywords = ['detail', 'style', 'background', 'line', 'shading', 'texture', 'scene', 'with', 'wearing'];
        const lowerPrompt = prompt.toLowerCase();
        const keywordCount = keywords.filter(k => lowerPrompt.includes(k)).length;
        s += Math.min(keywordCount / 5, 1) * 40;

        // Complexity (20%)
        if (len > 200) s += 20;
        else if (len > 50) s += 10;

        return Math.min(Math.round(s), 100);
    }, [prompt]);

    const getColor = (s: number) => {
        if (s < 30) return 'bg-red-400';
        if (s < 70) return 'bg-amber-400';
        return 'bg-emerald-400';
    };

    const getLabel = (s: number) => {
        if (s < 30) return 'Basic';
        if (s < 70) return 'Good';
        return 'Excellent';
    };

    if (!prompt) return null;

    return (
        <div className="flex items-center gap-3 mt-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 rounded-full ${getColor(score)}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <span className={`text-[10px] font-medium ${getColor(score).replace('bg-', 'text-')}`}>
                {getLabel(score)} Quality
            </span>
        </div>
    );
};
