/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef } from 'react';
import { editImageWithGemini, EditImageResult } from '../services/image-edit-service';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    editedImageUrl?: string; // For assistant messages that produced edits
    isError?: boolean;
    isApplied?: boolean;
}

interface SelectedImage {
    url: string;
    pageIndex: number;
}

export interface UseImageEditChatReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    currentMask: string | null;
    selectedImage: SelectedImage | null;
    sendEdit: (prompt: string) => Promise<void>;
    setMask: (maskDataUrl: string | null) => void;
    clearChat: () => void;
    setSelectedImage: (imageUrl: string, pageIndex: number) => void;
    clearSelectedImage: () => void;
    applyEdit: (messageId: string, replace: boolean) => void;
}

/**
 * Hook for managing AI image edit chat state.
 * Automatically resets chat when a new image is selected.
 */
export function useImageEditChat(
    onImageEdited?: (pageIndex: number, newImageUrl: string, isNewVersion: boolean) => void
): UseImageEditChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentMask, setCurrentMask] = useState<string | null>(null);
    const [selectedImage, setSelectedImageState] = useState<SelectedImage | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const clearChat = useCallback(() => {
        // Abort any in-progress request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setMessages([]);
        setCurrentMask(null);
        setIsLoading(false);
    }, []);

    const setSelectedImage = useCallback((imageUrl: string, pageIndex: number) => {
        // If selecting a different image, reset the chat
        setSelectedImageState(prev => {
            if (prev && prev.url !== imageUrl) {
                // Different image - reset chat
                clearChat();
            }
            return { url: imageUrl, pageIndex };
        });
    }, [clearChat]);

    const clearSelectedImage = useCallback(() => {
        setSelectedImageState(null);
        clearChat();
    }, [clearChat]);

    const setMask = useCallback((maskDataUrl: string | null) => {
        setCurrentMask(maskDataUrl);
    }, []);

    /**
     * Convert data URL to base64 and mimeType
     */
    const dataUrlToImageData = (dataUrl: string): { base64: string; mimeType: string } => {
        const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            throw new Error('Invalid data URL format');
        }
        return {
            mimeType: matches[1],
            base64: matches[2]
        };
    };

    const sendEdit = useCallback(async (prompt: string) => {
        if (!selectedImage || !prompt.trim()) return;

        // Abort any previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Add user message
        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: prompt,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const sourceImageData = dataUrlToImageData(selectedImage.url);
            const maskImageData = currentMask ? dataUrlToImageData(currentMask) : undefined;

            const result: EditImageResult = await editImageWithGemini({
                sourceImage: sourceImageData,
                maskImage: maskImageData,
                editPrompt: prompt,
                signal: controller.signal
            });

            if (controller.signal.aborted) return;

            if (result.error) {
                // Add error message
                const errorMessage: ChatMessage = {
                    id: generateId(),
                    role: 'assistant',
                    content: `Sorry, I couldn't complete that edit: ${result.error}`,
                    timestamp: new Date(),
                    isError: true
                };
                setMessages(prev => [...prev, errorMessage]);
            } else if (result.imageUrl) {
                // Add success message with edited image
                const successMessage: ChatMessage = {
                    id: generateId(),
                    role: 'assistant',
                    content: 'Done! I\'ve created an edited version of your image.',
                    timestamp: new Date(),
                    editedImageUrl: result.imageUrl,
                    isApplied: false
                };
                setMessages(prev => [...prev, successMessage]);

                // Auto-save logic removed to allow user choice
                // Clear the mask after successful edit
                setCurrentMask(null);
            }
        } catch (error: any) {
            if (error.message === 'Aborted' || controller.signal.aborted) {
                // Request was cancelled, don't add error message
                return;
            }

            const errorMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: `An error occurred: ${error.message || 'Unknown error'}`,
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
        }
    }, [selectedImage, currentMask]);

    const applyEdit = useCallback((messageId: string, replace: boolean) => {
        setMessages(prev => {
            const msg = prev.find(m => m.id === messageId);
            if (msg && msg.editedImageUrl && !msg.isApplied && selectedImage && onImageEdited) {
                // Determine if new version (NOT replace)
                const isNewVersion = !replace;
                onImageEdited(selectedImage.pageIndex, msg.editedImageUrl, isNewVersion);

                // Mark as applied
                return prev.map(m => m.id === messageId ? { ...m, isApplied: true } : m);
            }
            return prev;
        });
    }, [selectedImage, onImageEdited]);

    return {
        messages,
        isLoading,
        currentMask,
        selectedImage,
        sendEdit,
        setMask,
        clearChat,
        setSelectedImage,
        clearSelectedImage,
        applyEdit
    };
}
