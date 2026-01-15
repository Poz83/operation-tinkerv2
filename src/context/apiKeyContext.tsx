/**
 * API Key Context
 * 
 * Manages Gemini API key state with secure localStorage storage.
 * Provides encrypted storage and first-login detection.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { encryptApiKey, decryptApiKey, maskApiKey, isValidApiKeyFormat } from '../lib/crypto';
import { useAuth } from './AuthContext';

interface ApiKeyContextType {
    // State
    apiKey: string | null;
    hasApiKey: boolean;
    isFirstLogin: boolean;
    isLoading: boolean;

    // Actions
    setApiKey: (key: string) => Promise<{ success: boolean; error?: string }>;
    clearApiKey: () => void;
    markSetupComplete: () => void;

    // Helpers
    getMaskedKey: () => string;
    validateKeyFormat: (key: string) => boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const STORAGE_KEY = 'myjoe_encrypted_api_key';
const SETUP_COMPLETE_KEY = 'myjoe_setup_complete';

interface ApiKeyProviderProps {
    children: ReactNode;
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
    const { user, userEmail } = useAuth();
    const [apiKey, setApiKeyState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [setupComplete, setSetupComplete] = useState(false);

    // Load API key from storage on mount
    useEffect(() => {
        const loadApiKey = async () => {
            try {
                const encryptedKey = localStorage.getItem(STORAGE_KEY);
                const isSetupDone = localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';

                setSetupComplete(isSetupDone);

                if (encryptedKey) {
                    const decrypted = await decryptApiKey(encryptedKey);
                    setApiKeyState(decrypted);
                }
            } catch (error) {
                console.error('Failed to load API key:', error);
                // Clear corrupted data
                localStorage.removeItem(STORAGE_KEY);
            } finally {
                setIsLoading(false);
            }
        };

        loadApiKey();
    }, []);

    // Determine if this is first login (authenticated but no setup complete)
    const isFirstLogin = !!user && !setupComplete && !isLoading;

    const setApiKey = useCallback(async (key: string): Promise<{ success: boolean; error?: string }> => {
        const trimmedKey = key.trim();

        // Validate format
        if (!isValidApiKeyFormat(trimmedKey)) {
            return {
                success: false,
                error: 'Invalid API key format. Gemini keys start with "AIza" and are 39 characters.'
            };
        }

        try {
            // Encrypt and store
            const encrypted = await encryptApiKey(trimmedKey);
            localStorage.setItem(STORAGE_KEY, encrypted);
            setApiKeyState(trimmedKey);
            return { success: true };
        } catch (error) {
            console.error('Failed to save API key:', error);
            return { success: false, error: 'Failed to securely store API key' };
        }
    }, []);

    const clearApiKey = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SETUP_COMPLETE_KEY);
        setApiKeyState(null);
        setSetupComplete(false);
    }, []);

    const markSetupComplete = useCallback(() => {
        localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
        setSetupComplete(true);
    }, []);

    const getMaskedKey = useCallback(() => {
        return apiKey ? maskApiKey(apiKey) : '';
    }, [apiKey]);

    const validateKeyFormat = useCallback((key: string) => {
        return isValidApiKeyFormat(key);
    }, []);

    return (
        <ApiKeyContext.Provider value={{
            apiKey,
            hasApiKey: !!apiKey,
            isFirstLogin,
            isLoading,
            setApiKey,
            clearApiKey,
            markSetupComplete,
            getMaskedKey,
            validateKeyFormat,
        }}>
            {children}
        </ApiKeyContext.Provider>
    );
};

export const useApiKeyContext = () => {
    const context = useContext(ApiKeyContext);
    if (context === undefined) {
        throw new Error('useApiKeyContext must be used within an ApiKeyProvider');
    }
    return context;
};

export default ApiKeyProvider;
