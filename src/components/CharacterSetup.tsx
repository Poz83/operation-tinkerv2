import React, { useRef } from 'react';
import { CharacterDNA, VISUAL_STYLES, HeroReferenceMode } from '../types';

interface CharacterSetupProps {
    dna: CharacterDNA;
    setDna: (dna: CharacterDNA) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    projectName: string;
    setProjectName: (name: string) => void;
    seed: number;
    setSeed: (seed: number) => void;
    // New props for reference image
    referenceImage: { base64: string; mimeType: string } | null;
    onReferenceImageUpload: (file: File) => void;
    onReferenceImageClear: () => void;
    referenceMode: HeroReferenceMode;
    setReferenceMode: (mode: HeroReferenceMode) => void;
    isExtracting?: boolean; // DNA extraction in progress
}

export const CharacterSetup: React.FC<CharacterSetupProps> = ({
    dna,
    setDna,
    onGenerate,
    isGenerating,
    projectName,
    setProjectName,
    seed,
    setSeed,
    referenceImage,
    onReferenceImageUpload,
    onReferenceImageClear,
    referenceMode,
    setReferenceMode,
    isExtracting = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (field: keyof CharacterDNA, value: string) => {
        setDna({ ...dna, [field]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onReferenceImageUpload(file);
        }
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

            {/* Reference Image Upload Section */}
            <div className="space-y-4 p-4 rounded-xl bg-[hsl(var(--muted))]/20 border border-[hsl(var(--border))]">
                <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span className="text-sm font-semibold">Reference Image (Optional)</span>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {referenceImage ? (
                    <div className="space-y-3">
                        <div className="relative">
                            <img
                                src={referenceImage.base64.startsWith('data:') ? referenceImage.base64 : `data:${referenceImage.mimeType};base64,${referenceImage.base64}`}
                                alt="Reference"
                                className="w-full h-32 object-contain rounded-lg bg-white/5 border border-[hsl(var(--border))]"
                            />
                            <button
                                onClick={onReferenceImageClear}
                                className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                                title="Remove image"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Mode Toggle */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Reference Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setReferenceMode('replicate')}
                                    className={`p-3 rounded-xl border text-left transition-all ${referenceMode === 'replicate'
                                        ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ring))]'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">🎯</span>
                                        <span className="font-medium text-sm">Replicate</span>
                                    </div>
                                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                        Copy this hero exactly
                                    </p>
                                </button>
                                <button
                                    onClick={() => setReferenceMode('inspiration')}
                                    className={`p-3 rounded-xl border text-left transition-all ${referenceMode === 'inspiration'
                                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ring))]'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">💡</span>
                                        <span className="font-medium text-sm">Inspiration</span>
                                    </div>
                                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                        Use as creative reference
                                    </p>
                                </button>
                            </div>
                        </div>

                        {isExtracting && (
                            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Extracting character DNA...
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-6 rounded-xl border-2 border-dashed border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] transition-colors group"
                    >
                        <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <span className="text-sm font-medium">Upload a hero to replicate or inspire from</span>
                            <span className="text-[10px]">PNG, JPG up to 10MB</span>
                        </div>
                    </button>
                )}
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
                        {isGenerating ? 'Generating Profile Sheet...' : '🖼️ Generate Profile Sheet'}
                    </button>
                </div>
            </div>
        </div>
    );
};
