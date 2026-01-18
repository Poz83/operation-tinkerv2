/**
 * Auth Callback Page
 * 
 * Handles the redirect after a user clicks a magic link in their email.
 * Supabase automatically processes the token from the URL and establishes the session.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Verifying magic link...');

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleAuthCallback = async () => {
            try {
                // Check if we have a code in the URL (PKCE flow)
                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');
                const next = params.get('next') || '/dashboard';

                if (!code) {
                    // No code, check if we already have a session
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        navigate(next, { replace: true });
                    } else {
                        navigate('/', { replace: true });
                    }
                    return;
                }

                // If code exists, wait for the auth state to change
                setStatus('Exchanging code for session...');

                // Set a safety timeout
                timeoutId = setTimeout(() => {
                    setError('Authentication timed out. Please try sending the magic link again.');
                }, 10000); // 10 seconds timeout

                const handleSuccess = () => {
                    clearTimeout(timeoutId);
                    setStatus('Authentication successful! You can close this window.');
                    // Attempt to close the tab for a seamless experience
                    try {
                        window.close();
                    } catch (e) {
                        // Some browsers block scripts from closing windows they didn't open
                    }
                    if (subscription) subscription.unsubscribe();
                };

                // The actual exchange happens automatically by the Supabase client
                // We just need to wait for the result
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        handleSuccess();
                    } else if (event === 'SIGNED_OUT') {
                        // Some flows might trigger this initially, ignore unless it persists
                    }
                });

                // Also do a manual check just in case the event fired before we subscribed
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (session) {
                    handleSuccess();
                }

                return () => {
                    clearTimeout(timeoutId);
                    subscription.unsubscribe();
                };

            } catch (err) {
                clearTimeout(timeoutId!);
                console.error('Unexpected error during auth callback:', err);
                setError('An unexpected error occurred. Please try again.');
            }
        };

        handleAuthCallback();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [navigate]);

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                color: '#fff',
                fontFamily: 'Outfit, sans-serif',
                padding: '2rem'
            }}>
                <div style={{
                    background: 'rgba(255, 100, 100, 0.1)',
                    border: '1px solid rgba(255, 100, 100, 0.3)',
                    borderRadius: '12px',
                    padding: '2rem',
                    maxWidth: '400px',
                    textAlign: 'center'
                }}>
                    <h2 style={{ marginBottom: '1rem', color: '#ff6b6b' }}>
                        Authentication Error
                    </h2>
                    <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                        {error}
                    </p>
                    <button
                        onClick={() => navigate('/', { replace: true })}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 500
                        }}
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
            color: '#fff',
            fontFamily: 'Outfit, sans-serif'
        }}>
            {status.includes('successful') ? (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#4ade80' }}>
                        You're Logged In!
                    </h2>
                    <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                        You can safely close this window and return to your original tab.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard', { replace: true })}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            cursor: 'pointer'
                        }}
                    >
                        Go to Dashboard &rarr;
                    </button>
                    <script dangerouslySetInnerHTML={{ __html: "window.close();" }} />
                </div>
            ) : (
                <>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '3px solid rgba(102, 126, 234, 0.3)',
                        borderTopColor: '#667eea',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ marginTop: '1.5rem', opacity: 0.7 }}>
                        {status}
                    </p>
                </>
            )}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AuthCallback;
