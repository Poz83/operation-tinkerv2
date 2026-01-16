import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { SavedProject } from '../types'; // Reuse SavedProject for list view for now, casting later if needed
import { fetchUserProjects } from '../services/projectsService';
import heroLabIcon from '../assets/hero-lab.png';

// Since we don't have a specialized fetch for just hero lab yet, we'll filter client side or update service later
// For now assuming fetchUserProjects gets everything and we filter by tool_type if strictly needed, 
// though currently projectsService might return all. 
// We'll update the fetcher in the next step to be more specific if needed, but for now we'll just show them.

export const HeroLabLaunchpad: React.FC = () => {
    const [projects, setProjects] = useState<SavedProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadProjects() {
            try {
                setIsLoading(true);
                const allProjects = await fetchUserProjects();
                // Filter for Hero Lab projects (we'll need to ensure we save them with this type)
                // For now, let's just show all to be safe or filter if we can distinguish
                // In a real app we'd filter by tool_type = 'hero_lab'
                // Assuming we'll add that property to saved projects soon.
                const heroProjects = allProjects.filter(p => (p as any).toolType === 'hero_lab');
                setProjects(heroProjects.sort((a, b) => b.updatedAt - a.updatedAt));
            } catch (err) {
                console.error('Failed to load heroes:', err);
            } finally {
                setIsLoading(false);
            }
        }
        loadProjects();
    }, []);

    const handleCreateNew = () => {
        const randomId = Math.floor(100000 + Math.random() * 900000).toString();
        // We'll use a query param or just the route to signal it's a new hero
        navigate(`/hero-lab/${randomId}`);
    };

    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-white font-sans selection:bg-blue-500/30">
            <div className="aurora-veil opacity-50" />
            <Navigation />

            <main className="container mx-auto px-6 pt-24 pb-12 relative z-10 max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
                        <img src={heroLabIcon} alt="Hero Lab" className="w-16 h-16 object-contain" />
                    </div>
                    <h1 className="text-5xl font-bold">
                        <span className="text-gradient-primary">Hero</span> Lab
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Design unique characters with consistent DNA. Create your hero once, use them forever.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
                    {/* Create New Hero */}
                    <button
                        onClick={handleCreateNew}
                        className="group relative h-64 rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-white/10 overflow-hidden hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center text-center p-8 hover:shadow-2xl hover:shadow-blue-500/20"
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/20 shadow-inner">
                            <span className="text-4xl">🧬</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">New Character</h2>
                        <p className="text-zinc-300">Design a new hero from scratch</p>
                    </button>

                    {/* Browse Existing */}
                    <button
                        disabled={projects.length === 0}
                        className="group relative h-64 rounded-3xl bg-[#131314] border border-white/10 overflow-hidden hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center text-center p-8 hover:border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6 border border-white/10 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all">
                            <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">👥</span>
                        </div>
                        <h2 className="text-3xl font-bold text-zinc-300 group-hover:text-white transition-colors">Load Hero</h2>
                        <p className="text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            {projects.length} heroes saved
                        </p>
                    </button>
                </div>

                {/* Project List (Mini) */}
                {projects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {projects.map(p => (
                            <div
                                key={p.id}
                                onClick={() => navigate(`/hero-lab/${p.id}`)}
                                className="bg-[#131314] border border-white/10 rounded-xl p-4 hover:border-blue-500/50 cursor-pointer transition-all flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-white">{p.projectName}</h3>
                                    <p className="text-xs text-zinc-500">Updated {new Date(p.updatedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
