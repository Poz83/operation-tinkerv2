import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'myjoe_cookie_consent';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const hasConsented = localStorage.getItem(STORAGE_KEY);
        if (!hasConsented) {
            // Small delay to not overwhelm user immediately on load
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none"
                >
                    <div className="pointer-events-auto max-w-2xl w-full glass-panel border border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🍪</span>
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                                    Cookie Preferences
                                </h4>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed max-w-md">
                                    We use essential cookies to maintain your signed-in session and save your studio preferences locally on your device.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleAccept}
                            className="flex-shrink-0 px-6 py-2.5 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] text-sm font-medium rounded-xl transition-colors shadow-lg shadow-primary/20"
                        >
                            Got it
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
