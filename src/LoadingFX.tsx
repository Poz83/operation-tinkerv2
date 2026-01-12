/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

export const LoadingFX: React.FC = () => {
    return (
        <div className="absolute inset-0 z-20 bg-[#000000]/40 backdrop-blur-sm flex flex-col items-center justify-center select-none animate-in fade-in duration-300">
            {/* Main Animation Container */}
            <div className="relative w-24 h-24 flex items-center justify-center">
                
                {/* Gradient Blur Background */}
                <div className="absolute w-full h-full bg-blue-500/20 rounded-full blur-2xl animate-pulse" />

                {/* Outer Ring */}
                <div className="absolute w-16 h-16 border-2 border-white/5 border-t-blue-400 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
                
                {/* Inner Ring (Reverse) */}
                <div className="absolute w-12 h-12 border-2 border-white/5 border-b-purple-400 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />

                {/* Center Icon: Sparkles */}
                <div className="relative z-10 text-white/90">
                    <svg className="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                    </svg>
                </div>
            </div>

            {/* Text Status */}
            <div className="mt-4 flex flex-col items-center">
                <p className="text-sm font-medium text-white tracking-widest uppercase">Generating</p>
                <p className="text-[10px] text-white/50 mt-1">Crafting your masterpiece...</p>
            </div>
        </div>
    );
};