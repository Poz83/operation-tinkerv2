/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CHANGELOG } from '../data/changelog';
import { Navigation } from '../components/Navigation';

const Updates: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-cyan-500/30">
            <Navigation />

            <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-4">
                        What's New
                    </h1>
                    <p className="text-lg text-zinc-400">
                        The latest improvements and updates to the myjoe Creative Suite.
                    </p>
                </div>

                <div className="space-y-12 relative animate-fade-in-up">
                    {/* Timeline Line */}
                    <div className="absolute left-8 top-4 bottom-4 w-px bg-gradient-to-b from-cyan-500/50 via-zinc-800 to-transparent hidden md:block" />

                    {CHANGELOG.map((entry, index) => (
                        <div key={entry.id} className="relative md:pl-24">
                            {/* Timeline Logic */}
                            <div className="absolute left-[30px] top-6 w-3 h-3 rounded-full bg-cyan-500 border-4 border-[#09090b] shadow-[0_0_10px_rgba(6,182,212,0.5)] hidden md:block z-10" />

                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:border-white/20 transition-all duration-300 group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium border
                                            ${entry.type === 'major'
                                                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200'
                                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                            }`}
                                        >
                                            {entry.version}
                                        </div>
                                        <span className="text-sm text-zinc-500 font-mono">
                                            {new Date(entry.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-400 transition-colors">
                                    {entry.title}
                                </h2>
                                <p className="text-zinc-400 mb-6 leading-relaxed">
                                    {entry.description}
                                </p>

                                <ul className="space-y-3">
                                    {entry.changes.map((change, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500/50 shrink-0" />
                                            <span>{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}

                    <div className="text-center pt-12 pb-8">
                        <div className="inline-block p-4 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-sm">
                            End of Log
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Updates;
