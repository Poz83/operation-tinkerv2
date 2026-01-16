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
}

/**
 * Centered popup modal for AI image editing.
 * Provides a larger image preview for easier editing.
 */
export const ImageEditChatPanel: React.FC<ImageEditChatPanelProps> = ({
    onClose,
    imageEditChat
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

    // Focus input when panel opens
    useEffect(() => {
        if (selectedImage && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
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
            <div className="image-edit-backdrop" onClick={onClose} />

            {/* Panel */}
            <div className="image-edit-chat-panel">
                {/* Header */}
                <div className="image-edit-chat-header">
                    <div className="image-edit-chat-header-content">
                        <div className="image-edit-chat-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            <span>Edit Image</span>
                        </div>
                        <span className="image-edit-chat-subtitle">
                            Page {selectedImage.pageIndex + 1}
                        </span>
                    </div>
                    <div className="image-edit-chat-header-actions">
                        <button
                            onClick={() => setIsMaskMode(!isMaskMode)}
                            className={`image-edit-tool-btn ${isMaskMode ? 'active' : ''}`}
                            title="Paintbrush tool - mark areas to edit"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                <path d="M2 2l7.586 7.586" />
                                <circle cx="11" cy="11" r="2" />
                            </svg>
                        </button>
                        {/* Undo/Redo buttons */}
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className={`image-edit-tool-btn ${!canUndo ? 'disabled' : ''}`}
                            title="Undo last edit"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 7v6h6" />
                                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                            </svg>
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className={`image-edit-tool-btn ${!canRedo ? 'disabled' : ''}`}
                            title="Redo edit"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 7v6h-6" />
                                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                            </svg>
                        </button>
                        <button onClick={onClose} className="image-edit-close-btn" title="Close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18" />
                                <path d="M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Preview with mask overlay */}
                <div className="image-edit-preview-container">
                    <div className="image-edit-preview">
                        <img
                            src={selectedImage.url}
                            alt={`Page ${selectedImage.pageIndex + 1}`}
                            className="image-edit-preview-img"
                        />
                        <PaintbrushMaskCanvas
                            imageUrl={selectedImage.url}
                            isActive={isMaskMode}
                            onMaskGenerated={setMask}
                        />
                    </div>
                    {isMaskMode && (
                        <div className="image-edit-mask-indicator">
                            <span className="mask-indicator-dot" />
                            Mask Mode Active
                        </div>
                    )}
                    {currentMask && !isMaskMode && (
                        <div className="image-edit-mask-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <path d="M22 4L12 14.01l-3-3" />
                            </svg>
                            Mask Applied
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div className="image-edit-messages">
                    {messages.length === 0 ? (
                        <div className="image-edit-empty-state">
                            <div className="image-edit-empty-icon">✨</div>
                            <p className="image-edit-empty-title">Ready to Edit</p>
                            <p className="image-edit-empty-text">
                                Describe what you'd like to change.
                                {!currentMask && (
                                    <span className="image-edit-empty-tip">
                                        <br />Tip: Use the paintbrush to mark specific areas.
                                    </span>
                                )}
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'} ${message.isError ? 'chat-message-error' : ''}`}
                                >
                                    <div className="chat-message-content">
                                        {message.content}
                                    </div>
                                    {message.editedImageUrl && (
                                        <div className="chat-message-image">
                                            <img
                                                src={message.editedImageUrl}
                                                alt="Edited result"
                                                className="chat-result-image"
                                            />
                                            {message.isApplied ? (
                                                <span className="chat-result-label text-green-400">
                                                    Saved
                                                </span>
                                            ) : (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => applyEdit(message.id, true)}
                                                        className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs rounded border border-white/10 transition-colors"
                                                        title="Replace original image"
                                                    >
                                                        Replace
                                                    </button>
                                                    <button
                                                        onClick={() => applyEdit(message.id, false)}
                                                        className="flex-1 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-100 text-xs rounded border border-blue-500/30 transition-colors"
                                                        title="Add as new page"
                                                    >
                                                        + New Page
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <span className="chat-message-time">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}

                    {isLoading && (
                        <div className="chat-message chat-message-assistant chat-message-loading">
                            <div className="chat-loading-dots">
                                <span /><span /><span />
                            </div>
                            <span className="chat-loading-text">Editing image...</span>
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="image-edit-input-container">
                    <div className="image-edit-input-wrapper">
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={currentMask ? "Describe the edit for marked area..." : "Describe what to change..."}
                            className="image-edit-input"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className="image-edit-send-btn"
                            title="Send edit request"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13" />
                                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </button>
                    </div>
                    <div className="image-edit-input-footer">
                        <span className="image-edit-input-hint">
                            Press Enter to send, Shift+Enter for new line
                        </span>
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={clearChat}
                                className="image-edit-clear-btn"
                                disabled={isLoading}
                            >
                                Clear Chat
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
};
