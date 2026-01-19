import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { PAGE_SIZES, VISUAL_STYLES, SavedProject } from '../types';
import { fetchUserProjects, deleteProject } from '../services/projectsService';
import coloringStudioIcon from '../assets/coloring-studio.png';

export const StudioLaunchpad: React.FC = () => {
    const [projects, setProjects] = useState<SavedProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadProjects() {
            try {
                setIsLoading(true);
                // 1. Cache First (Instant)
                const cached = await fetchUserProjects('cache-first');
                if (cached.length > 0) {
                    setProjects(cached.sort((a, b) => b.updatedAt - a.updatedAt));
                    setIsLoading(false); // Show content immediately
                }

                // 2. Network Update (Fresh)
                const fresh = await fetchUserProjects('network-only');
                setProjects(fresh.sort((a, b) => b.updatedAt - a.updatedAt));
            } catch (err) {
                console.error('Failed to load projects:', err);
                if (projects.length === 0) {
                    setError('Failed to load recent projects.');
                }
            } finally {
                setIsLoading(false);
            }
        }
        loadProjects();
    }, []);

    const handleCreateNew = () => {
        // Generate a random 6-digit ID
        const randomId = Math.floor(100000 + Math.random() * 900000).toString();
        navigate(`/studio/project/${randomId}`);
    };

    const handleOpenProject = (projectId: string) => {
        navigate(`/studio/project/${projectId}`);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await deleteProject(id);
                setProjects(projects.filter(p => p.id !== id));
            } catch (err) {
                console.error('Failed to delete project:', err);
            }
        }
    };

    const getStyleLabel = (id: string) => VISUAL_STYLES.find(s => s.id === id)?.label || id;

    return (
        <div className="h-screen overflow-y-auto bg-[hsl(var(--background))] text-white font-sans selection:bg-purple-500/30 no-scrollbar">
            <div className="aurora-veil" />
            <Navigation />

            <main className="container mx-auto px-6 pt-24 pb-12 relative z-10 max-w-6xl">
                <div className="text-center mb-8 space-y-4">
                    <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-2xl shadow-purple-500/10 backdrop-blur-sm">
                        <img src={coloringStudioIcon} alt="Studio" className="w-16 h-16 object-contain" />
                    </div>
                    <h1 className="text-5xl font-bold">
                        <span className="text-gradient-sleek">Coloring Book</span> Studio
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Create stunning AI-generated coloring pages. Start a new masterpiece or continue where you left off.
                    </p>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {/* Create New Card */}
                    <button
                        onClick={handleCreateNew}
                        className="group relative h-48 rounded-3xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 overflow-hidden hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center text-center p-6 hover:shadow-2xl hover:shadow-purple-500/20"
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 border border-white/20 shadow-inner">
                            <span className="text-3xl">✨</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">Create New Project</h2>
                        <p className="text-zinc-300 text-sm">Start from scratch with a fresh canvas</p>
                    </button>

                    {/* Open Vault Card (or Browse) */}
                    <button
                        onClick={() => navigate('/vault')}
                        className="group relative h-48 rounded-3xl bg-[#131314] border border-white/10 overflow-hidden hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center text-center p-6 hover:border-purple-500/30"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 border border-white/10 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all">
                            <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">📂</span>
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-300 group-hover:text-white transition-colors mb-1">Open Vault</h2>
                        <p className="text-zinc-500 group-hover:text-zinc-400 transition-colors text-sm">Browse all your saved collections</p>
                    </button>
                </div>

                {/* Recent Projects */}
                {projects.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white">Recent Projects</h3>
                            <button onClick={() => navigate('/vault')} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">View All →</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {projects.slice(0, 4).map((project) => (
                                <div
                                    key={project.id}
                                    onClick={() => handleOpenProject(project.id)}
                                    className="group relative bg-[#131314] border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 cursor-pointer flex flex-col h-[280px]"
                                >
                                    {/* Preview */}
                                    <div className="h-[160px] bg-black/50 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-30" />
                                        {project.thumbnail ? (
                                            <img
                                                src={project.thumbnail}
                                                alt={project.projectName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : project.heroImage ? (
                                            <img
                                                src={`data:${project.heroImage.mimeType};base64,${project.heroImage.base64}`}
                                                alt={project.projectName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <span className="text-4xl opacity-50">🎨</span>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm font-medium text-white">
                                                Resume Editing
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-bold text-white mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
                                                {project.projectName || 'Untitled Project'}
                                            </h4>
                                            <p className="text-xs text-zinc-500">
                                                Edited {new Date(project.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/5 text-zinc-400">
                                                {getStyleLabel(project.visualStyle)}
                                            </span>
                                            <button
                                                onClick={(e) => handleDelete(project.id, e)}
                                                className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                                                title="Delete"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-zinc-500">Loading your creative space...</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudioLaunchpad;
