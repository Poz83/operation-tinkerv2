/**
 * Supabase Client Configuration
 * 
 * This module initializes and exports the Supabase client for use throughout the app.
 * Uses environment variables from .env.local
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. ' +
        'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
    );
}

/**
 * Supabase client instance
 * Use this for all database and auth operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Redirect to landing page after magic link click
        flowType: 'pkce',
    },
});

/**
 * Helper to get the current user
 */
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting user:', error);
        return null;
    }
    return user;
};

/**
 * Helper to get the current session
 */
export const getCurrentSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session;
};

/**
 * Sign in with magic link (passwordless email)
 * @param email - User's email address
 * @param redirectTo - Optional path to redirect to after auth (default: /dashboard)
 */
export const signInWithMagicLink = async (email: string, redirectTo: string = '/dashboard') => {
    // Use VITE_APP_URL for redirects (supports both localhost and production domain)
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
    });

    if (error) {
        console.error('Error sending magic link:', error);
        throw error;
    }

    return { success: true };
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

export default supabase;
