import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Navigation } from '../components/Navigation';

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
    status: string;
    screenshot_url?: string;
}

export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);

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
                const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
                if (data) setFeedback(data);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFeature = async (id: string, currentValue: boolean) => {
        try {
            const { error } = await supabase.from('feature_flags').update({ enabled: !currentValue } as any).eq('id', id);
            if (!error) {
                setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !currentValue } : f));
            }
        } catch (error) {
            console.error('Error toggling feature:', error);
        }
    };

    const toggleWhitelist = async (userId: string, currentValue: boolean) => {
        try {
            const { error } = await supabase.from('users').update({ is_whitelisted: !currentValue } as any).eq('id', userId);
            if (!error) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_whitelisted: !currentValue } : u));
            }
        } catch (error) {
            console.error('Error toggling whitelist:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white font-sans">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-24">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Admin Dashboard
                    </h1>
                    <p className="text-zinc-400 mt-2">Manage settings, users, and feedback.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Feature Flags
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'users' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Users & Whitelist
                    </button>
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'inbox' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Feedback Inbox
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
                                    <div key={flag.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold">{flag.key}</h3>
                                            <p className="text-sm text-zinc-400">{flag.description}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleFeature(flag.id, flag.enabled)}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${flag.enabled ? 'bg-purple-500' : 'bg-zinc-700'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${flag.enabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}
                                {featureFlags.length === 0 && <p className="text-zinc-500">No feature flags found.</p>}
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-zinc-400">
                                    <thead className="text-xs uppercase bg-white/5 text-zinc-300">
                                        <tr>
                                            <th className="px-6 py-3 rounded-l-lg">Email</th>
                                            <th className="px-6 py-3">Created At</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 rounded-r-lg">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">{user.email}</td>
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
                            <div className="grid gap-4">
                                {feedback.map(item => (
                                    <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs uppercase ${item.type === 'bug' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-zinc-500">{new Date(item.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-white mb-3">{item.message}</p>
                                        <div className="text-xs text-zinc-500 truncate mb-3">Page: {item.page_url}</div>
                                        {item.screenshot_url && (
                                            <div className="mt-2">
                                                <p className="text-xs font-medium text-zinc-400 mb-1">Screenshot attached</p>
                                                <img
                                                    src={item.screenshot_url.startsWith('r2://')
                                                        ? `/api/view-feedback-image?key=${item.screenshot_url.replace('r2://', '')}`
                                                        : item.screenshot_url}
                                                    alt="User screenshot"
                                                    className="h-32 rounded border border-white/10 object-contain bg-black"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {feedback.length === 0 && <p className="text-zinc-500">No feedback yet.</p>}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
