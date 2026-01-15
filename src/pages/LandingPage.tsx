
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import floating assets

const LandingPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const { sendMagicLink, isAuthenticated, debugLogin } = useAuth();
    const navigate = useNavigate();

    // If already authenticated, redirect to dashboard
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const result = await sendMagicLink(email);
            if (result.success) {
                setStatus('success');
                // User needs to check their email - don't auto-redirect
            } else {
                setStatus('error');
                setErrorMessage(result.error || 'Access denied. This is an invite-only beta.');
            }
        } catch (err) {
            setStatus('error');
            setErrorMessage('An unexpected error occurred.');
        }
    };

    return (
        <div className="landing-container relative w-full h-screen overflow-hidden flex items-center justify-center bg-deep-onyx">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-aurora-purple/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-aurora-blue/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow delay-1000" />
            </div>



            <div className="relative z-10 w-full max-w-md px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40"
                >
                    <div className="text-center mb-8">
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/50 mb-2 font-display"
                        >
                            myjoe
                        </motion.h1>
                        <p className="text-white/40 text-sm tracking-wide uppercase">Private Access</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="text-center py-8"
                            >
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 text-green-400 text-2xl">
                                    ✨
                                </div>
                                <h3 className="text-xl font-medium text-white mb-2">Check your email</h3>
                                <p className="text-white/60 text-sm">We've sent a magic link to {email}</p>
                                <p className="text-white/30 text-xs mt-6">
                                    Click the link in your email to sign in.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                <div>
                                    <label htmlFor="email" className="block text-xs font-medium text-white/50 mb-2 ml-1">
                                        EMAIL ADDRESS
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-aurora-blue/50 focus:border-transparent transition-all"
                                    />
                                </div>

                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20"
                                    >
                                        {errorMessage}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-3.5 bg-gradient-to-r from-aurora-blue to-aurora-purple text-white font-medium rounded-xl shadow-lg shadow-aurora-blue/20 hover:shadow-aurora-blue/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {status === 'loading' ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Sign In with Magic Link
                                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                                            </>
                                        )}
                                    </span>
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* DEV ONLY: Debug Login */}
                    {import.meta.env.DEV && (
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={() => debugLogin()}
                                className="text-xs text-white/30 hover:text-white/50 transition-colors uppercase tracking-widest"
                            >
                                [Debug Login]
                            </button>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-white/20 text-xs">
                            © 2026 MyJoe. All rights reserved.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div >
    );
};

export default LandingPage;
