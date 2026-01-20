/**
 * Waitlist Page
 * 
 * Public page for collecting waitlist sign-ups.
 * Uses the same glass aesthetic as the landing page.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/settingsContext';
import { BrandLogo } from '../components/BrandLogo';
import WaitlistForm from '../components/WaitlistForm';

const WaitlistPage: React.FC = () => {
    const { settings, toggleTheme } = useSettings();
    const navigate = useNavigate();

    return (
        <div className="landing-container relative w-full h-screen overflow-hidden flex items-center justify-center bg-[hsl(var(--background))] transition-colors duration-500">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 z-50 p-3 rounded-full bg-[hsl(var(--card))]/30 border border-[hsl(var(--border))]/50 backdrop-blur-md hover:bg-[hsl(var(--card))]/50 transition-all text-[hsl(var(--foreground))]"
                title="Toggle Theme"
            >
                {settings.theme === 'light' ? '☀️' : '🌙'}
            </button>

            {/* Back to Login Link */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 z-50 p-3 rounded-full bg-[hsl(var(--card))]/30 border border-[hsl(var(--border))]/50 backdrop-blur-md hover:bg-[hsl(var(--card))]/50 transition-all text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-sm flex items-center gap-2"
            >
                <span>←</span>
                <span className="hidden sm:inline">Sign In</span>
            </button>

            {/* Image Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 dark:opacity-80 transition-opacity duration-700"
                    style={{ backgroundImage: `url('/landing-bg.png')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--background))]/50 to-[hsl(var(--background))] mix-blend-overlay" />
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="glass-panel p-8 rounded-2xl border border-[hsl(var(--glass-border))] shadow-2xl backdrop-blur-xl bg-[hsl(var(--glass-bg))]"
                >
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center mb-4"
                        >
                            <BrandLogo className="h-32 w-[24rem]" />
                        </motion.div>
                        <p className="text-[hsl(var(--muted-foreground))] text-sm tracking-wide uppercase">
                            Join the Waitlist
                        </p>
                        <p className="text-[hsl(var(--muted-foreground))]/70 text-xs mt-2">
                            Be the first to know when we launch
                        </p>
                    </div>

                    <WaitlistForm />

                    <div className="mt-8 text-center">
                        <p className="text-[hsl(var(--muted-foreground))]/50 text-xs">
                            © 2026 myjoe. All rights reserved.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default WaitlistPage;
