import React from 'react';
import { HeroProject } from '../types';

interface CharacterViewProps {
    baseImageUrl?: string;
    isGenerating: boolean;
    projectName: string;
}

export const CharacterView: React.FC<CharacterViewProps> = ({
    baseImageUrl,
    isGenerating,
    projectName
}) => {
    return (
        <div className="flex-1 h-full bg-[hsl(var(--background))] relative overflow-hidden flex items-center justify-center p-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            />

            <div className="relative z-10 w-full max-w-2xl aspect-[3/4] bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden flex flex-col">

                {/* Header/Title Bar (like a trading card) */}
                <div className="h-12 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/10 flex items-center px-6 justify-between">
                    <span className="font-mono text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                        HERO REFERENCE CARD
                    </span>
                    <span className="font-bold text-sm text-[hsl(var(--foreground))]">
                        {projectName || "UNTITLED HERO"}
                    </span>
                </div>

                {/* Image Area */}
                <div className="flex-1 bg-white relative flex items-center justify-center p-4">
                    {isGenerating ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-zinc-400 font-medium animate-pulse">Forging Character DNA...</p>
                        </div>
                    ) : baseImageUrl ? (
                        <img
                            src={baseImageUrl}
                            alt={projectName}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4 opacity-30">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <p className="font-medium">No character generated yet</p>
                            <p className="text-xs max-w-xs text-center">Fill out the traits on the left and click "Create Base Hero" to start.</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="h-10 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/10 flex items-center px-4 justify-between text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                    <span>ID: {isGenerating ? 'GENERATING...' : (baseImageUrl ? 'HERO-001' : '---')}</span>
                    <span>STATUS: {baseImageUrl ? 'APPROVED' : 'PENDING'}</span>
                </div>
            </div>
        </div>
    );
};
