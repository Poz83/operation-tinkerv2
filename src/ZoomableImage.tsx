/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ZoomableImageProps {
    src: string;
    alt: string;
    className?: string;
    onLoad?: () => void;
    onError?: () => void;
}

interface Transform {
    scale: number;
    x: number;
    y: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.2;
const DOUBLE_CLICK_ZOOM = 2;

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ 
    src, 
    alt, 
    className = '', 
    onLoad,
    onError 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isZoomed, setIsZoomed] = useState(false);
    const lastTouchDistanceRef = useRef<number | null>(null);

    // Reset transform when image source changes
    useEffect(() => {
        setTransform({ scale: 1, x: 0, y: 0 });
        setIsZoomed(false);
    }, [src]);

    // Constrain pan to image bounds
    const constrainPan = useCallback((newTransform: Transform): Transform => {
        if (!imageRef.current || !containerRef.current) return newTransform;

        const img = imageRef.current;
        const container = containerRef.current;
        const { scale, x, y } = newTransform;

        if (scale <= 1) {
            return { scale, x: 0, y: 0 };
        }

        // Get natural image dimensions
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        
        // Get container dimensions
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // Calculate displayed image size (maintaining aspect ratio with object-contain)
        const containerAspect = containerWidth / containerHeight;
        const imageAspect = naturalWidth / naturalHeight;
        
        let displayedWidth: number;
        let displayedHeight: number;
        
        if (imageAspect > containerAspect) {
            // Image is wider - fit to width
            displayedWidth = containerWidth;
            displayedHeight = containerWidth / imageAspect;
        } else {
            // Image is taller - fit to height
            displayedHeight = containerHeight;
            displayedWidth = containerHeight * imageAspect;
        }
        
        // Calculate scaled dimensions
        const scaledWidth = displayedWidth * scale;
        const scaledHeight = displayedHeight * scale;
        
        // Calculate bounds (centered initially)
        const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
        const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);

        return {
            scale,
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y))
        };
    }, []);

    const applyTransform = useCallback((newTransform: Transform) => {
        const constrained = constrainPan(newTransform);
        setTransform(constrained);
        setIsZoomed(constrained.scale > 1);
    }, [constrainPan]);

    // Mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        
        if (!containerRef.current || !imageRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale + delta));

        if (newScale === transform.scale) return;

        // Zoom towards mouse position (relative to center)
        const scaleChange = newScale / transform.scale;
        const newX = transform.x + (mouseX - transform.x) * (1 - scaleChange);
        const newY = transform.y + (mouseY - transform.y) * (1 - scaleChange);

        applyTransform({ scale: newScale, x: newX, y: newY });
    }, [transform, applyTransform]);

    // Double click to zoom
    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        
        if (!containerRef.current || !imageRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const targetScale = isZoomed ? MIN_SCALE : DOUBLE_CLICK_ZOOM;
        const scaleChange = targetScale / transform.scale;
        const newX = transform.x + (mouseX - transform.x) * (1 - scaleChange);
        const newY = transform.y + (mouseY - transform.y) * (1 - scaleChange);

        applyTransform({ scale: targetScale, x: newX, y: newY });
    }, [transform, isZoomed, applyTransform]);

    // Mouse drag to pan
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (transform.scale <= 1) return;
        if (e.button !== 0) return; // Only left mouse button

        e.preventDefault();
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        setIsDragging(true);
        setDragStart({ 
            x: e.clientX - rect.left - centerX - transform.x, 
            y: e.clientY - rect.top - centerY - transform.y 
        });
    }, [transform]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const newX = e.clientX - rect.left - centerX - dragStart.x;
        const newY = e.clientY - rect.top - centerY - dragStart.y;
        applyTransform({ ...transform, x: newX, y: newY });
    }, [isDragging, dragStart, transform, applyTransform]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Touch pinch zoom and pan
    const getTouchDistance = (touches: TouchList): number => {
        if (touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches: TouchList, container: DOMRect): { x: number; y: number } => {
        if (touches.length === 0) return { x: 0, y: 0 };
        if (touches.length === 1) {
            return {
                x: touches[0].clientX - container.left,
                y: touches[0].clientY - container.top
            };
        }
        return {
            x: ((touches[0].clientX + touches[1].clientX) / 2) - container.left,
            y: ((touches[0].clientY + touches[1].clientY) / 2) - container.top
        };
    };

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!containerRef.current) return;

        const touches = e.touches;
        const container = containerRef.current.getBoundingClientRect();
        const centerX = container.width / 2;
        const centerY = container.height / 2;
        
        if (touches.length === 2) {
            lastTouchDistanceRef.current = getTouchDistance(touches);
        } else if (touches.length === 1 && transform.scale > 1) {
            const touch = touches[0];
            setIsDragging(true);
            setDragStart({
                x: touch.clientX - container.left - centerX - transform.x,
                y: touch.clientY - container.top - centerY - transform.y
            });
        }
    }, [transform]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        
        if (!containerRef.current) return;

        const touches = e.touches;
        const container = containerRef.current.getBoundingClientRect();
        const centerX = container.width / 2;
        const centerY = container.height / 2;

        if (touches.length === 2) {
            // Pinch zoom
            const currentDistance = getTouchDistance(touches);
            if (lastTouchDistanceRef.current !== null && lastTouchDistanceRef.current > 0) {
                const scaleChange = currentDistance / lastTouchDistanceRef.current;
                const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale * scaleChange));

                const center = getTouchCenter(touches, container);
                const relativeX = center.x - centerX;
                const relativeY = center.y - centerY;
                const scaleRatio = newScale / transform.scale;
                const newX = transform.x + (relativeX - transform.x) * (1 - scaleRatio);
                const newY = transform.y + (relativeY - transform.y) * (1 - scaleRatio);

                applyTransform({ scale: newScale, x: newX, y: newY });
            }
            lastTouchDistanceRef.current = currentDistance;
        } else if (touches.length === 1 && isDragging && transform.scale > 1) {
            // Pan
            const touch = touches[0];
            const newX = touch.clientX - container.left - centerX - dragStart.x;
            const newY = touch.clientY - container.top - centerY - dragStart.y;
            applyTransform({ ...transform, x: newX, y: newY });
        }
    }, [transform, isDragging, dragStart, applyTransform]);

    const handleTouchEnd = useCallback(() => {
        lastTouchDistanceRef.current = null;
        setIsDragging(false);
    }, []);

    // Reset zoom
    const handleReset = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        applyTransform({ scale: 1, x: 0, y: 0 });
    }, [applyTransform]);

    // Zoom in/out buttons
    const handleZoomIn = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!containerRef.current) return;

        const newScale = Math.min(MAX_SCALE, transform.scale + ZOOM_STEP);
        const scaleChange = newScale / transform.scale;
        const newX = transform.x * scaleChange;
        const newY = transform.y * scaleChange;

        applyTransform({ scale: newScale, x: newX, y: newY });
    }, [transform, applyTransform]);

    const handleZoomOut = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!containerRef.current) return;

        const newScale = Math.max(MIN_SCALE, transform.scale - ZOOM_STEP);
        const scaleChange = newScale / transform.scale;
        const newX = transform.x * scaleChange;
        const newY = transform.y * scaleChange;

        applyTransform({ scale: newScale, x: newX, y: newY });
    }, [transform, applyTransform]);

    return (
        <div 
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
                cursor: transform.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                touchAction: 'none'
            }}
        >
            <img
                ref={imageRef}
                src={src}
                alt={alt}
                onLoad={onLoad}
                onError={onError}
                className="select-none max-w-full max-h-full"
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    willChange: 'transform',
                    objectFit: transform.scale === 1 ? 'contain' : 'none'
                }}
                draggable={false}
            />

            {/* Zoom Controls */}
            {isZoomed && (
                <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 bg-white/90 backdrop-blur-md rounded-lg p-1.5 shadow-lg border border-gray-200/50">
                    <button
                        onClick={handleZoomIn}
                        disabled={transform.scale >= MAX_SCALE}
                        className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Zoom In"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                            <line x1="11" y1="8" x2="11" y2="14"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <button
                        onClick={handleZoomOut}
                        disabled={transform.scale <= MIN_SCALE}
                        className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Zoom Out"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Reset Zoom"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                            <path d="M21 3v5h-5"/>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                            <path d="M3 21v-5h5"/>
                        </svg>
                    </button>
                </div>
            )}

            {/* Zoom indicator */}
            {isZoomed && (
                <div className="absolute bottom-4 left-4 z-30 bg-white/90 backdrop-blur-md rounded px-2 py-1 text-xs font-medium text-gray-600 shadow-lg border border-gray-200/50">
                    {Math.round(transform.scale * 100)}%
                </div>
            )}
        </div>
    );
};
