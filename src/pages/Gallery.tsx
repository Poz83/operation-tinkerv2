import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Gallery: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen pt-20 px-8 flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl font-bold text-white mb-6">Gallery</h1>
            <p className="text-zinc-400 text-xl max-w-2xl mb-8">
                Your personal collection of masterpieces will live here.
                <br />
                Save your favorite generations to build your portfolio.
            </p>
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 mb-8 w-full max-w-md">
                <div className="flex justify-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-lg bg-purple-500/20 animate-pulse"></div>
                    <div className="w-16 h-16 rounded-lg bg-blue-500/20 animate-pulse delay-75"></div>
                    <div className="w-16 h-16 rounded-lg bg-pink-500/20 animate-pulse delay-150"></div>
                </div>
                <p className="text-sm text-zinc-500">Coming Soon</p>
            </div>
            <button
                onClick={() => navigate('/studio')}
                className="btn-primary"
            >
                Start Creating
            </button>
        </div>
    );
};

export default Gallery;
