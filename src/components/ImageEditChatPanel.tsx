/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UseImageEditChatReturn } from '../hooks/useImageEditChat';
import { PaintbrushMaskCanvas } from './PaintbrushMaskCanvas';

interface ImageEditChatPanelProps {
    onClose: () => void;
    imageEditChat: UseImageEditChatReturn;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNext?: boolean;
    hasPrevious?: boolean;
}

/**
 * Centered popup modal for AI image editing.
 * Provides a larger image preview for easier editing.
 */
export const ImageEditChatPanel: React.FC<ImageEditChatPanelProps> = ({
    onClose,
    imageEditChat,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious
}) => {
    const {
        messages,
        isLoading,
        currentMask,
        selectedImage,
        sendEdit,
        setMask,
        clearChat,
        applyEdit,
        canUndo,
        canRedo,
        undo,
        redo
    } = imageEditChat;
    const [inputValue, setInputValue] = useState('');
    const [isMaskMode, setIsMaskMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when panel opens or image changes
    useEffect(() => {
        if (selectedImage && inputRef.current) {
            // Small delay to ensure render
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [selectedImage]);

    // Reset mask mode when image changes
    useEffect(() => {
        setIsMaskMode(false);
    }, [selectedImage?.url]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        sendEdit(inputValue.trim());
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    if (!selectedImage) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 transition-opacity" onClick={onClose} />

            {/* Panel */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                <div className="bg-[#18181b] border border-[hsl(var(--border))] rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex overflow-hidden pointer-events-auto">

                    {/* Left Column: Image Canvas */}
                    <div className="flex-1 relative bg-black/40 flex items-center justify-center overflow-hidden p-2 group/canvas">
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img
                                src={selectedImage.url}
                                alt={`Page ${selectedImage.pageIndex + 1}`}
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="relative w-full h-full max-w-full max-h-full pointer-events-auto">
                                    <PaintbrushMaskCanvas
                                        imageUrl={selectedImage.url}
                                        isActive={isMaskMode}
                                        onMaskGenerated={setMask}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        {(hasPrevious || hasNext) && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPrevious?.(); }}
                                    disabled={!hasPrevious}
                                    className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white transition-all transform hover:scale-110 disabled:opacity-0 disabled:pointer-events-none z-20 ${!hasPrevious ? 'hidden' : ''}`}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                                    disabled={!hasNext}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white transition-all transform hover:scale-110 disabled:opacity-0 disabled:pointer-events-none z-20 ${!hasNext ? 'hidden' : ''}`}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Canvas Overlays */}
                        {isMaskMode && (
                            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs font-medium flex items-center gap-2 backdrop-blur-md z-10">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                Masking Mode Active
                            </div>
                        )}
                        {currentMask && !isMaskMode && (
                            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-200 text-xs font-medium flex items-center gap-2 backdrop-blur-md z-10">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                                Mask Applied
                            </div>
                        )}
                    </div>

                    {/* Right Column: Chat & Tools */}
                    <div className="w-[400px] flex flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--card))]">

                        {/* Header */}
                        <div className="p-4 border-b border-[hsl(var(--border))]">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-orange-500/10">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                        </svg>
                                    </div>
                                    <span className="font-semibold text-[hsl(var(--foreground))]">Magic Edit</span>
                                </div>
                                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" title="Close">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center gap-2 mt-4">
                                <button
                                    onClick={() => setIsMaskMode(!isMaskMode)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${isMaskMode
                                        ? 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-500/50'
                                        : 'bg-[hsl(var(--muted))]/30 hover:bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                        }`}
                                    title="Paint mask area"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 2l7.586 7.586" />
                                        <circle cx="11" cy="11" r="2" />
                                        <path d="M12 19l7-7 3 3-7 7-3-3z" />
                                    </svg>
                                    {isMaskMode ? 'Painting Mask...' : 'Brush Mask'}
                                </button>

                                <div className="flex gap-1 bg-[hsl(var(--muted))]/20 p-1 rounded-lg border border-[hsl(var(--border))]">
                                    <button
                                        onClick={undo}
                                        disabled={!canUndo}
                                        className="p-1.5 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[hsl(var(--muted))]/50 text-[hsl(var(--foreground))]"
                                        title="Undo"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 7v6h6" />
                                            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={redo}
                                        disabled={!canRedo}
                                        className="p-1.5 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[hsl(var(--muted))]/50 text-[hsl(var(--foreground))]"
                                        title="Redo"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 7v6h-6" />
                                            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[hsl(var(--background))]/30">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[hsl(var(--muted-foreground))]">
                                    <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--muted))]/20 flex items-center justify-center mb-4 text-2xl">
                                        ✨
                                    </div>
                                    <h4 className="text-[hsl(var(--foreground))] font-medium mb-1">Make Logic Edits</h4>
                                    <p className="text-sm">Describe what you want to change, or use the brush to be specific.</p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                                        >
                                            <div className={`
                                                max-w-[90%] p-3 text-sm rounded-2xl
                                                ${message.isError ? 'bg-red-500/10 border border-red-500/20 text-red-200' :
                                                    message.role === 'user'
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] rounded-bl-none'}
                                            `}>
                                                {message.content}
                                            </div>

                                            {message.editedImageUrl && (
                                                <div className="w-full rounded-xl overflow-hidden border border-[hsl(var(--border))] bg-black/20">
                                                    <img
                                                        src={message.editedImageUrl}
                                                        alt="Edited result"
                                                        className="w-full h-48 object-cover"
                                                    />
                                                    <div className="p-2 flex gap-2 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
                                                        {message.isApplied ? (
                                                            <div className="w-full py-1.5 text-center text-xs font-medium text-green-400 bg-green-500/10 rounded-lg border border-green-500/20">
                                                                ✓ Changes Applied
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => applyEdit(message.id, true)}
                                                                    className="flex-1 py-1.5 text-xs font-medium bg-[hsl(var(--foreground))] text-[hsl(var(--background))] rounded-lg hover:opacity-90 transition-opacity"
                                                                >
                                                                    Apply
                                                                </button>
                                                                <button
                                                                    onClick={() => applyEdit(message.id, false)}
                                                                    className="flex-1 py-1.5 text-xs font-medium bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--secondary))]/80 transition-colors"
                                                                >
                                                                    Save Copy
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </>
                            )}

                            {isLoading && (
                                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    AI is working on your edit...
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
                            <form onSubmit={handleSubmit} className="relative">
                                <textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={currentMask ? "Describe edit for masked area..." : "Describe what to change..."}
                                    className="w-full min-h-[50px] max-h-[120px] p-3 pr-12 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-sm outline-none resize-none"
                                    rows={2}
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="absolute right-2 bottom-2 p-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:bg-[hsl(var(--muted))]"
                                    title="Send"
                                >
                                    {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                        </svg>
                                    )}
                                </button>
                            </form>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-2 px-1 flex justify-between">
                                <span>Shift + Enter for new line</span>
                                {messages.length > 0 && (
                                    <button onClick={clearChat} className="hover:text-red-400 transition-colors">
                                        Clear History
                                    </button>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
