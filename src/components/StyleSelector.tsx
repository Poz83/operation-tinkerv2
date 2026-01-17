
import React from 'react';
import { VISUAL_STYLES } from '../types';

// Import all style thumbnails
import boldEasy from '../assets/styles/bold-easy.png';
import kawaii from '../assets/styles/kawaii.png';
import whimsical from '../assets/styles/whimsical.png';
import cartoon from '../assets/styles/cartoon.png';
import botanical from '../assets/styles/botanical.png';
import mandala from '../assets/styles/mandala.png';
import fantasy from '../assets/styles/fantasy.png';
import gothic from '../assets/styles/gothic.png';
import cozy from '../assets/styles/cozy.png';
import geometric from '../assets/styles/geometric.png';
import wildlife from '../assets/styles/wildlife.png';
import floral from '../assets/styles/floral.png';
import abstract from '../assets/styles/abstract.png';

const THUMBNAILS: Record<string, string> = {
    'Cozy Hand-Drawn': cozy, // Reuses cozy thumbnail - shares similar warm aesthetic
    'Bold & Easy': boldEasy,
    'Kawaii': kawaii,
    'Whimsical': whimsical,
    'Cartoon': cartoon,
    'Botanical': botanical,
    'Mandala': mandala,
    'Fantasy': fantasy,
    'Gothic': gothic,
    'Cozy': cozy,
    'Geometric': geometric,
    'Wildlife': wildlife,
    'Floral': floral,
    'Abstract': abstract,
};

interface StyleSelectorProps {
    value: string;
    onChange: (value: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ value, onChange, isOpen, onToggle }) => {
    const selectedStyle = VISUAL_STYLES.find(s => s.id === value);

    return (
        <div className="relative">
            {/* Selected Style Preview (Closed State) */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left group"
            >
                <div className="w-12 h-12 rounded-lg bg-black/20 overflow-hidden border border-white/5 relative">
                    {selectedStyle && THUMBNAILS[selectedStyle.id] ? (
                        <img
                            src={THUMBNAILS[selectedStyle.id]}
                            alt={selectedStyle.label}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full grid place-items-center text-zinc-600 bg-zinc-900">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500 mb-0.5">Selected Style</div>
                    <div className="font-medium text-sm text-zinc-200 truncate pr-2">
                        {selectedStyle?.label || 'Select a Style...'}
                    </div>
                </div>
                <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown Grid */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={onToggle} />
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 p-2 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[320px] overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-2 gap-2">
                            {VISUAL_STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => {
                                        onChange(style.id);
                                        onToggle();
                                    }}
                                    className={`relative group rounded-lg overflow-hidden border transition-all text-left
                    ${value === style.id ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-white/5 hover:border-white/20'}
                  `}
                                >
                                    <div className="aspect-square bg-black/40 relative">
                                        {THUMBNAILS[style.id] && (
                                            <img
                                                src={THUMBNAILS[style.id]}
                                                alt={style.label}
                                                className={`w-full h-full object-cover transition-transform duration-500
                          ${value === style.id ? 'scale-110 opacity-60' : 'group-hover:scale-110 opacity-50 group-hover:opacity-100'}
                        `}
                                            />
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                                            <span className={`text-[10px] font-medium leading-tight block
                        ${value === style.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}
                      `}>
                                                {style.label.split(' (')[0]}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
