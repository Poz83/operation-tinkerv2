import React from 'react';
import { useNavigate } from 'react-router-dom';
import notFoundImage from '../assets/not-found.png';

export const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
            <div className="aurora-veil" />

            {/* Animated Image Container */}
            <div className="relative w-full max-w-md aspect-square mb-8 z-10 animate-float">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full animate-pulse-slow" />
                <img
                    src={notFoundImage}
                    alt="Lost Robot Artist"
                    className="w-full h-full object-contain drop-shadow-2xl"
                />
            </div>

            <div className="relative z-10 max-w-2xl">
                <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-6 drop-shadow-lg">
                    404
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                    Oops! We ran out of canvas.
                </h2>
                <p className="text-zinc-400 text-lg mb-10">
                    It seems you've ventured into the void. This page hasn't been painted yet (or maybe it disappeared into a black hole).
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-primary px-8 py-3 text-lg shadow-lg shadow-purple-500/20"
                    >
                        🏠 Go Home
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-8 py-3 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
