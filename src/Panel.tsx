/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { ColoringPage } from './types';
import { LoadingFX } from './LoadingFX';

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

    // Reset loading and error state when the page image source changes
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [page?.imageUrl]);

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
                    label={`Generating page ${page.pageIndex}`}
                    subLabel={`${Math.min(completedPages, totalPages)}/${totalPages || '?'} ready`}
                    progress={generationPercent}
                    accent="blue"
                />
            ) : (
                page.imageUrl && (
                    hasError ? (
                        <div className="flex flex-col items-center justify-center text-gray-300 p-8 text-center animate-in fade-in duration-300">
                             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                <line x1="3" y1="3" x2="21" y2="21" />
                            </svg>
                            <p className="text-[10px] font-medium tracking-widest uppercase opacity-50">Image Unavailable</p>
                        </div>
                    ) : (
                        <>
                            {/* Image Loading State - Gradient Placeholder */}
                            <div 
                                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100 z-10'}`}
                            >
                                <div className="w-full h-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 animate-pulse flex items-center justify-center">
                                    <div className="w-10 h-10 border-2 border-gray-200/50 border-t-gray-300 rounded-full animate-spin" />
                                </div>
                            </div>

                            {/* Download Button Overlay */}
                            <div className={`absolute top-4 right-4 z-20 transition-all duration-300 ${isLoaded ? 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0' : 'hidden'}`}>
                                <button 
                                    onClick={handleDownload}
                                    className="p-2.5 bg-white/90 hover:bg-white text-gray-600 hover:text-blue-600 rounded-full backdrop-blur-md transition-all shadow-md border border-gray-200/50 active:scale-95 flex items-center justify-center"
                                    title="Download Page"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                </button>
                             </div>

                            <img 
                                src={page.imageUrl} 
                                alt={page.prompt} 
                                onLoad={() => setIsLoaded(true)}
                                onError={() => setHasError(true)}
                                className={`w-full h-full object-contain p-8 transition-all duration-700 ease-out transform ${isLoaded ? 'opacity-100 scale-100 blur-0 hover:scale-105 hover:drop-shadow-xl' : 'opacity-0 scale-95 blur-sm'}`}
                            />
                        </>
                    )
                )
            )}
            
            {/* Watermark/Footer - kept minimal */}
            <div className="absolute bottom-4 right-4 text-gray-300 text-[10px] font-sans tracking-widest uppercase opacity-50 mix-blend-multiply pointer-events-none select-none">
                {page.isCover ? 'Studio Cover' : `Studio • ${page.pageIndex}`}
            </div>
        </div>
    );
};