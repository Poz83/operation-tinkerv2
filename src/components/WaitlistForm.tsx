/**
 * WaitlistForm Component
 * 
 * Premium glass-style waitlist sign-up form matching the landing page aesthetic.
 * Uses Supabase client to insert directly into the waitlist table.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface WaitlistFormProps {
    onSuccess?: () => void;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const WaitlistForm: React.FC<WaitlistFormProps> = ({ onSuccess }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [privacyConsent, setPrivacyConsent] = useState(false);
    const [contactConsent, setContactConsent] = useState(false);
    const [status, setStatus] = useState<FormStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        // Validation
        if (!fullName.trim()) {
            setStatus('error');
            setErrorMessage('Please enter your full name.');
            return;
        }

        if (!email.trim()) {
            setStatus('error');
            setErrorMessage('Please enter your email address.');
            return;
        }

        if (!privacyConsent) {
            setStatus('error');
            setErrorMessage('You must agree to the privacy policy to continue.');
            return;
        }

        try {
            // Insert into waitlist table
            const { error } = await supabase
                .from('waitlist')
                .insert({
                    full_name: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    privacy_consent: privacyConsent,
                    contact_consent: contactConsent,
                });

            if (error) {
                console.error('Waitlist insert error:', error);

                // Handle duplicate email
                if (error.code === '23505' || error.message?.includes('duplicate')) {
                    setStatus('error');
                    setErrorMessage('This email is already on the waitlist!');
                    return;
                }

                throw error;
            }

            setStatus('success');
            onSuccess?.();
        } catch (err) {
            console.error('Waitlist submission error:', err);
            setStatus('error');
            setErrorMessage('Something went wrong. Please try again.');
        }
    };

    return (
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
                    <h3 className="text-xl font-medium text-[hsl(var(--foreground))] mb-2">
                        You're on the list!
                    </h3>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm">
                        Check your inbox for a welcome email.
                    </p>
                    <p className="text-[hsl(var(--muted-foreground))]/70 text-xs mt-4">
                        We'll notify you when it's time to join.
                    </p>
                </motion.div>
            ) : (
                <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    {/* Full Name */}
                    <div>
                        <label
                            htmlFor="waitlist-name"
                            className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2 ml-1"
                        >
                            FULL NAME
                        </label>
                        <input
                            type="text"
                            id="waitlist-name"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Jane Doe"
                            className="w-full px-4 py-3 bg-[var(--glass-input-bg)] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:ring-2 focus:ring-aurora-blue/50 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="waitlist-email"
                            className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2 ml-1"
                        >
                            EMAIL ADDRESS
                        </label>
                        <input
                            type="email"
                            id="waitlist-email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jane@example.com"
                            className="w-full px-4 py-3 bg-[var(--glass-input-bg)] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:ring-2 focus:ring-aurora-blue/50 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Privacy Consent (Required) */}
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="waitlist-privacy"
                            required
                            checked={privacyConsent}
                            onChange={(e) => setPrivacyConsent(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-[hsl(var(--border))] bg-[var(--glass-input-bg)] text-aurora-blue focus:ring-aurora-blue/50 focus:ring-offset-0 cursor-pointer"
                        />
                        <label
                            htmlFor="waitlist-privacy"
                            className="text-sm text-[hsl(var(--muted-foreground))] cursor-pointer"
                        >
                            I agree to the <span className="text-[hsl(var(--foreground))] underline underline-offset-2">Privacy Policy</span> and consent to my data being stored. <span className="text-red-400">*</span>
                        </label>
                    </div>

                    {/* Contact Consent (Optional) */}
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="waitlist-contact"
                            checked={contactConsent}
                            onChange={(e) => setContactConsent(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-[hsl(var(--border))] bg-[var(--glass-input-bg)] text-aurora-blue focus:ring-aurora-blue/50 focus:ring-offset-0 cursor-pointer"
                        />
                        <label
                            htmlFor="waitlist-contact"
                            className="text-sm text-[hsl(var(--muted-foreground))] cursor-pointer"
                        >
                            I'd like to receive updates and news about myjoe.
                        </label>
                    </div>

                    {/* Error Message */}
                    {status === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-4 rounded-lg border border-red-500/20"
                        >
                            {errorMessage}
                        </motion.div>
                    )}

                    {/* Submit Button */}
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
                                    Join the Waitlist
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </>
                            )}
                        </span>
                    </button>
                </motion.form>
            )}
        </AnimatePresence>
    );
};

export default WaitlistForm;
