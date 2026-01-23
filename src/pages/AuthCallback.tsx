/**
 * Auth Callback Page
 * 
 * Handles the redirect after a user clicks a magic link in their email.
 * With polling-based flow: attempts to close this tab since the original tab
 * will auto-redirect via session polling.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const next = searchParams.get('next') || '/dashboard';
        let timeoutId: NodeJS.Timeout;

        // Supabase client with detectSessionInUrl: true automatically processes the code
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                clearTimeout(timeoutId);
                setStatus('success');

                // Try to close this tab - original tab will redirect via polling
                // If close fails (not opened by script), redirect as fallback
                setTimeout(() => {
                    try {
                        window.close();
                    } catch {
                        // Ignore
                    }
                    // If we're still here after 500ms, the close didn't work - redirect
                    setTimeout(() => {
                        navigate(next, { replace: true });
                    }, 500);
                }, 1500);
            }
        });

        // Also check if we already have a session
        const checkExistingSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                clearTimeout(timeoutId);
                setStatus('success');
                setTimeout(() => navigate(next, { replace: true }), 1000);
            }
        };
        checkExistingSession();

        // Safety timeout
        timeoutId = setTimeout(() => {
            setStatus('error');
            setErrorMessage('Sign-in timed out. Please request a new magic link.');
        }, 15000);

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [navigate, searchParams]);

    if (status === 'error') {
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
                        Sign-In Failed
                    </h2>
                    <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                        {errorMessage}
                    </p>
                    <button
                        onClick={() => navigate('/landing', { replace: true })}
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
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'success') {
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
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#4ade80' }}>
                    You're signed in!
                </h2>
                <p style={{ opacity: 0.7 }}>
                    You can close this tab and return to the original window.
                </p>
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
            <div style={{
                width: '48px',
                height: '48px',
                border: '3px solid rgba(102, 126, 234, 0.3)',
                borderTopColor: '#667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '1.5rem', opacity: 0.7 }}>
                Verifying your login...
            </p>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AuthCallback;
