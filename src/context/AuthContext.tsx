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
    sendMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Alpha whitelist - users allowed during alpha phase
const WHITELIST = [
    'jamie@myjoe.app',
    'stuff.araza@gmail.com'
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);
                setUser(initialSession?.user ?? null);
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
                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const isAuthenticated = !!session && !!user;
    const userEmail = user?.email ?? null;
    const isWhitelisted = userEmail ? WHITELIST.includes(userEmail.toLowerCase()) : false;

    const sendMagicLink = async (email: string): Promise<{ success: boolean; error?: string }> => {
        // Check whitelist before sending magic link
        if (!WHITELIST.includes(email.toLowerCase())) {
            return {
                success: false,
                error: 'This email is not authorized for alpha access. Please contact support.'
            };
        }

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
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            userEmail,
            isLoading,
            isWhitelisted,
            sendMagicLink,
            logout
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

// Backwards compatibility - keep login function signature similar
// This is a convenience wrapper for components expecting the old API
export const useAuthCompat = () => {
    const auth = useAuth();

    return {
        isAuthenticated: auth.isAuthenticated,
        userEmail: auth.userEmail,
        isLoading: auth.isLoading,
        // login now sends magic link instead of instant auth
        login: async (email: string): Promise<boolean> => {
            const result = await auth.sendMagicLink(email);
            return result.success;
        },
        logout: auth.logout
    };
};
