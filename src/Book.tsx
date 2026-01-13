/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ColoringPage, PAGE_SIZES } from './types';
import { Panel } from './Panel';
import { ErrorBoundary } from './ErrorBoundary';

interface BookProps {
    pages: ColoringPage[];
    currentSheetIndex: number;
    onSheetClick: (index: number) => void;
    pageSizeId: string;
}

export const Book: React.FC<BookProps> = ({ pages, currentSheetIndex, onSheetClick, pageSizeId }) => {
    // Determine aspect ratio from pageSizeId
    const sizeConfig = PAGE_SIZES.find(s => s.id === pageSizeId) || PAGE_SIZES[0];
    const aspectRatio = sizeConfig.width / sizeConfig.height;
    const totalPages = pages.length;
    const completedPages = pages.filter(p => !p.isLoading).length;
    const percentComplete = totalPages ? Math.round((completedPages / totalPages) * 100) : 0;

    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    
    // Track previous index to determine slide direction
    const prevIndexRef = useRef(currentSheetIndex);
    const isMountingRef = useRef(true);
    
    // Transition State
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Calculate direction synchronously for the render
    let slideClass = '';
    if (isMountingRef.current) {
        slideClass = 'animate-in fade-in zoom-in-95 duration-700 ease-out';
    } else if (currentSheetIndex > prevIndexRef.current) {
        slideClass = 'animate-in fade-in slide-in-from-right-12 duration-500 ease-out';
    } else if (currentSheetIndex < prevIndexRef.current) {
        slideClass = 'animate-in fade-in slide-in-from-left-12 duration-500 ease-out';
    } else {
        slideClass = 'animate-in fade-in duration-300';
    }

    // Scroll active item into center of the bar
    const scrollToCenter = useCallback((behavior: ScrollBehavior = 'smooth') => {
        const container = scrollRef.current;
        const selected = itemRefs.current[currentSheetIndex];

        if (container && selected) {
            const containerCenter = container.offsetWidth / 2;
            const itemCenter = selected.offsetLeft + (selected.offsetWidth / 2);
            const scrollLeft = itemCenter - containerCenter;

            container.scrollTo({
                left: scrollLeft,
                behavior: behavior
            });
        }
    }, [currentSheetIndex]);

    // Initial center and update on index change
    useEffect(() => {
        scrollToCenter('smooth');
    }, [scrollToCenter]);

    // Keep centered on resize
    useEffect(() => {
        const handleResize = () => scrollToCenter('auto'); // Instant scroll on resize to avoid lag
        window.addEventListener('resize', handleResize);
        
        let resizeObserver: ResizeObserver | null = null;
        if (scrollRef.current) {
            resizeObserver = new ResizeObserver(() => scrollToCenter('auto'));
            resizeObserver.observe(scrollRef.current);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [scrollToCenter]);

    // Update refs after render & Handle Transition State
    useEffect(() => {
        setIsTransitioning(true);
        const timer = setTimeout(() => {
            setIsTransitioning(false);
        }, 700); // Matches max animation duration

        prevIndexRef.current = currentSheetIndex;
        isMountingRef.current = false;
        
        return () => clearTimeout(timer);
    }, [currentSheetIndex]);

    // Preload adjacent images
    useEffect(() => {
        [-1, 1].forEach(offset => {
            const page = pages[currentSheetIndex + offset];
            if (page?.imageUrl && !page.isLoading) {
                const img = new Image();
                img.src = page.imageUrl;
            }
        });
    }, [currentSheetIndex, pages]);

    const activePage = pages[currentSheetIndex] || pages[0];

    return (
        <div className="relative w-full h-full flex flex-col bg-transparent">
            
            {/* Main Canvas Area */}
            <div className="flex-1 min-h-0 w-full flex items-center justify-center p-12 pb-32">
                {/* Floating Page Number - moved outside canvas to prevent clipping */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#1E1E1F]/70 backdrop-blur-md px-4 py-1 rounded-full text-xs font-medium text-white border border-white/10 transition-all pointer-events-none">
                    {activePage.isCover ? 'Cover' : `Page ${activePage.pageIndex}`}
                </div>
                
                <div 
                    className="relative bg-white shadow-2xl shadow-black/20 ring-1 ring-white/10 rounded-sm transition-all duration-300 overflow-hidden"
                    style={{ 
                        aspectRatio: `${aspectRatio}`,
                        width: 'auto',
                        height: '100%',
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }}
                >
                     {/* Content Wrapper with Keyed Animation */}
                     <div key={activePage.id} className={`w-full h-full ${slideClass}`}>
                        <ErrorBoundary>
                            <Panel 
                                page={activePage} 
                                isBack={false} 
                                generationPercent={percentComplete}
                                completedPages={completedPages}
                                totalPages={totalPages}
                            />
                        </ErrorBoundary>
                     </div>

                     {/* Subtle Loading Indicator during Transitions */}
                     {isTransitioning && !activePage.isLoading && (
                        <div className="absolute top-4 right-4 z-50 animate-in fade-in duration-200">
                             <div className="w-4 h-4 border-2 border-black/10 border-t-black/50 rounded-full animate-spin" />
                        </div>
                     )}
                </div>
            </div>

            {/* Slider Bar */}
            <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center items-end px-6 pointer-events-none">
                <div className="pointer-events-auto bg-[#1E1E1F]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/30 p-2 max-w-4xl w-full mx-auto animate-in slide-in-from-bottom-6 duration-500">
                    <div 
                        ref={scrollRef}
                        className="flex items-center gap-3 overflow-x-auto no-scrollbar px-2 snap-x"
                    >
                        {pages.map((page, idx) => {
                            const isActive = currentSheetIndex === idx;
                            return (
                                <button
                                    key={page.id}
                                    ref={el => { itemRefs.current[idx] = el; }}
                                    onClick={() => onSheetClick(idx)}
                                    className={`
                                        group relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] snap-center
                                        ${isActive
                                            ? 'w-16 h-20 opacity-100 ring-2 ring-purple-500 shadow-lg shadow-purple-500/50 z-10 scale-110'
                                            : 'w-12 h-16 opacity-40 hover:opacity-80 hover:scale-105 hover:w-14 hover:ring-2 hover:ring-purple-500/30 grayscale hover:grayscale-0'
                                        }
                                    `}
                                >
                                    <div className="absolute inset-0 bg-white">
                                        {page.isLoading ? (
                                            <div className="w-full h-full shimmer-tile bg-[#1c1c1d] border border-white/10 relative">
                                                {page.status && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                                                        <div className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-all duration-200 ${
                                                            page.status === 'cooldown' ? 'bg-amber-500 text-white' :
                                                            page.status === 'generating' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                                                            page.status === 'qa_checking' ? 'bg-purple-500 text-white' :
                                                            page.status === 'retrying' ? 'bg-orange-500 text-white' :
                                                            'bg-zinc-700 text-zinc-300'
                                                        }`}>
                                                            {page.status === 'cooldown' && page.cooldownRemaining ? `⏱ ${page.cooldownRemaining}s` :
                                                             page.status === 'generating' ? 'Creating...' :
                                                             page.status === 'qa_checking' ? 'Checking' :
                                                             page.status === 'retrying' ? 'Fixing...' :
                                                             'Up next'}
                                                        </div>
                                                        {page.statusMessage && isActive && (
                                                            <div className="text-[8px] text-white/40 text-center line-clamp-2">
                                                                {page.statusMessage}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <img
                                                src={page.imageUrl}
                                                alt={`Thumbnail ${idx}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};