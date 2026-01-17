import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from '../components/Navigation';
import { VISUAL_STYLES, TARGET_AUDIENCES, COMPLEXITY_LEVELS } from '../types';
import { fetchPublicGalleryImages, GalleryImage, GalleryFilters } from '../services/galleryService';

export const Gallery: React.FC = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);

    // Filters
    const [filters, setFilters] = useState<GalleryFilters>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

    const loadImages = useCallback(async (pageNum: number, append: boolean = false) => {
        try {
            if (pageNum === 1) setIsLoading(true);
            setError(null);

            const result = await fetchPublicGalleryImages(pageNum, 24, {
                ...filters,
                search: searchTerm || undefined
            });

            setImages(prev => append ? [...prev, ...result.images] : result.images);
            setHasMore(result.hasMore);
            setTotal(result.total);
        } catch (err) {
            console.error('Failed to load gallery:', err);
            setError('Failed to load gallery. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [filters, searchTerm]);

    useEffect(() => {
        setPage(1);
        loadImages(1, false);
    }, [filters, searchTerm]);

    const loadMore = () => {
        if (!hasMore || isLoading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadImages(nextPage, true);
    };

    const handleFilterChange = (key: keyof GalleryFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined
        }));
    };

    const clearFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length + (searchTerm ? 1 : 0);

    return (
        <div className="h-screen overflow-y-auto no-scrollbar bg-[hsl(var(--background))] text-white font-sans selection:bg-purple-500/30">
            <div className="aurora-veil" />
            <Navigation />

            <main className="container mx-auto px-6 pt-24 pb-12 relative z-10">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-bold mb-3">
                        <span className="text-gradient-sleek">Community</span> Gallery
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Explore beautiful coloring pages created by our community
                    </p>
                </header>

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" viewBox="0 0  24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search gallery..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${showFilters || activeFilterCount > 0
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                            }`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
                        </svg>
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-500 text-white rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Results Count */}
                    <div className="flex items-center text-sm text-zinc-500">
                        {total > 0 && `${total.toLocaleString()} images`}
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Style Filter */}
                            <div>
                                <label className="block text-xs text-zinc-500 mb-2">Style</label>
                                <select
                                    value={filters.style || ''}
                                    onChange={(e) => handleFilterChange('style', e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                >
                                    <option value="">All Styles</option>
                                    {VISUAL_STYLES.map(style => (
                                        <option key={style.id} value={style.id}>{style.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Audience Filter */}
                            <div>
                                <label className="block text-xs text-zinc-500 mb-2">Audience</label>
                                <select
                                    value={filters.audience || ''}
                                    onChange={(e) => handleFilterChange('audience', e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                >
                                    <option value="">All Audiences</option>
                                    {TARGET_AUDIENCES.map(aud => (
                                        <option key={aud.id} value={aud.id}>{aud.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Complexity Filter */}
                            <div>
                                <label className="block text-xs text-zinc-500 mb-2">Complexity</label>
                                <select
                                    value={filters.complexity || ''}
                                    onChange={(e) => handleFilterChange('complexity', e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                >
                                    <option value="">All Levels</option>
                                    {COMPLEXITY_LEVELS.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}

                {/* Gallery Grid */}
                {isLoading && page === 1 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                        <p className="text-zinc-400">Loading gallery...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-red-500/20 rounded-3xl bg-red-500/5">
                        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
                        <p className="text-zinc-500 max-w-md mb-8">{error}</p>
                        <button onClick={() => loadImages(1)} className="btn-primary">Try Again</button>
                    </div>
                ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center mb-6 shadow-inner border border-white/5">
                            <span className="text-4xl grayscale opacity-30">🖼️</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Public Images Yet</h2>
                        <p className="text-zinc-500 max-w-md">
                            Be the first to share your creations! Set your projects to "Public" to appear in the gallery.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {images.map((image) => (
                                <div
                                    key={image.id}
                                    onClick={() => setSelectedImage(image)}
                                    className="group relative aspect-square bg-[#131314] border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer"
                                >
                                    {image.imageUrl ? (
                                        <img
                                            src={image.imageUrl}
                                            alt={image.prompt || 'Coloring page'}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <span className="text-3xl opacity-30">🎨</span>
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <p className="text-xs text-white font-medium line-clamp-2 mb-1">
                                                {image.projectTitle}
                                            </p>
                                            {image.creatorName && (
                                                <p className="text-[10px] text-zinc-400">
                                                    by {image.creatorName}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Style Badge */}
                                    {image.style && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/10 backdrop-blur text-[9px] font-medium text-zinc-300">
                                                {VISUAL_STYLES.find(s => s.id === image.style)?.label || image.style}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Load More */}
                        {hasMore && (
                            <div className="flex justify-center mt-12">
                                <button
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="btn-secondary px-8 py-3"
                                >
                                    {isLoading ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] bg-[#1a1a1b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Image */}
                        <div className="aspect-square max-h-[60vh] bg-white flex items-center justify-center">
                            <img
                                src={selectedImage.imageUrl}
                                alt={selectedImage.prompt || 'Coloring page'}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                        {/* Info Panel */}
                        <div className="p-6 border-t border-white/10">
                            <h3 className="text-xl font-bold text-white mb-2">{selectedImage.projectTitle}</h3>

                            {selectedImage.prompt && (
                                <p className="text-sm text-zinc-400 mb-4 line-clamp-3">{selectedImage.prompt}</p>
                            )}

                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedImage.style && (
                                    <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30">
                                        {VISUAL_STYLES.find(s => s.id === selectedImage.style)?.label || selectedImage.style}
                                    </span>
                                )}
                                {selectedImage.audience && (
                                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                                        {TARGET_AUDIENCES.find(a => a.id === selectedImage.audience)?.label || selectedImage.audience}
                                    </span>
                                )}
                                {selectedImage.complexity && (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">
                                        {selectedImage.complexity}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    {selectedImage.creatorAvatar ? (
                                        <img src={selectedImage.creatorAvatar} alt="" className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-300">
                                            {selectedImage.creatorName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <span className="text-zinc-400">
                                        {selectedImage.creatorName || 'Anonymous'}
                                    </span>
                                </div>
                                <span className="text-zinc-500">
                                    {new Date(selectedImage.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;
