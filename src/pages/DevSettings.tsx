/**
 * Dev Settings Page
 * 
 * A secret settings page for admin development tools, debugging, and feedback management.
 * Only accessible to jamie@myjoe.app
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface FeedbackItem {
    id: string;
    type: string;
    message: string;
    page_url: string;
    created_at: string;
    user_id: string;
    status: string;
    screenshot_url?: string;
}

interface ApiStatus {
    name: string;
    status: 'checking' | 'online' | 'offline';
    latency?: number;
}

export const DevSettings: React.FC = () => {
    const { userEmail, isAdmin, user, debugLogin } = useAuth();
    const [activeTab, setActiveTab] = useState<'actions' | 'session' | 'api' | 'feedback'>('actions');
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
        { name: 'Supabase', status: 'checking' },
        { name: 'R2 Storage', status: 'checking' },
    ]);
    const [debugLoginEnabled, setDebugLoginEnabled] = useState(() => {
        return localStorage.getItem('debugLoginEnabled') === 'true';
    });
    const [actionFeedback, setActionFeedback] = useState<string | null>(null);

    // Strict Access Control: Only allow Jamie
    if (!isAdmin || userEmail !== 'jamie@myjoe.app') {
        return <Navigate to="/dashboard" replace />;
    }

    // Fetch feedback when tab is active
    useEffect(() => {
        if (activeTab === 'feedback') {
            fetchFeedback();
        }
    }, [activeTab]);

    // Check API status when tab is active
    useEffect(() => {
        if (activeTab === 'api') {
            checkApiStatus();
        }
    }, [activeTab]);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('feedback')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setFeedback(data);
        } catch (error) {
            console.error('Error fetching feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkApiStatus = async () => {
        // Check Supabase
        const supabaseStart = performance.now();
        try {
            await supabase.from('feature_flags').select('id').limit(1);
            const latency = Math.round(performance.now() - supabaseStart);
            setApiStatuses(prev => prev.map(s =>
                s.name === 'Supabase' ? { ...s, status: 'online', latency } : s
            ));
        } catch {
            setApiStatuses(prev => prev.map(s =>
                s.name === 'Supabase' ? { ...s, status: 'offline' } : s
            ));
        }

        // Check R2 (via view-feedback-image endpoint)
        const r2Start = performance.now();
        try {
            const response = await fetch('/api/view-feedback-image?key=health-check', { method: 'HEAD' });
            const latency = Math.round(performance.now() - r2Start);
            // 404 is okay - means endpoint is working, just no file
            setApiStatuses(prev => prev.map(s =>
                s.name === 'R2 Storage' ? { ...s, status: response.status !== 500 ? 'online' : 'offline', latency } : s
            ));
        } catch {
            setApiStatuses(prev => prev.map(s =>
                s.name === 'R2 Storage' ? { ...s, status: 'offline' } : s
            ));
        }
    };

    const handleClearLocalStorage = () => {
        localStorage.clear();
        setActionFeedback('✓ Local storage cleared');
        setTimeout(() => setActionFeedback(null), 3000);
    };

    const handleResetOnboarding = async () => {
        // Clear local onboarding flags
        localStorage.removeItem('gemini_key');
        localStorage.removeItem('onboarding_complete');

        // Also clear from Supabase profile if user exists
        if (user?.id) {
            try {
                await supabase
                    .from('users')
                    .update({ gemini_api_key: null })
                    .eq('id', user.id);
            } catch (error) {
                console.error('Error resetting onboarding in DB:', error);
            }
        }

        setActionFeedback('✓ Onboarding reset - refresh to see modal');
        setTimeout(() => setActionFeedback(null), 3000);
    };

    const handleToggleDebugLogin = () => {
        const newValue = !debugLoginEnabled;
        setDebugLoginEnabled(newValue);
        localStorage.setItem('debugLoginEnabled', String(newValue));
        setActionFeedback(`✓ Debug login ${newValue ? 'enabled' : 'disabled'}`);
        setTimeout(() => setActionFeedback(null), 3000);
    };

    const handleMarkFeedback = async (id: string, newStatus: string) => {
        try {
            await supabase
                .from('feedback')
                .update({ status: newStatus })
                .eq('id', id);
            setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
        } catch (error) {
            console.error('Error updating feedback:', error);
        }
    };

    const getSessionExpiry = () => {
        // Try to get session info
        const sessionData = localStorage.getItem('sb-auth-token');
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                if (parsed.expires_at) {
                    return new Date(parsed.expires_at * 1000).toLocaleString();
                }
            } catch { }
        }
        return 'Unknown';
    };

    return (
        <div className="h-screen overflow-y-auto bg-[#0a0a0b] text-white font-sans">
            <Navigation />

            <main className="max-w-4xl mx-auto px-6 py-24">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        🔧 Dev Settings
                    </h1>
                    <p className="text-zinc-400 mt-2">Developer tools, debugging, and system management.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto pb-1">
                    {[
                        { id: 'actions', label: '⚡ Quick Actions' },
                        { id: 'session', label: '👤 Session Info' },
                        { id: 'api', label: '🔌 API Status' },
                        { id: 'feedback', label: '📬 Feedback Inbox' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`pb-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'text-amber-400 border-b-2 border-amber-400'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Action Feedback Toast */}
                {actionFeedback && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium">
                        {actionFeedback}
                    </div>
                )}

                {/* Tab Content */}
                <div className="space-y-6">
                    {/* Quick Actions Tab */}
                    {activeTab === 'actions' && (
                        <div className="grid gap-4">
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-lg font-semibold mb-4 text-white">Storage & State</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleClearLocalStorage}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">🗑️</span>
                                            <div className="text-left">
                                                <div className="font-medium text-white">Clear Local Storage</div>
                                                <div className="text-xs text-zinc-500">Remove all cached data and preferences</div>
                                            </div>
                                        </div>
                                        <span className="text-zinc-500 group-hover:text-red-400 transition-colors">→</span>
                                    </button>

                                    <button
                                        onClick={handleResetOnboarding}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">🔄</span>
                                            <div className="text-left">
                                                <div className="font-medium text-white">Reset Onboarding</div>
                                                <div className="text-xs text-zinc-500">Clear API key and show welcome modal</div>
                                            </div>
                                        </div>
                                        <span className="text-zinc-500 group-hover:text-blue-400 transition-colors">→</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-lg font-semibold mb-4 text-white">Development</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">🔐</span>
                                            <div className="text-left">
                                                <div className="font-medium text-white">Debug Login</div>
                                                <div className="text-xs text-zinc-500">Skip authentication for testing</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleToggleDebugLogin}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${debugLoginEnabled ? 'bg-purple-500' : 'bg-zinc-700'
                                                }`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${debugLoginEnabled ? 'left-7' : 'left-1'
                                                }`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Session Info Tab */}
                    {activeTab === 'session' && (
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-lg font-semibold mb-4 text-white">Current Session</h3>
                            <div className="space-y-3 font-mono text-sm">
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-zinc-400">User ID</span>
                                    <span className="text-white">{user?.id || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-zinc-400">Email</span>
                                    <span className="text-white">{userEmail || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-zinc-400">Session Expires</span>
                                    <span className="text-white">{getSessionExpiry()}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-zinc-400">Admin Status</span>
                                    <span className={isAdmin ? 'text-green-400' : 'text-red-400'}>
                                        {isAdmin ? '✓ Admin' : '✗ Not Admin'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-zinc-400">Auth Provider</span>
                                    <span className="text-white">{user?.app_metadata?.provider || 'email'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API Status Tab */}
                    {activeTab === 'api' && (
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Service Status</h3>
                                <button
                                    onClick={checkApiStatus}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    Refresh
                                </button>
                            </div>
                            <div className="space-y-3">
                                {apiStatuses.map(api => (
                                    <div key={api.name} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${api.status === 'online' ? 'bg-green-500' :
                                                api.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                                                }`} />
                                            <span className="text-white font-medium">{api.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {api.latency && (
                                                <span className="text-xs text-zinc-500">{api.latency}ms</span>
                                            )}
                                            <span className={`text-sm ${api.status === 'online' ? 'text-green-400' :
                                                api.status === 'offline' ? 'text-red-400' : 'text-yellow-400'
                                                }`}>
                                                {api.status === 'checking' ? 'Checking...' : api.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feedback Inbox Tab */}
                    {activeTab === 'feedback' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Feedback ({feedback.length})</h3>
                                <button
                                    onClick={fetchFeedback}
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : feedback.length === 0 ? (
                                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                                    <span className="text-4xl mb-4 block">📭</span>
                                    <p className="text-zinc-400">No feedback yet</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {feedback.map(item => (
                                        <div key={item.id} className={`p-4 rounded-xl border ${item.status === 'resolved'
                                            ? 'bg-white/3 border-white/5'
                                            : 'bg-white/5 border-white/10'
                                            }`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs uppercase font-medium ${item.type === 'bug'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                    {item.status === 'resolved' && (
                                                        <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                                                            ✓ Resolved
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-zinc-500">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </span>
                                            </div>

                                            <p className="text-white mb-3">{item.message}</p>

                                            <div className="text-xs text-zinc-500 truncate mb-3">
                                                Page: {item.page_url}
                                            </div>

                                            {item.screenshot_url && (
                                                <div className="mb-3">
                                                    <img
                                                        src={item.screenshot_url.startsWith('r2://')
                                                            ? `/api/view-feedback-image?key=${item.screenshot_url.replace('r2://', '')}`
                                                            : item.screenshot_url}
                                                        alt="Screenshot"
                                                        className="max-h-48 rounded-lg border border-white/10 object-contain bg-black cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => window.open(
                                                            item.screenshot_url?.startsWith('r2://')
                                                                ? `/api/view-feedback-image?key=${item.screenshot_url.replace('r2://', '')}`
                                                                : item.screenshot_url,
                                                            '_blank'
                                                        )}
                                                    />
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                {item.status !== 'resolved' ? (
                                                    <button
                                                        onClick={() => handleMarkFeedback(item.id, 'resolved')}
                                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                                    >
                                                        Mark Resolved
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleMarkFeedback(item.id, 'new')}
                                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-zinc-400 hover:bg-white/20 transition-colors"
                                                    >
                                                        Reopen
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DevSettings;
