/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { PAGE_SIZES, VISUAL_STYLES, TARGET_AUDIENCES, SavedProject } from '../types';

export const Vault: React.FC = () => {
    const [projects, setProjects] = useState<SavedProject[]>([]);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        try {
            // 1. Load list-based projects
            const existingJson = localStorage.getItem('myjoe_projects');
            let loadedProjects: SavedProject[] = existingJson ? JSON.parse(existingJson) : [];

            // 2. Migration Check: Check for old single-project config
            const legacyConfig = localStorage.getItem('coloring_book_config');
            if (legacyConfig) {
                try {
                    const legacyProject = JSON.parse(legacyConfig);
                    // Only migrate if we don't already have it (check by name or something simple)
                    const alreadyMigrated = loadedProjects.some(p => p.createdAt === legacyProject.createdAt);

                    if (!alreadyMigrated) {
                        const newProject: SavedProject = {
                            ...legacyProject,
                            id: crypto.randomUUID(),
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        };
                        // Add to list
                        loadedProjects.push(newProject);
                        // Save back to list
                        localStorage.setItem('myjoe_projects', JSON.stringify(loadedProjects));
                        // Optional: Remove legacy? Maybe keep for safety for now.
                        // localStorage.removeItem('coloring_book_config');
                    }
                } catch (e) {
                    console.error("Migration failed", e);
                }
            }

            // Sort by updatedAt desc
            loadedProjects.sort((a, b) => b.updatedAt - a.updatedAt);
            setProjects(loadedProjects);

        } catch (e) {
            console.error('Failed to load projects:', e);
        }
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (window.confirm('Are you sure you want to delete this project?')) {
            const updated = projects.filter(p => p.id !== id);
            setProjects(updated);
            localStorage.setItem('myjoe_projects', JSON.stringify(updated));
        }
    };

    const handleOpenProject = (project: SavedProject) => {
        navigate(`/studio/${project.id}`);
    };

    const getStyleLabel = (id: string) => VISUAL_STYLES.find(s => s.id === id)?.label || id;
    const getSizeLabel = (id: string) => PAGE_SIZES.find(s => s.id === id)?.label || id;

    const filteredProjects = projects.filter(p =>
        p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStyleLabel(p.visualStyle).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-white font-sans selection:bg-purple-500/30">
            <div className="aurora-veil" />
            <Navigation />

            <main className="container mx-auto px-6 pt-24 pb-12 relative z-10">
                {/* Header Area */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold mb-3">
                            <span className="text-gradient-sleek">Your</span> Vault
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Manage your creative collection.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all w-64"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/studio')}
                            className="btn-primary shadow-lg shadow-purple-500/20 px-6 py-2.5 flex items-center gap-2"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                            Create New
                        </button>
                    </div>
                </header>

                {/* Content Grid */}
                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center mb-6 shadow-inner border border-white/5">
                            <span className="text-4xl grayscale opacity-30">📂</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Your Vault is Empty</h2>
                        <p className="text-zinc-500 max-w-md mb-8">
                            Projects you save in the Studio will appear here. Start creating your first masterpiece today!
                        </p>
                        <button
                            onClick={() => navigate('/studio')}
                            className="btn-primary"
                        >
                            Go to Studio
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => handleOpenProject(project)}
                                className="group relative bg-[#131314] border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer flex flex-col"
                            >

                                {/* Preview Area */}
                                <div className="aspect-[16/9] bg-black/50 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                                    {/* Gradient Background based on ID to give unique feel if no image */}
                                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-transparent" />

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
                                        <div className="text-4xl opacity-50 group-hover:scale-110 transition-transform duration-300">
                                            🎨
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#131314] via-transparent to-transparent opacity-60" />

                                    {/* Top Badges */}
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <span className="px-2 py-1 rounded-md bg-black/60 border border-white/10 backdrop-blur text-[10px] font-medium text-zinc-300">
                                            {getSizeLabel(project.pageSizeId)}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
                                        {project.projectName || 'Untitled Project'}
                                    </h3>
                                    <p className="text-xs text-zinc-500 mb-4">
                                        Last edited {new Date(project.updatedAt).toLocaleDateString()}
                                    </p>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <span className="w-4 h-4 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">📄</span>
                                            <span>{project.pageAmount} Pages</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <span className="w-4 h-4 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">🎭</span>
                                            <span className="truncate">{getStyleLabel(project.visualStyle)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-xs font-medium text-purple-400 group-hover:underline">Opent Project</span>

                                        <button
                                            onClick={(e) => handleDelete(project.id, e)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                                            title="Delete Project"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Vault;
