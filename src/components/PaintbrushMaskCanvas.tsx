/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PaintbrushMaskCanvasProps {
    imageUrl: string;
    isActive: boolean;
    brushColor?: string;
    onMaskGenerated: (maskDataUrl: string | null) => void;
}

interface Stroke {
    points: { x: number; y: number }[];
    brushSize: number;
}

/**
 * Canvas overlay for drawing edit masks on images.
 * Generates a binary mask where blue = edit regions.
 */
export const PaintbrushMaskCanvas: React.FC<PaintbrushMaskCanvasProps> = ({
    imageUrl,
    isActive,
    brushColor = 'rgba(59, 130, 246, 0.5)', // Blue with 50% opacity
    onMaskGenerated,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(30);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

    // Load image to get natural dimensions
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // Reset canvas when image changes
    useEffect(() => {
        setStrokes([]);
        setCurrentStroke(null);
        onMaskGenerated(null);
    }, [imageUrl, onMaskGenerated]);

    // Redraw canvas whenever strokes change
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match container
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw all strokes
        const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

        allStrokes.forEach(stroke => {
            if (stroke.points.length < 2) return;

            ctx.strokeStyle = brushColor;
            ctx.fillStyle = brushColor;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = stroke.brushSize;

            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();

            // Draw circles at each point for smoother appearance
            stroke.points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, stroke.brushSize / 2, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }, [strokes, currentStroke, brushColor]);

    // Generate mask image for API
    const generateMaskImage = useCallback(() => {
        if (!imageDimensions || strokes.length === 0) {
            onMaskGenerated(null);
            return;
        }

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // Create a new canvas at the original image dimensions
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = imageDimensions.width;
        maskCanvas.height = imageDimensions.height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return;

        // Fill with black (preserve regions)
        maskCtx.fillStyle = '#000000';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        // Calculate scale between display canvas and original image
        const displayRect = container.getBoundingClientRect();
        const scaleX = imageDimensions.width / displayRect.width;
        const scaleY = imageDimensions.height / displayRect.height;

        // Draw strokes in white (edit regions)
        maskCtx.strokeStyle = '#FFFFFF';
        maskCtx.fillStyle = '#FFFFFF';
        maskCtx.lineCap = 'round';
        maskCtx.lineJoin = 'round';

        strokes.forEach(stroke => {
            if (stroke.points.length < 2) return;

            const scaledBrushSize = stroke.brushSize * Math.max(scaleX, scaleY);
            maskCtx.lineWidth = scaledBrushSize;

            maskCtx.beginPath();
            maskCtx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);

            for (let i = 1; i < stroke.points.length; i++) {
                maskCtx.lineTo(stroke.points[i].x * scaleX, stroke.points[i].y * scaleY);
            }
            maskCtx.stroke();

            // Fill circles for smoother mask
            stroke.points.forEach(point => {
                maskCtx.beginPath();
                maskCtx.arc(point.x * scaleX, point.y * scaleY, scaledBrushSize / 2, 0, Math.PI * 2);
                maskCtx.fill();
            });
        });

        const maskDataUrl = maskCanvas.toDataURL('image/png');
        onMaskGenerated(maskDataUrl);
    }, [imageDimensions, strokes, onMaskGenerated]);

    // Update mask whenever strokes change
    useEffect(() => {
        generateMaskImage();
    }, [strokes, generateMaskImage]);

    const getPointerPosition = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) {
            if (e.touches.length === 0) return null;
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isActive) return;

        const pos = getPointerPosition(e);
        if (!pos) return;

        setIsDrawing(true);
        setCurrentStroke({
            points: [pos],
            brushSize
        });
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !isActive || !currentStroke) return;

        const pos = getPointerPosition(e);
        if (!pos) return;

        setCurrentStroke(prev => {
            if (!prev) return null;
            return {
                ...prev,
                points: [...prev.points, pos]
            };
        });
    };

    const handlePointerUp = () => {
        if (!isDrawing || !currentStroke) return;

        setStrokes(prev => [...prev, currentStroke]);
        setCurrentStroke(null);
        setIsDrawing(false);
    };

    const handleUndo = () => {
        setStrokes(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setStrokes([]);
        onMaskGenerated(null);
    };

    if (!isActive) return null;

    return (
        <div className="paintbrush-mask-overlay">
            {/* Canvas overlay */}
            <div
                ref={containerRef}
                className="paintbrush-canvas-container"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
            >
                <canvas
                    ref={canvasRef}
                    className="paintbrush-canvas"
                    style={{ cursor: isActive ? 'crosshair' : 'default' }}
                />
            </div>

            {/* Toolbar */}
            <div className="paintbrush-toolbar">
                <div className="paintbrush-toolbar-group">
                    <label className="paintbrush-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 19l7-7 3 3-7 7-3-3z" />
                            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                            <path d="M2 2l7.586 7.586" />
                            <circle cx="11" cy="11" r="2" />
                        </svg>
                        <span>Brush Size</span>
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="brush-size-slider"
                    />
                    <span className="brush-size-value">{brushSize}px</span>
                </div>

                <div className="paintbrush-toolbar-actions">
                    <button
                        onClick={handleUndo}
                        disabled={strokes.length === 0}
                        className="paintbrush-btn"
                        title="Undo last stroke"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 7v6h6" />
                            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                        Undo
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={strokes.length === 0}
                        className="paintbrush-btn paintbrush-btn-danger"
                        title="Clear all marks"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        Clear
                    </button>
                </div>
            </div>

            {/* Instructions */}
            {strokes.length === 0 && (
                <div className="paintbrush-hint">
                    <span className="paintbrush-hint-icon">🖌️</span>
                    Draw on the image to mark regions you want to edit
                </div>
            )}
        </div>
    );
};
