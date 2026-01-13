/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type LoadingFXProps = {
    label?: string;
    subLabel?: string;
    progress?: number; // 0-100
    accent?: 'blue' | 'amber';
};

export const LoadingFX: React.FC<LoadingFXProps> = ({
    label = 'Generating',
    subLabel = 'Crafting your masterpiece...',
    progress = 0,
    accent = 'blue'
}) => {
    const prefersReducedMotion = useReducedMotion();
    const clampedProgress = Math.min(100, Math.max(0, progress ?? 0));
    const accentColor = accent === 'amber' ? '#fbbf24' : '#a5b4ff';

    const ringStyle = useMemo(() => {
        const circumference = 2 * Math.PI * 38; // r = 38 for 84px viewBox
        const offset = circumference * (1 - clampedProgress / 100);
        return { circumference, offset };
    }, [clampedProgress]);

    return (
        <div className="absolute inset-0 z-20 bg-[#050505]/55 backdrop-blur-sm flex flex-col items-center justify-center select-none animate-in fade-in duration-300">
            <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Soft glow */}
                <div className="absolute inset-0 rounded-full bg-white/3 blur-3xl" />

                {/* Progress ring */}
                <svg
                    className="relative z-10 w-24 h-24"
                    viewBox="0 0 100 100"
                    aria-hidden
                >
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                    </defs>
                    <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="2.5"
                        strokeDasharray={ringStyle.circumference}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                    />
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={ringStyle.circumference}
                        strokeDashoffset={ringStyle.offset}
                        initial={{ strokeDashoffset: ringStyle.circumference }}
                        animate={{
                            strokeDashoffset: ringStyle.offset,
                            opacity: prefersReducedMotion ? 1 : [0.7, 1, 0.7]
                        }}
                        transition={{
                            duration: prefersReducedMotion ? 0 : 1.2,
                            repeat: prefersReducedMotion ? 0 : Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                </svg>

                {/* Inner pulse */}
                {!prefersReducedMotion && (
                    <motion.div
                        className="absolute w-10 h-10 rounded-full border border-purple-500/20"
                        animate={{ opacity: [0.6, 0.2, 0.6], scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.13)' }}
                    />
                )}

                {/* Center dot */}
                <div
                    className="relative z-20 w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
                    style={{
                        boxShadow: '0 0 0 6px rgba(139, 92, 246, 0.08), 0 0 32px rgba(139, 92, 246, 0.25)'
                    }}
                />
            </div>

            <div className="mt-4 flex flex-col items-center text-center">
                <p className="text-sm font-semibold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {label}
                </p>
                <p className="text-[11px] text-white/60 mt-1">
                    {subLabel}
                </p>
                <div className="mt-3 px-3 py-1 rounded-full text-[10px] font-medium text-white/70 bg-white/5 border border-white/10">
                    {clampedProgress}% complete!
                </div>
            </div>
        </div>
    );
};