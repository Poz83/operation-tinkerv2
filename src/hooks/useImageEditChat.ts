/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef } from 'react';
import { editImage, EditImageResult } from '../services/image-edit-service';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    editedImageUrl?: string;
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
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
}

export function useImageEditChat(
    onImageEdited?: (pageIndex: number, newImageUrl: string, isNewVersion: boolean) => void
): UseImageEditChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentMask, setCurrentMask] = useState<string | null>(null);
    const [selectedImage, setSelectedImageState] = useState<SelectedImage | null>(null);

    const [editHistory, setEditHistory] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);

    const abortControllerRef = useRef<AbortController | null>(null);

    const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const clearChat = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setMessages([]);
        setCurrentMask(null);
        setIsLoading(false);
        setEditHistory([]);
        setRedoStack([]);
    }, []);

    const setSelectedImage = useCallback((imageUrl: string, pageIndex: number) => {
        setSelectedImageState(prev => {
            if (prev && prev.url !== imageUrl) {
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

    const processImageData = async (url: string): Promise<{ base64: string; mimeType: string }> => {
        if (url.startsWith('data:')) {
            const matches = url.match(/^data:(.+);base64,(.+)$/);
            if (!matches) {
                throw new Error('Invalid data URL format');
            }
            return {
                mimeType: matches[1],
                base64: matches[2]
            };
        }

        try {
            const response = await fetch(url);
            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    const matches = result.match(/^data:(.+);base64,(.+)$/);
                    if (matches) {
                        resolve({
                            mimeType: matches[1],
                            base64: matches[2]
                        });
                    } else {
                        reject(new Error('Failed to convert blob to base64'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Failed to process image URL:', error);
            throw new Error(`Failed to load image: ${url.slice(0, 30)}...`);
        }
    };

    const sendEdit = useCallback(async (prompt: string) => {
        if (!selectedImage || !prompt.trim()) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: prompt,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const sourceImageData = await processImageData(selectedImage.url);
            const maskImageData = currentMask ? await processImageData(currentMask) : undefined;

            const result: EditImageResult = await editImage({
                sourceImage: sourceImageData,
                maskImage: maskImageData,
                editPrompt: prompt,
                sourceSubject: "a black and white coloring page",
                signal: controller.signal
            });

            if (controller.signal.aborted) return;

            if (result.error) {
                const errorMessage: ChatMessage = {
                    id: generateId(),
                    role: 'assistant',
                    content: `Sorry, I couldn't complete that edit: ${result.error}`,
                    timestamp: new Date(),
                    isError: true
                };
                setMessages(prev => [...prev, errorMessage]);
            } else if (result.imageUrl) {
                const successMessage: ChatMessage = {
                    id: generateId(),
                    role: 'assistant',
                    content: 'Done! I\'ve created an edited version of your image.',
                    timestamp: new Date(),
                    editedImageUrl: result.imageUrl,
                    isApplied: false
                };
                setMessages(prev => [...prev, successMessage]);
                setCurrentMask(null);
            }
        } catch (error: any) {
            if (error.message === 'Aborted' || controller.signal.aborted) {
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
                const isNewVersion = !replace;
                onImageEdited(selectedImage.pageIndex, msg.editedImageUrl, isNewVersion);

                if (replace) {
                    setEditHistory(h => [...h, selectedImage.url]);
                    setRedoStack([]);
                }

                return prev.map(m => m.id === messageId ? { ...m, isApplied: true } : m);
            }
            return prev;
        });
    }, [selectedImage, onImageEdited]);

    const undo = useCallback(() => {
        if (editHistory.length === 0 || !selectedImage || !onImageEdited) return;

        const prevHistory = [...editHistory];
        const previousImageUrl = prevHistory.pop()!;
        setEditHistory(prevHistory);

        setRedoStack(r => [...r, selectedImage.url]);
        onImageEdited(selectedImage.pageIndex, previousImageUrl, false);
        setSelectedImageState({ url: previousImageUrl, pageIndex: selectedImage.pageIndex });
    }, [editHistory, selectedImage, onImageEdited]);

    const redo = useCallback(() => {
        if (redoStack.length === 0 || !selectedImage || !onImageEdited) return;

        const prevRedo = [...redoStack];
        const redoImageUrl = prevRedo.pop()!;
        setRedoStack(prevRedo);

        setEditHistory(h => [...h, selectedImage.url]);
        onImageEdited(selectedImage.pageIndex, redoImageUrl, false);
        setSelectedImageState({ url: redoImageUrl, pageIndex: selectedImage.pageIndex });
    }, [redoStack, selectedImage, onImageEdited]);

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
        applyEdit,
        canUndo: editHistory.length > 0,
        canRedo: redoStack.length > 0,
        undo,
        redo
    };
}
