import React from 'react';
import { CharacterDNA, VISUAL_STYLES } from '../types';

interface CharacterSetupProps {
    dna: CharacterDNA;
    setDna: (dna: CharacterDNA) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    projectName: string;
    setProjectName: (name: string) => void;
    seed: number;
    setSeed: (seed: number) => void;
}

export const CharacterSetup: React.FC<CharacterSetupProps> = ({
    dna,
    setDna,
    onGenerate,
    isGenerating,
    projectName,
    setProjectName,
    seed,
    setSeed
}) => {
    const handleChange = (field: keyof CharacterDNA, value: string) => {
        setDna({ ...dna, [field]: value });
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar p-6 space-y-8">
            {/* Header / Project Name */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Hero Identity
                </label>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="E.g., Captain Nova"
                    className="w-full bg-transparent text-2xl font-bold text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/50 outline-none border-b border-transparent focus:border-[hsl(var(--primary))] transition-all pb-1"
                />
            </div>

            {/* Core Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Name</label>
                    <input
                        type="text"
                        value={dna.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Role / Archetype</label>
                    <input
                        type="text"
                        value={dna.role}
                        onChange={(e) => handleChange('role', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
                        placeholder="Space Commander"
                    />
                </div>
            </div>

            {/* DNA Fields Form */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-[hsl(var(--border))]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span className="text-sm font-semibold">Physical Traits</span>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Age</label>
                        <input
                            type="text"
                            value={dna.age}
                            onChange={(e) => handleChange('age', e.target.value)}
                            placeholder="Early 30s"
                            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Face Structure</label>
                        <textarea
                            value={dna.face}
                            onChange={(e) => handleChange('face', e.target.value)}
                            placeholder="Square jawline, high cheekbones, straight nose..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Eyes</label>
                        <input
                            type="text"
                            value={dna.eyes}
                            onChange={(e) => handleChange('eyes', e.target.value)}
                            placeholder="Almond-shaped amber eyes"
                            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Hair</label>
                        <input
                            type="text"
                            value={dna.hair}
                            onChange={(e) => handleChange('hair', e.target.value)}
                            placeholder="Jet-black, straight, shoulder-length"
                            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Body Type</label>
                        <input
                            type="text"
                            value={dna.body}
                            onChange={(e) => handleChange('body', e.target.value)}
                            placeholder="Athletic build, tall"
                            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 pb-2 border-b border-[hsl(var(--border))]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                    <span className="text-sm font-semibold">Style & Gear</span>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Signature Features (Anchors)</label>
                        <textarea
                            value={dna.signatureFeatures}
                            onChange={(e) => handleChange('signatureFeatures', e.target.value)}
                            placeholder="Silver star pendant, fingerless gloves, scar on cheek..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Outfit Canon</label>
                        <textarea
                            value={dna.outfitCanon}
                            onChange={(e) => handleChange('outfitCanon', e.target.value)}
                            placeholder="Deep blue tactical suit, armor accents..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Visual Style</label>
                        <select
                            value={dna.styleLock}
                            onChange={(e) => handleChange('styleLock', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 appearance-none"
                        >
                            <option value="">Select a style...</option>
                            {VISUAL_STYLES.map(style => (
                                <option key={style.id} value={style.id}>{style.label}</option>
                            ))}
                        </select>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Generation Seed</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={seed || ''}
                                    onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                                    placeholder="Random"
                                    className="flex-1 px-3 py-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 font-mono"
                                />
                                <button
                                    onClick={() => setSeed(Math.floor(Math.random() * 100000000))}
                                    className="p-2 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 transition-colors"
                                    title="Randomize Seed"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                        <path d="M3 3v5h5"></path>
                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                                        <path d="M16 21h5v-5"></path>
                                    </svg>
                                </button>
                            </div>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Keep same seed for similar compositions.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating || !dna.name}
                        className="w-full py-3 rounded-xl btn-primary text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? 'Forging Hero...' : '✨ Create Base Hero'}
                    </button>
                </div>
            </div>
        </div>
    );
};
