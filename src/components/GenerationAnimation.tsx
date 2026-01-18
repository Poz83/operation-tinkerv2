import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const GenerationAnimation: React.FC = () => {
    const [step, setStep] = useState(0);

    // Cycling messages
    const messages = [
        "Dreaming up concepts...",
        "Sketching outlines...",
        "Inking details...",
        "Refining lines...",
        "Adding magic..."
    ];

    // Cycle text
    useEffect(() => {
        const interval = setInterval(() => {
            setStep((s) => (s + 1) % messages.length);
        }, 1800);
        return () => clearInterval(interval);
    }, []);

    // Shape Paths
    const shapes = [
        "M 50 20 L 60 40 L 85 40 L 65 55 L 75 80 L 50 65 L 25 80 L 35 55 L 15 40 L 40 40 Z", // Star
        "M 50 30 C 20 0 0 50 50 90 C 100 50 80 0 50 30", // Heart
        "M 30 70 Q 10 70 10 50 Q 10 20 40 20 Q 50 5 70 20 Q 95 20 95 50 Q 95 70 70 70 Z", // Cloud
    ];

    const currentShape = shapes[step % shapes.length];

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
                {/* 1. Paper Sheet Background (Subtle Pulse) */}
                <motion.div
                    className="absolute inset-2 bg-white shadow-xl rounded-lg border border-gray-100"
                    animate={{ rotate: [2, -2, 2], scale: [0.98, 1.02, 0.98] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* 2. Drawing Canvas */}
                <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" viewBox="0 0 100 100">
                    <AnimatePresence mode="wait">
                        <motion.path
                            key={step} // Re-mounts on step change to restart animation
                            d={currentShape}
                            fill="transparent"
                            stroke="#8b5cf6" // Violet-500
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }} // Fade out old shape
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                    </AnimatePresence>
                </svg>

                {/* 3. Floating Pencil (Follows action vaguely) */}
                <motion.div
                    className="absolute text-3xl z-10"
                    animate={{
                        x: [10, 40, -10, 20],
                        y: [-10, 20, 10, -20],
                        rotate: [0, 15, -10, 5],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{ right: -10, bottom: -10 }} // Anchor pencil
                >
                    <span className="filter drop-shadow-md">✏️</span>
                </motion.div>

                {/* 4. Magic Particles (Burst on shape change) */}
                <AnimatePresence>
                    <motion.div
                        key={step}
                        className="absolute text-xl top-0 right-0"
                        initial={{ opacity: 0, scale: 0, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: -20 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        ✨
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* 5. Cycling Text */}
            <div className="h-6 relative w-full flex justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={step}
                        className="absolute text-sm font-semibold tracking-wide bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent uppercase"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {messages[step]}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
};
