/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const STYLE_TIPS: Record<string, { title: string; tip: string }> = {
    'Bold & Easy': {
        title: 'Beginner Friendly',
        tip: 'Use markers or crayons! The thick lines are forgiving and perfect for solid color fills.'
    },
    'Kawaii': {
        title: 'Color Palette Tip',
        tip: 'Try pastel colors (pinks, baby blues, mint greens) to enhance the cute aesthetic.'
    },
    'Whimsical': {
        title: 'Soft Touch',
        tip: 'Watercolor pencils work great here. Blend colors gently to match the storybook feel.'
    },
    'Cartoon': {
        title: 'High Energy',
        tip: 'Use bright, saturated contrasting colors to make the characters pop off the page.'
    },
    'Botanical': {
        title: 'Tonal Depth',
        tip: 'Try a tonal palette (e.g., light blue to dark blue) on a single flower petal to add realistic depth.'
    },
    'Mandala': {
        title: 'Inside Out',
        tip: 'Start coloring from the center and move outward to maintain symmetry and focus.'
    },
    'Zentangle': {
        title: 'No Mistakes',
        tip: 'There is no "up" or "down". Rotate the page as you color. If you go outside the lines, turn it into a new pattern!'
    },
    'Fantasy': {
        title: 'Magical Glow',
        tip: 'Leave some areas white to represent glowing magic or shiny armor reflections.'
    },
    'Gothic': {
        title: 'Stained Glass',
        tip: 'Use jewel tones (deep reds, purples, emeralds) to mimic the look of illuminated glass.'
    },
    'Cozy': {
        title: 'Warmth',
        tip: 'Stick to warm earth tones (browns, oranges, creams) to maximize the hygge vibe.'
    },
    'Geometric': {
        title: 'Color Blocking',
        tip: 'Try a checkerboard pattern: color alternating shapes with the same color for a striking 3D effect.'
    },
    'Wildlife': {
        title: 'Fur Texture',
        tip: 'Follow the direction of the lines with your strokes to enhance the realistic fur texture.'
    },
    'Floral': {
        title: 'Organic Flow',
        tip: 'Don\'t worry about symmetry. Nature is random! Use varied shades of green for leaves.'
    },
    'Abstract': {
        title: 'Go with the Flow',
        tip: 'Listen to music while coloring this. Let the rhythm guide your color choices.'
    },
    'Realistic': {
        title: 'Light Source',
        tip: 'Decide where the light is coming from (e.g., top right) and keep your shadows consistent.'
    }
};

interface DesignersTipProps {
    styleId: string;
}

export const DesignersTip: React.FC<DesignersTipProps> = ({ styleId }) => {
    // Fallback to a generic tip if style not found
    const advice = STYLE_TIPS[styleId] || {
        title: 'Pro Tip',
        tip: 'Sharp pencils allow for finer details, while markers are great for bold, vibrant coverage.'
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={styleId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-sm relative overflow-hidden group"
            >
                {/* Shine effect */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl -translate-y-10 translate-x-10 group-hover:bg-white/10 transition-colors" />

                <div className="flex items-start gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-300">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.312-3-4-3a2.48 2.48 0 0 0-2.5 2.5c0 1.12.5 2 1 3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                            <path d="M15.5 14.5A2.5 2.5 0 0 1 13 12c0-1.38.5-2 1-3 1.072-2.143 2.312-3 4-3a2.48 2.48 0 0 1 2.5 2.5c0 1.12-.5 2-1 3a2.5 2.5 0 0 1-2.5 2.5z"></path>
                            <path d="M2 21h20"></path>
                            <path d="M12 2v4"></path>
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wide mb-1">
                            Designer's Tip: {advice.title}
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            "{advice.tip}"
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
