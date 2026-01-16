import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Navigation } from '../components/Navigation';
import { useSearchParams } from 'react-router-dom';

type AdminTab = 'overview' | 'users' | 'inbox';

// Types for our data
interface FeatureFlag {
    id: string;
    key: string;
    enabled: boolean;
    description: string;
}

interface UserProfile {
    id: string;
    email: string;
    is_whitelisted: boolean;
    created_at: string;
}

interface FeedbackItem {
    id: string;
    type: string;
    message: string;
    page_url: string;
    created_at: string;
    user_id: string;
    status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'wont_fix';
    screenshot_url?: string;
    user_email?: string;
}

import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// Best Practices Component
const FeedbackBestPractices = () => (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-400 mb-3">🛡️ Feedback Triage Best Practices</h3>
        <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
            <li className="flex gap-2">
                <span className="text-blue-400">1.</span>
                <span><strong>Daily Triage:</strong> Check this inbox every morning to catch critical bugs early.</span>
            </li>
            <li className="flex gap-2">
                <span className="text-blue-400">2.</span>
                <span><strong>Categorize:</strong> Mark items as <span className="text-yellow-400">In Progress</span> when you start working on them.</span>
            </li>
            <li className="flex gap-2">
                <span className="text-blue-400">3.</span>
                <span><strong>Console Logs:</strong> Look for the "CONSOLE LOGS" section in reports to trace errors.</span>
            </li>
            <li className="flex gap-2">
                <span className="text-blue-400">4.</span>
                <span><strong>Clean Up:</strong> Mark finished items as <span className="text-green-400">Resolved</span> to keep the inbox clean.</span>
            </li>
        </ul>
    </div>
);

export const AdminDashboard: React.FC = () => {
    const { userEmail, isAdmin } = useAuth();
    const [searchParams] = useSearchParams();

    // Strict Access Control: Only allow Jamie
    if (!isAdmin || userEmail !== 'jamie@myjoe.app') {
        return <Navigate to="/dashboard" replace />;
    }

    const [activeTab, setActiveTab] = useState<AdminTab>((searchParams.get('tab') as AdminTab) || 'overview');
    const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tab = searchParams.get('tab') as AdminTab;
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const { data } = await supabase.from('feature_flags').select('*').order('key');
                if (data) setFeatureFlags(data);
            } else if (activeTab === 'users') {
                const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
                if (data) setUsers(data);
            } else if (activeTab === 'inbox') {
                // Fetch feedback with user emails if possible (requires join, or just raw fetch)
                // For now simple fetch, status is usually 'new' by default
                const { data } = await supabase
                    .from('feedback')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (data) setFeedback(data as FeedbackItem[]);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (oldPass: string, newPass: string) => {
        try {
            // Verify old password
            const { data } = await supabase
                .from('app_settings' as any)
                .select('value')
                .eq('key', 'dev_password')
                .single();

            const setting = data as any;

            if (!setting || setting.value !== oldPass) {
                alert('Incorrect old password');
                return;
            }

            // Update to new password
            const { error } = await supabase
                .from('app_settings' as any)
                .update({ value: newPass, updated_at: new Date().toISOString() })
                .eq('key', 'dev_password');

            if (error) throw error;
            alert('Password updated successfully');
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Failed to update password');
        }
    };

    const toggleFeature = async (id: string, currentValue: boolean) => {
        try {
            const { error } = await supabase.from('feature_flags').update({ enabled: !currentValue }).eq('id', id);
            if (!error) {
                setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !currentValue } : f));
            }
        } catch (error) {
            console.error('Error toggling feature:', error);
        }
    };

    const toggleWhitelist = async (userId: string, currentValue: boolean) => {
        try {
            const { error } = await supabase.from('users').update({ is_whitelisted: !currentValue }).eq('id', userId);
            if (!error) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_whitelisted: !currentValue } : u));
            }
        } catch (error) {
            console.error('Error toggling whitelist:', error);
        }
    };

    const updateFeedbackStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase.from('feedback').update({ status: newStatus }).eq('id', id);
            if (!error) {
                setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus as any } : f));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDeleteFeedback = async (id: string) => {
        if (!confirm('Are you sure you want to delete this submission? This cannot be undone.')) return;

        try {
            const { error } = await supabase.from('feedback').delete().eq('id', id);
            if (error) throw error;
            setFeedback(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error('Error deleting feedback:', error);
            alert('Failed to delete feedback');
        }
    };

    const parseMessage = (fullMessage: string) => {
        const parts = fullMessage.split('\n\n--- CONSOLE LOGS ---\n');
        const userMessage = parts[0];
        const logs = parts.length > 1 ? parts[1] : null;
        return { userMessage, logs };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'reviewed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'wont_fix': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
            default: return 'bg-zinc-500/20 text-zinc-400';
        }
    };

    return (
        <div className="h-screen overflow-y-auto bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-24">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Dev Portal
                    </h1>
                    <p className="text-[hsl(var(--muted-foreground))] mt-2">Central command for Myjoe development.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-[hsl(var(--border))]">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
                    >
                        Feature Flags
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'users' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'inbox' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
                    >
                        Feedback
                    </button>
                    <button
                        onClick={() => setActiveTab('tools' as AdminTab)}
                        className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === ('tools' as AdminTab) ? 'text-purple-400 border-b-2 border-purple-400' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
                    >
                        Dev Tools
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activeTab === 'overview' && (
                            <div className="grid gap-4">
                                {featureFlags.map(flag => (
                                    <div key={flag.id} className="p-4 rounded-xl bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold">{flag.key}</h3>
                                            <p className="text-sm text-[hsl(var(--muted-foreground))]">{flag.description}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleFeature(flag.id, flag.enabled)}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${flag.enabled ? 'bg-purple-500' : 'bg-[hsl(var(--muted))]'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-[hsl(var(--foreground))] transition-transform ${flag.enabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}
                                {featureFlags.length === 0 && <p className="text-zinc-500">No feature flags found.</p>}
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-[hsl(var(--muted-foreground))]">
                                    <thead className="text-xs uppercase bg-[hsl(var(--card))]/50 text-[hsl(var(--muted-foreground))]">
                                        <tr>
                                            <th className="px-6 py-3 rounded-l-lg">Email</th>
                                            <th className="px-6 py-3">Created At</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 rounded-r-lg">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/10 transition-colors">
                                                <td className="px-6 py-4 font-medium text-[hsl(var(--foreground))]">{user.email}</td>
                                                <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs ${user.is_whitelisted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {user.is_whitelisted ? 'Whitelisted' : 'Restricted'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => toggleWhitelist(user.id, user.is_whitelisted)}
                                                        className="text-purple-400 hover:text-purple-300 font-medium"
                                                    >
                                                        {user.is_whitelisted ? 'Revoke' : 'Approve'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'inbox' && (
                            <div className="space-y-6">
                                <FeedbackBestPractices />

                                <div className="grid gap-4">
                                    {feedback.map(item => {
                                        const { userMessage, logs } = parseMessage(item.message);
                                        return (
                                            <div key={item.id} className="p-6 rounded-xl bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] transition-all">
                                                {/* Header Line */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex gap-2 items-center">
                                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wide ${item.type === 'bug' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                            {item.type}
                                                        </span>
                                                        <select
                                                            value={item.status}
                                                            onChange={(e) => updateFeedbackStatus(item.id, e.target.value)}
                                                            className={`text-xs px-2 py-1 rounded border appearance-none cursor-pointer font-medium ${getStatusColor(item.status)} bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500`}
                                                        >
                                                            <option value="new">New</option>
                                                            <option value="reviewed">Reviewed</option>
                                                            <option value="in_progress">In Progress</option>
                                                            <option value="resolved">Resolved</option>
                                                            <option value="wont_fix">Won't Fix</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleDeleteFeedback(item.id)}
                                                            className="p-1 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
                                                            title="Delete Feedback"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(item.created_at).toLocaleString()}</span>
                                                </div>

                                                {/* Content */}
                                                <div className="space-y-4">
                                                    <p className="text-[hsl(var(--foreground))] whitespace-pre-wrap">{userMessage}</p>

                                                    {logs && (
                                                        <details className="text-sm bg-black/40 rounded-lg border border-white/5 overflow-hidden">
                                                            <summary className="px-4 py-2 cursor-pointer hover:bg-white/5 text-[hsl(var(--muted-foreground))] transition-colors select-none font-mono text-xs">
                                                                ▶ View Console Logs
                                                            </summary>
                                                            <pre className="p-4 overflow-x-auto text-[10px] sm:text-xs text-zinc-400 font-mono whitespace-pre-wrap">
                                                                {logs}
                                                            </pre>
                                                        </details>
                                                    )}

                                                    <div className="text-xs font-mono text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/30 px-3 py-1.5 rounded w-fit">
                                                        Page: {item.page_url}
                                                    </div>

                                                    {item.screenshot_url && (
                                                        <div className="mt-4 border-t border-[hsl(var(--border))] pt-4">
                                                            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wide">Screenshot Attachment</p>
                                                            <a
                                                                href={item.screenshot_url.startsWith('r2://')
                                                                    ? `/api/view-feedback-image?key=${item.screenshot_url.replace('r2://', '')}`
                                                                    : item.screenshot_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block w-fit group"
                                                            >
                                                                <img
                                                                    src={item.screenshot_url.startsWith('r2://')
                                                                        ? `/api/view-feedback-image?key=${item.screenshot_url.replace('r2://', '')}`
                                                                        : item.screenshot_url}
                                                                    alt="User screenshot"
                                                                    className="h-48 rounded-lg border border-[hsl(var(--border))] object-contain bg-black/50 group-hover:border-purple-500/50 transition-colors"
                                                                />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {feedback.length === 0 && (
                                        <div className="text-center py-12 text-zinc-500">
                                            <p className="text-4xl mb-2">🎉</p>
                                            <p>Inbox Status: Zero!</p>
                                            <p className="text-sm">No pending feedback to review.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === ('tools' as AdminTab) && (
                            <div className="grid gap-6">
                                <div className="p-8 rounded-xl bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))]">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">Security Settings</h3>
                                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage access to the Dev Portal.</p>
                                        </div>
                                    </div>

                                    <div className="max-w-md space-y-4">
                                        <h4 className="font-medium text-sm text-[hsl(var(--foreground))]">Change Dev Portal Password</h4>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const oldPass = (e.currentTarget.elements.namedItem('oldPass') as HTMLInputElement).value;
                                            const newPass = (e.currentTarget.elements.namedItem('newPass') as HTMLInputElement).value;
                                            handleChangePassword(oldPass, newPass);
                                            e.currentTarget.reset();
                                        }} className="space-y-3">
                                            <input
                                                name="oldPass"
                                                type="password"
                                                placeholder="Current Password"
                                                className="w-full px-4 py-2.5 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                                            />
                                            <input
                                                name="newPass"
                                                type="password"
                                                placeholder="New Password"
                                                className="w-full px-4 py-2.5 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                                            />
                                            <button
                                                type="submit"
                                                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                                            >
                                                Update Password
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                <div className="p-8 rounded-xl bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] text-center opacity-50">
                                    <h3 className="text-lg font-semibold mb-2">More Tools Coming Soon</h3>
                                    <p className="text-[hsl(var(--muted-foreground))]">Additional debugging utilities will be added here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
