import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const GenerationAnimation: React.FC = () => {
    const [textIndex, setTextIndex] = useState(0);
    const messages = [
        "Dreaming up concepts...",
        "Sketching outlines...",
        "Inking final details...",
        "Adding magic dust...",
        "Almost ready..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="relative w-48 h-48 mb-8">
                {/* 1. Paper Sheet Background */}
                <motion.div
                    className="absolute inset-4 bg-white shadow-xl rotate-3 rounded-sm border border-gray-200"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* 2. Drawing Path */}
                <svg className="absolute inset-4 overflow-visible" viewBox="0 0 100 100">
                    <motion.path
                        d="M 20 50 Q 50 10 80 50 T 140 50" // Simple wave
                        fill="transparent"
                        stroke="#8b5cf6" // Violet-500
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: [0, 1, 0],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.path
                        d="M 20 80 Q 50 40 80 80" // Arc
                        fill="transparent"
                        stroke="#ec4899" // Pink-500
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: [0, 1],
                            opacity: [0, 1]
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                        }}
                    />
                </svg>

                {/* 3. Floating Pencil */}
                <motion.div
                    className="absolute z-10 text-4xl"
                    initial={{ x: 0, y: 40, rotate: 0 }}
                    animate={{
                        x: [20, 80, 20],
                        y: [40, 30, 40],
                        rotate: [0, 15, 0]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <span className="filter drop-shadow-lg">✏️</span>
                </motion.div>

                {/* 4. Magic Sparkles */}
                <motion.div
                    className="absolute top-0 right-0 text-2xl"
                    animate={{
                        scale: [0, 1.2, 0],
                        rotate: [0, 180],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        times: [0, 0.5, 1],
                        delay: 1
                    }}
                >
                    ✨
                </motion.div>
                <motion.div
                    className="absolute bottom-4 left-4 text-xl"
                    animate={{
                        scale: [0, 1, 0],
                        y: [0, -20],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: 0.2
                    }}
                >
                    🎨
                </motion.div>
                <motion.div
                    className="absolute top-10 left-0 text-xl"
                    animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: 1.5
                    }}
                >
                    💡
                </motion.div>
            </div>

            {/* 5. Cycling Text */}
            <div className="h-8 relative w-full flex justify-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={textIndex}
                        className="absolute text-lg font-medium bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {messages[textIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
};
