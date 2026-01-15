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
};

/**
 * Minimal glassmorphic loading indicator for the main canvas.
 * Designed to blend with the white canvas background while maintaining
 * visual consistency with the dark theme UI.
 */
export const LoadingFX: React.FC<LoadingFXProps> = ({
    label = 'Generating',
    subLabel = 'Crafting your masterpiece...',
    progress = 0,
}) => {
    const prefersReducedMotion = useReducedMotion();
    const clampedProgress = Math.min(100, Math.max(0, progress ?? 0));

    const ringStyle = useMemo(() => {
        const circumference = 2 * Math.PI * 38;
        const offset = circumference * (1 - clampedProgress / 100);
        return { circumference, offset };
    }, [clampedProgress]);

    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center select-none animate-in fade-in duration-500">
            {/* Subtle scanline effect */}
            <div className="absolute inset-0 scanline opacity-30 pointer-events-none" />

            {/* Glass card container */}
            <div className="relative flex flex-col items-center p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg">

                {/* Progress ring */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 100 100"
                        aria-hidden
                    >
                        {/* Background ring */}
                        <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="rgba(0, 0, 0, 0.08)"
                            strokeWidth="3"
                        />
                        {/* Progress ring */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="rgba(0, 0, 0, 0.25)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={ringStyle.circumference}
                            strokeDashoffset={ringStyle.offset}
                            initial={{ strokeDashoffset: ringStyle.circumference }}
                            animate={{ strokeDashoffset: ringStyle.offset }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </svg>

                    {/* Center percentage */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-700">
                            {clampedProgress}%
                        </span>
                    </div>
                </div>

                {/* Labels */}
                <div className="mt-4 flex flex-col items-center text-center">
                    <p className="text-sm font-medium text-gray-700 tracking-tight">
                        {label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {subLabel}
                    </p>
                </div>

                {/* Subtle pulse indicator */}
                {!prefersReducedMotion && (
                    <motion.div
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-gray-300"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}
            </div>
        </div>
    );
};