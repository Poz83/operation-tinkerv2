import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/settingsContext';
import { BrandLogo } from '../components/BrandLogo';
import { supabase } from '../lib/supabase';

const ContactPage: React.FC = () => {
    const { settings, toggleTheme } = useSettings();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        website: '' // Honeypot field
    });

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Honeypot Check (Spam Protection)
        if (formData.website) {
            // If bot filled this hidden field, fail silently (pretend success)
            console.log("Spam detected via honeypot");
            setStatus('success');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            // 2. Insert into Supabase
            // @ts-ignore - Table created via migration, types not yet updated
            const { error } = await supabase
                .from('contact_messages')
                .insert({
                    full_name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    metadata: { source: 'web_form' }
                });

            if (error) throw error;

            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '', website: '' });

        } catch (err) {
            console.error('Submission error:', err);
            setStatus('error');
            setErrorMessage('Failed to send message. Please try again later.');
        }
    };

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

            {/* Back Link */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 z-50 p-3 rounded-full bg-[hsl(var(--card))]/30 border border-[hsl(var(--border))]/50 backdrop-blur-md hover:bg-[hsl(var(--card))]/50 transition-all text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-sm flex items-center gap-2"
            >
                <span>←</span>
                <span className="hidden sm:inline">Home</span>
            </button>

            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 dark:opacity-80 transition-opacity duration-700"
                    style={{ backgroundImage: `url('/landing-bg.png')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--background))]/50 to-[hsl(var(--background))] mix-blend-overlay" />
            </div>

            <div className="relative z-10 w-full max-w-xl px-4 py-8 h-full flex items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full glass-panel p-8 rounded-2xl border border-[hsl(var(--glass-border))] shadow-2xl backdrop-blur-xl bg-[hsl(var(--glass-bg))] max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center mb-4"
                        >
                            <BrandLogo className="h-24 w-[18rem]" />
                        </motion.div>
                        <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))] mb-2">Contact Us</h2>
                        <p className="text-[hsl(var(--muted-foreground))] text-sm">
                            We'd love to hear from you. Send us a message below.
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30 text-green-400 text-3xl">
                                    ✉️
                                </div>
                                <h3 className="text-xl font-medium text-[hsl(var(--foreground))] mb-2">Message Sent!</h3>
                                <p className="text-[hsl(var(--muted-foreground))]">
                                    Thanks for reaching out. We'll get back to you shortly.
                                </p>
                                <button
                                    onClick={() => setStatus('idle')}
                                    className="mt-8 text-sm text-[hsl(var(--primary))] hover:underline"
                                >
                                    Send another message
                                </button>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="space-y-4"
                            >
                                {/* Honeypot - Hidden from users */}
                                <div className="hidden absolute opacity-0 pointer-events-none -z-10">
                                    <label>Website <input type="text" name="website" value={formData.website} onChange={handleChange} tabIndex={-1} autoComplete="off" /></label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 ml-1">NAME</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-[var(--glass-input-bg)] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:ring-2 focus:ring-aurora-blue/50 focus:border-transparent transition-all"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 ml-1">EMAIL</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-[var(--glass-input-bg)] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:ring-2 focus:ring-aurora-blue/50 focus:border-transparent transition-all"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 ml-1">SUBJECT</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-[var(--glass-input-bg)] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:ring-2 focus:ring-aurora-blue/50 focus:border-transparent transition-all"
                                        placeholder="What is this regarding?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 ml-1">MESSAGE</label>
                                    <textarea
                                        name="message"
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-[var(--glass-input-bg)] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:ring-2 focus:ring-aurora-blue/50 focus:border-transparent transition-all resize-none"
                                        placeholder="How can we help?"
                                    />
                                </div>

                                {status === 'error' && (
                                    <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-3.5 mt-2 bg-gradient-to-r from-aurora-blue to-aurora-purple text-white font-medium rounded-xl shadow-lg shadow-aurora-blue/20 hover:shadow-aurora-blue/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {status === 'loading' ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Send Message
                                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                                            </>
                                        )}
                                    </span>
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default ContactPage;
