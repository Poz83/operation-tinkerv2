/**
 * Feedback Widget Component
 * 
 * A floating feedback button that expands into a form for users to submit
 * issues or suggestions with optional screenshot attachment.
 */

import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type FeedbackType = 'issue' | 'suggestion';

interface FeedbackData {
    type: FeedbackType;
    details: string;
    screenshot: string | null;
    userEmail: string | null;
    timestamp: string;
    url: string;
}

export const FeedbackWidget: React.FC = () => {
    const { userEmail } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('issue');
    const [details, setDetails] = useState('');
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleScreenshotUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setScreenshot(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleCaptureScreen = useCallback(async () => {
        try {
            // Use html2canvas to capture the current page
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(document.body, {
                backgroundColor: '#0a0a0b',
                scale: 0.5, // Reduce size for faster processing
                logging: false,
            });
            setScreenshot(canvas.toDataURL('image/png'));
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            alert('Failed to capture screenshot. Try uploading an image instead.');
        }
    }, []);

    // Helper to convert data URL to Blob
    const dataURItoBlob = (dataURI: string) => {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!details.trim()) return;

        setIsSubmitting(true);

        try {
            // Get current user ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            let finalScreenshotUrl = null;

            if (screenshot) {
                // 1. Convert screenshot to Blob
                const blob = dataURItoBlob(screenshot);

                // 2. Get upload key from API
                const response = await fetch('/api/upload-feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    throw new Error('Failed to get upload key');
                }

                const { key, uploadUrl } = await response.json();

                // 3. Upload to R2 via the API
                const uploadResponse = await fetch(uploadUrl || `/api/upload-feedback?key=${key}`, {
                    method: 'PUT',
                    body: blob,
                    headers: {
                        'Content-Type': 'image/png',
                    },
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload screenshot');
                }

                // 4. Store the key with r2:// prefix for the admin dashboard
                finalScreenshotUrl = `r2://${key}`;
            }

            const { error } = await supabase
                .from('feedback')
                .insert({
                    user_id: user.id,
                    type: feedbackType === 'issue' ? 'bug' : 'suggestion',
                    message: details.trim(),
                    screenshot_url: finalScreenshotUrl,
                    page_url: window.location.href,
                    user_agent: navigator.userAgent
                } as any);

            if (error) throw error;

            console.log('Feedback submitted to Supabase');

            setSubmitted(true);
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
                setDetails('');
                setScreenshot(null);
                setFeedbackType('issue');
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        // Reset form after animation
        setTimeout(() => {
            setDetails('');
            setScreenshot(null);
            setSubmitted(false);
        }, 300);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 flex items-center justify-center text-white hover:scale-110 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                aria-label="Send Feedback"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </button>

            {/* Feedback Panel */}
            <div className={`fixed bottom-6 right-6 z-[100] w-96 max-w-[calc(100vw-3rem)] transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="bg-[#131314] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                                💬
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Send Feedback</h3>
                                <p className="text-xs text-zinc-500">Help us improve</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    {submitted ? (
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Thank you!</h4>
                            <p className="text-sm text-zinc-400">Your feedback helps us make Myjoe better.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Type Selection */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFeedbackType('issue')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${feedbackType === 'issue'
                                        ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                                        : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    🐛 Report Issue
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFeedbackType('suggestion')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${feedbackType === 'suggestion'
                                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                                        : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    💡 Suggestion
                                </button>
                            </div>

                            {/* Details */}
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2">
                                    {feedbackType === 'issue' ? 'Describe the issue' : 'What would you like to see?'}
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder={feedbackType === 'issue'
                                        ? "What went wrong? What were you trying to do?"
                                        : "Share your idea or suggestion..."
                                    }
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none text-sm"
                                />
                            </div>

                            {/* Screenshot Section */}
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2">
                                    Screenshot (optional)
                                </label>

                                {screenshot ? (
                                    <div className="relative rounded-xl overflow-hidden border border-white/10">
                                        <img
                                            src={screenshot}
                                            alt="Screenshot preview"
                                            className="w-full h-32 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setScreenshot(null)}
                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCaptureScreen}
                                            className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                            Capture
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                            Upload
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleScreenshotUpload}
                                            className="hidden"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!details.trim() || isSubmitting}
                                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Sending...
                                    </span>
                                ) : (
                                    'Send Feedback'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
};

export default FeedbackWidget;
