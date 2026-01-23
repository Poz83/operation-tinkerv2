/**
 * Auth Callback Page
 * 
 * Handles the redirect after a user clicks a magic link in their email.
 * Supabase client with detectSessionInUrl: true automatically processes the code.
 * We just wait for the session to be established and redirect.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Verifying your login...');

    useEffect(() => {
        const next = searchParams.get('next') || '/dashboard';
        let timeoutId: NodeJS.Timeout;

        // Supabase client with detectSessionInUrl: true automatically processes the code
        // We just need to wait for it to complete and redirect
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                clearTimeout(timeoutId);
                setStatus('Success! Redirecting...');
                // Small delay to show success message
                setTimeout(() => {
                    navigate(next, { replace: true });
                }, 500);
            }
        });

        // Also check if we already have a session (in case event fired before subscription)
        const checkExistingSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                clearTimeout(timeoutId);
                navigate(next, { replace: true });
            }
        };
        checkExistingSession();

        // Safety timeout - if nothing happens in 10 seconds, show error
        timeoutId = setTimeout(() => {
            setError('Sign-in timed out. Please request a new magic link.');
        }, 10000);

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [navigate, searchParams]);

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
                        Sign-In Failed
                    </h2>
                    <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                        {error}
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
                {status}
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
