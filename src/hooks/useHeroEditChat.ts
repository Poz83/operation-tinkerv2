/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook for managing AI character edit chat in Hero Lab.
 * Similar to useImageEditChat but tailored for character editing with DNA context.
 */

import { useState, useCallback, useRef } from 'react';
import { editImageWithGemini, EditImageResult } from '../services/image-edit-service';
import { CharacterDNA } from '../types';

export interface HeroChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    editedImageUrl?: string;
    isError?: boolean;
    isApplied?: boolean;
}

interface SelectedHeroImage {
    url: string;
    name: string;
}

export interface UseHeroEditChatReturn {
    messages: HeroChatMessage[];
    isLoading: boolean;
    currentMask: string | null;
    selectedImage: SelectedHeroImage | null;
    sendEdit: (prompt: string) => Promise<void>;
    setMask: (maskDataUrl: string | null) => void;
    clearChat: () => void;
    setSelectedImage: (imageUrl: string, name: string) => void;
    clearSelectedImage: () => void;
    applyEdit: (messageId: string, replace: boolean) => void;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
}

/**
 * Build a character-aware edit prompt that maintains DNA consistency
 */
const buildCharacterEditPrompt = (userPrompt: string, dna?: CharacterDNA): string => {
    if (!dna || !dna.name) {
        return userPrompt;
    }

    const dnaContext = [
        dna.name && `Character: ${dna.name}`,
        dna.role && `Role: ${dna.role}`,
        dna.hair && `Hair: ${dna.hair}`,
        dna.eyes && `Eyes: ${dna.eyes}`,
        dna.skin && `Skin: ${dna.skin}`,
        dna.signatureFeatures && `Signature Features: ${dna.signatureFeatures}`,
        dna.outfitCanon && `Outfit: ${dna.outfitCanon}`,
        dna.styleLock && `Art Style: ${dna.styleLock}`
    ].filter(Boolean).join(', ');

    return `
EDIT REQUEST: ${userPrompt}

IMPORTANT - Maintain character consistency:
${dnaContext}

Keep the same art style (coloring book line art, clean monoline black outlines, bold thick lines, no shading/gradients).
Ensure the character remains recognizable after the edit.
`.trim();
};

/**
 * Hook for managing AI hero/character edit chat state.
 */
export function useHeroEditChat(
    onImageEdited?: (newImageUrl: string, isNewVersion: boolean) => void,
    characterDNA?: CharacterDNA
): UseHeroEditChatReturn {
    const [messages, setMessages] = useState<HeroChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentMask, setCurrentMask] = useState<string | null>(null);
    const [selectedImage, setSelectedImageState] = useState<SelectedHeroImage | null>(null);

    // Undo/Redo history
    const [editHistory, setEditHistory] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);

    const abortControllerRef = useRef<AbortController | null>(null);
    const dnaRef = useRef(characterDNA);
    dnaRef.current = characterDNA;

    const generateId = () => `hero-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

    const setSelectedImage = useCallback((imageUrl: string, name: string) => {
        setSelectedImageState(prev => {
            if (prev && prev.url !== imageUrl) {
                clearChat();
            }
            return { url: imageUrl, name };
        });
    }, [clearChat]);

    const clearSelectedImage = useCallback(() => {
        setSelectedImageState(null);
        clearChat();
    }, [clearChat]);

    const setMask = useCallback((maskDataUrl: string | null) => {
        setCurrentMask(maskDataUrl);
    }, []);

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

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Add user message
        const userMessage: HeroChatMessage = {
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

            // Build character-aware prompt (still useful for context, though subject handles identity)
            const enhancedPrompt = buildCharacterEditPrompt(prompt, dnaRef.current);

            // Construct the subject string from DNA for the new "Using the provided image of [subject]" template
            let subject = "a character";
            if (dnaRef.current) {
                const parts = [];
                if (dnaRef.current.name) parts.push(dnaRef.current.name);
                if (dnaRef.current.role) parts.push(dnaRef.current.role);
                if (parts.length > 0) subject = parts.join(', ');
            }

            const result: EditImageResult = await editImageWithGemini({
                sourceImage: sourceImageData,
                maskImage: maskImageData,
                editPrompt: enhancedPrompt,
                subject: subject, // Pass the extracted subject
                signal: controller.signal
            });

            if (controller.signal.aborted) return;

            if (result.error) {
                const errorMessage: HeroChatMessage = {
                    id: generateId(),
                    role: 'assistant',
                    content: `Sorry, I couldn't complete that edit: ${result.error}`,
                    timestamp: new Date(),
                    isError: true
                };
                setMessages(prev => [...prev, errorMessage]);
            } else if (result.imageUrl) {
                const successMessage: HeroChatMessage = {
                    id: generateId(),
                    role: 'assistant',
                    content: 'Done! I\'ve updated your character while maintaining their DNA.',
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

            const errorMessage: HeroChatMessage = {
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
                onImageEdited(msg.editedImageUrl, isNewVersion);

                if (replace) {
                    setEditHistory(h => [...h, selectedImage.url]);
                    setRedoStack([]);
                    // Update selectedImage to the new image
                    setSelectedImageState({ url: msg.editedImageUrl, name: selectedImage.name });
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
        onImageEdited(previousImageUrl, false);
        setSelectedImageState({ url: previousImageUrl, name: selectedImage.name });
    }, [editHistory, selectedImage, onImageEdited]);

    const redo = useCallback(() => {
        if (redoStack.length === 0 || !selectedImage || !onImageEdited) return;

        const prevRedo = [...redoStack];
        const redoImageUrl = prevRedo.pop()!;
        setRedoStack(prevRedo);

        setEditHistory(h => [...h, selectedImage.url]);
        onImageEdited(redoImageUrl, false);
        setSelectedImageState({ url: redoImageUrl, name: selectedImage.name });
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
