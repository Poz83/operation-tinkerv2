/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useLayoutEffect } from 'react';
import { ColoringPage } from '../types';
import { LoadingFX } from './LoadingFX';
import { ZoomableImage } from './ZoomableImage';

interface PanelProps {
    page?: ColoringPage;
    isBack: boolean;
    generationPercent?: number;
    completedPages?: number;
    totalPages?: number;
}

export const Panel: React.FC<PanelProps> = ({ page, isBack, generationPercent = 0, completedPages = 0, totalPages = 0 }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Create a stable key based on the imageUrl to force ZoomableImage remount on URL change
    const imageKey = page?.imageUrl || 'no-image';

    // Use useLayoutEffect for synchronous state reset before paint
    // This ensures the state is reset BEFORE React renders the new image
    useLayoutEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [imageKey]);

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (page?.imageUrl) {
            const link = document.createElement('a');
            link.href = page.imageUrl;
            const fileName = page.isCover
                ? `cover.png`
                : `page_${page.pageIndex}.png`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Blank back of page
    if (isBack && !page) {
        return (
            <div className="w-full h-full bg-white p-8 flex flex-col justify-end items-center">
                <p className="text-gray-300 font-sans text-xs tracking-widest transform -rotate-180 uppercase">Studio Generated</p>
            </div>
        );
    }

    if (!page) return <div className="w-full h-full bg-white" />;

    return (
        <div className="w-full h-full bg-white relative overflow-hidden flex items-center justify-center group">
            {page.isLoading ? (
                <LoadingFX
                    label={`✨ Creating page ${page.pageIndex + 1}`}
                    subLabel={`${Math.min(completedPages, totalPages)} of ${totalPages || '?'} complete`}
                    progress={generationPercent}
                />
            ) : page.imageUrl ? (
                hasError ? (
                    <div className="flex flex-col items-center justify-center text-gray-400 p-8 text-center animate-in fade-in duration-300">
                        <div className="text-5xl mb-3">😕</div>
                        <p className="text-sm font-medium">Something went wrong.</p>
                        <p className="text-xs text-gray-500 mt-1">Try generating this page again?</p>
                    </div>
                ) : (
                    <>
                        {/* Image Loading State - Minimal Placeholder */}
                        <div
                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100 z-10'}`}
                        >
                            <div className="w-full h-full bg-gray-50 scanline flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
                            </div>
                        </div>

                        {/* Download Button Overlay */}
                        <div className={`absolute top-4 right-4 z-20 transition-all duration-300 ${isLoaded ? 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0' : 'hidden'}`}>
                            <button
                                onClick={handleDownload}
                                className="p-2.5 bg-white/90 hover:bg-white text-gray-600 hover:text-blue-600 rounded-full backdrop-blur-md transition-all shadow-md border border-gray-200/50 active:scale-95 flex items-center justify-center"
                                title="Download this page"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </button>
                        </div>

                        <div className={`w-full h-full p-8 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                            <ZoomableImage
                                key={imageKey}
                                src={page.imageUrl}
                                alt={page.prompt}
                                onLoad={() => setIsLoaded(true)}
                                onError={() => setHasError(true)}
                                className="w-full h-full"
                            />
                        </div>
                    </>
                )
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-8 text-center animate-in fade-in duration-300">
                    <div className="text-5xl mb-3">🖼️</div>
                    <p className="text-sm font-medium">No image generated</p>
                    <p className="text-xs text-gray-500 mt-1">Try generating this page again</p>
                </div>
            )}

            {/* Watermark/Footer - kept minimal */}
            <div className="absolute bottom-4 right-4 text-gray-300 text-[10px] font-sans tracking-widest uppercase opacity-50 mix-blend-multiply pointer-events-none select-none">
                {page.isCover ? 'Studio Cover' : `Studio • ${page.pageIndex + 1}`}
            </div>
        </div>
    );
};