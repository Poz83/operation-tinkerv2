/**
 * API Key Context
 * 
 * Manages Gemini API key state with secure localStorage storage.
 * Provides encrypted storage and first-login detection.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { encryptApiKey, decryptApiKey, maskApiKey, isValidApiKeyFormat } from '../lib/crypto';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { Logger } from '../lib/logger';

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
    skipSetup: () => void;
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

    // Sync state with Supabase and LocalStorage
    useEffect(() => {
        const syncApiKey = async () => {
            if (!user) {
                // Determine offline availability from local storage only
                const encryptedKey = localStorage.getItem(STORAGE_KEY);
                if (encryptedKey) {
                    try {
                        const decrypted = await decryptApiKey(encryptedKey);
                        setApiKeyState(decrypted);
                    } catch (e) {
                        Logger.error('SYSTEM', 'Failed to decrypt local key', e);
                    }
                }
                const isSetupDone = localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';
                setSetupComplete(isSetupDone);
                setIsLoading(false);
                return;
            }

            try {
                // 1. Try Local Storage first (fastest)
                const localEncryptedKey = localStorage.getItem(STORAGE_KEY);
                let currentKey = null;

                if (localEncryptedKey) {
                    try {
                        currentKey = await decryptApiKey(localEncryptedKey);
                        setApiKeyState(currentKey);
                    } catch (e) {
                        Logger.warn('SYSTEM', 'Local key corrupted', e);
                        localStorage.removeItem(STORAGE_KEY);
                    }
                } else if (!currentKey && import.meta.env.VITE_GEMINI_API_KEY?.startsWith('AIza')) {
                    // Fallback to env variable if no local key
                    currentKey = import.meta.env.VITE_GEMINI_API_KEY;
                    setApiKeyState(currentKey);
                }

                // 2. Check Supabase for cloud backup
                const { data, error } = await supabase
                    .from('users')
                    .select('gemini_api_key')
                    .eq('id', user.id)
                    .maybeSingle();

                if (data?.gemini_api_key) {
                    // Cloud has a key
                    if (data.gemini_api_key !== localEncryptedKey) {
                        // Cloud differs from local (or local is missing)
                        try {
                            const cloudDecrypted = await decryptApiKey(data.gemini_api_key);
                            setApiKeyState(cloudDecrypted);
                            // Sync to local
                            localStorage.setItem(STORAGE_KEY, data.gemini_api_key);
                        } catch (e) {
                            Logger.error('SYSTEM', 'Failed to decrypt cloud key', e);
                        }
                    }
                } else if (!data?.gemini_api_key && localEncryptedKey) {
                    // We have local key but not cloud - push to cloud
                    await supabase
                        .from('users')
                        .update({ gemini_api_key: localEncryptedKey })
                        .eq('id', user.id);
                }

                const isSetupDone = localStorage.getItem(SETUP_COMPLETE_KEY) === 'true' || !!currentKey || !!data?.gemini_api_key;
                setSetupComplete(isSetupDone);

            } catch (error) {
                Logger.error('SYSTEM', 'Failed to sync API key', error);
            } finally {
                setIsLoading(false);
            }
        };

        syncApiKey();
    }, [user]);

    // Determine if this is first login (authenticated but no setup complete and no API key)
    const isFirstLogin = !!user && !setupComplete && !isLoading && !apiKey;

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
            // Encrypt and store locally
            const encrypted = await encryptApiKey(trimmedKey);
            localStorage.setItem(STORAGE_KEY, encrypted);
            setApiKeyState(trimmedKey);

            // Mark setup as complete
            localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
            setSetupComplete(true);

            // Sync to cloud if logged in
            if (user) {
                const { error } = await supabase
                    .from('users')
                    .update({ gemini_api_key: encrypted })
                    .eq('id', user.id);

                if (error) {
                    Logger.error('SYSTEM', 'Failed to sync key to cloud', error);
                    // We don't fail the operation because local worked, but we log it
                }
            }

            return { success: true };
        } catch (error) {
            Logger.error('SYSTEM', 'Failed to save API key', error);
            return { success: false, error: 'Failed to securely store API key' };
        }
    }, [user]);

    const clearApiKey = useCallback(async () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SETUP_COMPLETE_KEY);
        setApiKeyState(null);
        setSetupComplete(false);

        if (user) {
            await supabase
                .from('users')
                .update({ gemini_api_key: null })
                .eq('id', user.id);
        }
    }, [user]);

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
            skipSetup: markSetupComplete,
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
