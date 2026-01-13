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
                        stroke={accentColor}
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
                        className="absolute w-10 h-10 rounded-full border border-white/10"
                        animate={{ opacity: [0.6, 0.2, 0.6], scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ boxShadow: `0 0 0 1px ${accentColor}22` }}
                    />
                )}

                {/* Center dot */}
                <div
                    className="relative z-20 w-3 h-3 rounded-full"
                    style={{
                        background: accentColor,
                        boxShadow: `0 0 0 6px ${accentColor}15, 0 0 32px ${accentColor}40`
                    }}
                />
            </div>

            <div className="mt-4 flex flex-col items-center text-center">
                <p className="text-sm font-semibold tracking-tight text-white">
                    {label}
                </p>
                <p className="text-[11px] text-white/60 mt-1">
                    {subLabel}
                </p>
                <div className="mt-3 px-3 py-1 rounded-full text-[10px] font-medium text-white/70 bg-white/5 border border-white/10">
                    {clampedProgress}% ready
                </div>
            </div>
        </div>
    );
};