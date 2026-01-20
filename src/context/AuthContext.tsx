/**
 * Authentication Context
 * 
 * Provides Supabase-based authentication with magic link (passwordless) login.
 * Maintains whitelist for alpha access control.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, signInWithMagicLink, signOut as supabaseSignOut } from '../lib/supabase';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    userEmail: string | null;
    isLoading: boolean;
    isWhitelisted: boolean;
    isAdmin: boolean;
    avatarUrl: string | null;
    displayName: string | null;
    sendMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    debugLogin: () => Promise<void>; // DEV ONLY
    updateProfile: (updates: { avatarUrl?: string; displayName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userDetails, setUserDetails] = useState<{ isWhitelisted: boolean; isAdmin: boolean; avatarUrl: string | null; displayName: string | null } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchUserDetails = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('is_whitelisted, is_admin, avatar_url, display_name')
                .eq('id', userId)
                .single() as { data: { is_whitelisted: boolean; is_admin: boolean; avatar_url: string; display_name: string } | null; error: unknown };

            if (error) {
                // Ignore AbortError which happens on rapid session changes/remounts
                if (typeof error === 'object' && error !== null && 'message' in error && (error as any).message.includes('AbortError')) {
                    return null;
                }
                // Ignore if data is just missing (optional, but keep error for other cases)
                if (!data) {
                    console.error('Error fetching user details:', error);
                    return null;
                }
            }

            if (!data) return null;

            return {
                isWhitelisted: data.is_whitelisted,
                isAdmin: data.is_admin,
                avatarUrl: data.avatar_url,
                displayName: data.display_name
            };
        } catch (error: any) {
            // Ignore AbortError and 'AbortError' string messages
            if (error.message?.includes('AbortError') || error.name === 'AbortError') {
                return null;
            }
            console.error('Error in fetchUserDetails:', error);
            return null;
        }
    };

    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);
                setUser(initialSession?.user ?? null);

                if (initialSession?.user) {
                    fetchUserDetails(initialSession.user.id).then(details => setUserDetails(details));
                }
            } catch (error) {
                console.error('Error getting initial session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, currentSession: Session | null) => {
                console.log('Auth state changed:', event);
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    // Fire and forget - don't block UI
                    fetchUserDetails(currentSession.user.id).then(details => setUserDetails(details));
                } else {
                    setUserDetails(null);
                }

                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const isAuthenticated = !!session && !!user;
    const userEmail = user?.email ?? null;

    // Emergency / hardcoded whitelist for family/admin access without DB entry
    const MANUAL_WHITELIST = ['jamie@myjoe.app', 'thepozniakfamily@gmail.com', 'getevel@gmail.com'];

    // For now, if we can't fetch details, assume false to be safe, unless it's a loading state handled elsewhere.
    const isWhitelisted = (userEmail && MANUAL_WHITELIST.includes(userEmail.toLowerCase())) || (userDetails?.isWhitelisted ?? false);
    const isAdmin = userDetails?.isAdmin ?? false;
    const avatarUrl = userDetails?.avatarUrl ?? null;
    const displayName = userDetails?.displayName ?? null;

    const sendMagicLink = async (email: string): Promise<{ success: boolean; error?: string }> => {
        // We now allow sending magic links to anyone, and check whitelist status AFTER login.
        // This is necessary because we can't easily check the DB for 'is_whitelisted' 
        // by email for a user that might not exist or without compromising privacy 
        // (unless we have a specific RPC or Edge Function).
        // For the 'Add to whitelist' feature to work for new users, they need to be able to sign up (or sign in to create the account).

        try {
            await signInWithMagicLink(email);
            return { success: true };
        } catch (error) {
            console.error('Error sending magic link:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send magic link'
            };
        }
    };

    const logout = async () => {
        try {
            await supabaseSignOut();
            setUser(null);
            setSession(null);
            setUserDetails(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const updateProfile = async (updates: { avatarUrl?: string; displayName?: string }) => {
        if (!user) return;

        try {
            const dbUpdates: any = {};
            if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
            if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;

            const { error } = await supabase
                .from('users')
                .update(dbUpdates)
                .eq('id', user.id);

            if (error) throw error;

            // Refresh local state
            setUserDetails(prev => prev ? {
                ...prev,
                avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : prev.avatarUrl,
                displayName: updates.displayName !== undefined ? updates.displayName : prev.displayName
            } : null);

        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const debugLogin = async () => {
        if (!import.meta.env.DEV) return;

        const mockUser: User = {
            id: '11111111-1111-1111-1111-111111111111', // Valid UUID to preventing 400 errors
            aud: 'authenticated',
            role: 'authenticated',
            email: 'dev@example.com',
            email_confirmed_at: new Date().toISOString(),
            phone: '',
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            app_metadata: { provider: 'email' },
            user_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const mockSession: Session = {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: mockUser,
        };

        setUser(mockUser);
        setSession(mockSession);
        setUserDetails({ isWhitelisted: true, isAdmin: true, avatarUrl: 'https://placehold.co/400', displayName: 'Dev User' });
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            userEmail,
            isLoading,
            isWhitelisted,
            isAdmin,
            avatarUrl,
            displayName,
            sendMagicLink,
            logout,
            debugLogin,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


