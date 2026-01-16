import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DevToolbar: React.FC = () => {
    const { userEmail } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const location = useLocation();

    // Only visible to Jamie
    if (userEmail !== 'jamie@myjoe.app') {
        return null;
    }

    return (
        <div className={`fixed top-24 right-6 z-[100] transition-all duration-300 flex flex-col items-end gap-2`}>

            {/* Toolbar Content */}
            {isExpanded && (
                <div className="bg-[#0a0a0b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 min-w-[200px] animate-in mb-2">
                    <div className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 mb-1">
                        Dev Controls
                    </div>

                    <Link
                        to="/admin"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors ${location.pathname === '/admin' ? 'bg-white/10 text-white' : 'text-zinc-400'}`}
                    >
                        <span className="text-lg">🛡️</span>
                        Admin Dashboard
                    </Link>

                    <Link
                        to="/dev-settings"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors ${location.pathname === '/dev-settings' ? 'bg-white/10 text-white' : 'text-zinc-400'}`}
                    >
                        <span className="text-lg">🔧</span>
                        Dev Settings
                    </Link>

                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/5 transition-colors"
                    >
                        <span className="text-lg">🏠</span>
                        Dashboard
                    </Link>

                    <Link
                        to="/studio"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/5 transition-colors"
                    >
                        <span className="text-lg">🎨</span>
                        Studio Launchpad
                    </Link>

                    <div className="px-3 py-2 text-[10px] text-zinc-600 font-mono mt-1 border-t border-white/5">
                        Current Route: {location.pathname}
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg border border-white/10 transition-all hover:scale-105 active:scale-95 ${isExpanded ? 'bg-white text-black' : 'bg-black/80 text-white hover:bg-black'}`}
                title="Developer Toolbar"
            >
                {isExpanded ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                )}
            </button>
        </div>
    );
};
