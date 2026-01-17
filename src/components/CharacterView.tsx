import React from 'react';
import { HeroProject } from '../types';

interface CharacterViewProps {
    baseImageUrl?: string;
    isGenerating: boolean;
    projectName: string;
    onImageUpload: (file: File) => void;
    onUseInStudio: () => void;
}

export const CharacterView: React.FC<CharacterViewProps> = ({
    baseImageUrl,
    isGenerating,
    projectName,
    onImageUpload,
    onUseInStudio
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };

    return (
        <div className="flex-1 h-full bg-[hsl(var(--background))] relative overflow-hidden flex flex-col items-center justify-center p-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            />

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            <div className="relative z-10 w-full max-w-xl aspect-[3/4] bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden flex flex-col">

                {/* Header/Title Bar */}
                <div className="h-12 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/10 flex items-center px-6 justify-between">
                    <span className="font-mono text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                        HERO REFERENCE CARD
                    </span>
                    <span className="font-bold text-sm text-[hsl(var(--foreground))]">
                        {projectName || "UNTITLED HERO"}
                    </span>
                </div>

                {/* Image Area */}
                <div className="flex-1 bg-white relative group flex items-center justify-center p-4">
                    {isGenerating ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-zinc-400 font-medium animate-pulse">Forging Character DNA...</p>
                        </div>
                    ) : baseImageUrl ? (
                        <div className="relative w-full h-full">
                            <img
                                src={baseImageUrl}
                                alt={projectName}
                                className="w-full h-full object-contain"
                            />
                            {/* Hover Actions Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white text-sm font-medium transition-colors border border-white/20"
                                >
                                    Replace Image
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 opacity-30 cursor-pointer hover:opacity-50 transition-opacity" onClick={() => fileInputRef.current?.click()}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <p className="font-medium">No character generated yet</p>
                            <p className="text-xs max-w-xs text-center">Generate one or click to upload your own reference.</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="h-10 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/10 flex items-center px-4 justify-between text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                    <span>ID: {isGenerating ? 'GENERATING...' : (baseImageUrl ? 'HERO-001' : '---')}</span>
                    <span>STATUS: {baseImageUrl ? 'READY' : 'WAITING'}</span>
                </div>
            </div>

            {/* Main Action Bar */}
            <div className="relative z-10 mt-8 flex gap-4">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-all shadow-sm font-medium text-sm"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Upload Image
                </button>

                {baseImageUrl && (
                    <button
                        onClick={onUseInStudio}
                        className="flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all font-bold text-sm"
                    >
                        <span>Use in Studio</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};
