/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLogger } from '../../hooks/useLogger';
import { LogChannel, LogLevel, LogEntry } from '../../lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

export const LogViewer: React.FC = () => {
    const { logs, clearLogs, filterLogs } = useLogger();
    const [isOpen, setIsOpen] = useState(false);
    const [minLevel, setMinLevel] = useState<LogLevel>('DEBUG');
    const [enabledChannels, setEnabledChannels] = useState<Set<LogChannel>>(
        new Set(['AI', 'SYSTEM', 'UI', 'NETWORK', 'USER'])
    );
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter logs for display
    const filteredLogs = filterLogs(logs, enabledChannels, minLevel);

    // Auto-scroll effect
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [filteredLogs, autoScroll]);

    const toggleChannel = (channel: LogChannel) => {
        const next = new Set(enabledChannels);
        if (next.has(channel)) next.delete(channel);
        else next.add(channel);
        setEnabledChannels(next);
    };

    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const channels: LogChannel[] = ['AI', 'SYSTEM', 'NETWORK', 'UI', 'USER'];

    return (
        <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none flex flex-col items-end">
            {/* Floating Toggle Button */}
            <div className="pointer-events-auto">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all
            ${isOpen ? 'bg-slate-800 text-white' : 'bg-white text-slate-800 border border-slate-200'}
          `}
                >
                    <span className="text-lg">🐞</span>
                    <span className="font-semibold text-sm">Debug</span>
                    {isOpen && (
                        <span className="ml-2 text-xs bg-slate-700 px-2 py-0.5 rounded-full">
                            {filteredLogs.length}
                        </span>
                    )}
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="pointer-events-auto mt-4 w-[600px] max-w-[90vw] bg-slate-900 rounded-lg shadow-2xl border border-slate-700 text-slate-300 flex flex-col overflow-hidden font-mono text-xs"
                        style={{ maxHeight: '600px' }}
                    >
                        {/* Header / Controls */}
                        <div className="p-3 bg-slate-800 border-b border-slate-700 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                                    <span>System Logs</span>
                                    <span className="text-[10px] font-normal text-slate-400 bg-slate-700 px-1.5 rounded">
                                        {logs.length} entries
                                    </span>
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAutoScroll(!autoScroll)}
                                        className={`px-2 py-1 rounded text-[10px] border ${autoScroll ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'border-slate-600 text-slate-400'}`}
                                    >
                                        Auto-scroll
                                    </button>
                                    <button
                                        onClick={clearLogs}
                                        className="px-2 py-1 rounded text-[10px] border border-red-900/50 hover:bg-red-900/20 text-red-400"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-4 select-none">
                                <div className="flex gap-1 items-center">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Level</span>
                                    <select
                                        value={minLevel}
                                        onChange={(e) => setMinLevel(e.target.value as LogLevel)}
                                        className="bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-[10px] outline-none focus:border-blue-500"
                                    >
                                        {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>

                                <div className="flex gap-2 items-center flex-wrap">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Channels</span>
                                    {channels.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => toggleChannel(c)}
                                            className={`
                            px-1.5 py-0.5 rounded text-[10px] border transition-colors
                            ${enabledChannels.has(c)
                                                    ? getChannelBadgeStyle(c)
                                                    : 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'
                                                }
                        `}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Log Stream */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                        >
                            {filteredLogs.length === 0 && (
                                <div className="text-center py-8 text-slate-600 italic">
                                    No logs matching filters...
                                </div>
                            )}
                            {filteredLogs.map((entry) => (
                                <LogItem key={entry.id} entry={entry} />
                            ))}
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LogItem: React.FC<{ entry: LogEntry }> = ({ entry }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="group">
            <div
                onClick={() => setExpanded(!expanded)}
                className={`
                    flex gap-2 px-2 py-1 rounded hover:bg-slate-800 cursor-pointer
                    ${entry.level === 'ERROR' ? 'bg-red-900/10 hover:bg-red-900/20' : ''}
                `}
            >
                <div className="w-14 text-slate-500 shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className={`w-14 font-bold shrink-0 text-center ${getChannelTextColor(entry.channel)}`}>
                    {entry.channel}
                </div>
                <div className={`w-10 font-bold shrink-0 text-center ${getLevelColor(entry.level)}`}>
                    {entry.level !== 'INFO' ? entry.level : ''}
                </div>
                <div className="flex-1 truncate text-slate-300">
                    {entry.message}
                </div>
                {entry.data && (
                    <div className="text-slate-500 text-[10px] shrink-0">
                        {expanded ? '▼' : '{...}'}
                    </div>
                )}
            </div>
            {expanded && entry.data && (
                <div className="pl-20 pr-2 py-2 text-slate-400 overflow-x-auto">
                    <pre className="text-[10px] bg-slate-950 p-2 rounded border border-slate-800">
                        {JSON.stringify(entry.data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

function getChannelBadgeStyle(channel: LogChannel): string {
    switch (channel) {
        case 'AI': return 'bg-violet-900/30 border-violet-500/50 text-violet-300';
        case 'UI': return 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300';
        case 'NETWORK': return 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300';
        case 'SYSTEM': return 'bg-slate-700/50 border-slate-500/50 text-slate-300';
        case 'USER': return 'bg-amber-900/30 border-amber-500/50 text-amber-300';
        default: return 'bg-slate-800 border-slate-600 text-slate-400';
    }
}

function getChannelTextColor(channel: LogChannel): string {
    switch (channel) {
        case 'AI': return 'text-violet-400';
        case 'UI': return 'text-cyan-400';
        case 'NETWORK': return 'text-emerald-400';
        case 'SYSTEM': return 'text-slate-400';
        case 'USER': return 'text-amber-400';
        default: return 'text-slate-400';
    }
}

function getLevelColor(level: LogLevel): string {
    switch (level) {
        case 'DEBUG': return 'text-slate-500';
        case 'INFO': return 'text-blue-400';
        case 'WARN': return 'text-yellow-400';
        case 'ERROR': return 'text-red-400';
    }
}
