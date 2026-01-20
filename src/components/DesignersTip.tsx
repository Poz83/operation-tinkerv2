/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const STYLE_TIPS: Record<string, { title: string; tip: string }> = {
    'Cozy Hand-Drawn': {
        title: 'Prompting Tip',
        tip: 'Mention specific small details (like "steam rising" or "scattered crumbs") to enhance the hand-drawn charm.'
    },
    'Hand Drawn Bold & Easy': {
        title: 'Less is More',
        tip: 'Keep your prompt simple! Single subjects without complex backgrounds work best with these thick lines.'
    },
    'Kawaii': {
        title: 'Everything is Alive',
        tip: 'In Kawaii, everything has a soul! Put faces on inanimate objects like clouds, food, or furniture for maximum cuteness.'
    },

    'Cartoon': {
        title: 'Make it Zany!',
        tip: 'Think "Rubber Hose" animation! Use words like "wobble", "stretch", or "splat" to get that funny, flexible look.'
    },
    'Botanical': {
        title: 'Be Specific',
        tip: 'Use Latin names (e.g., "Monstera deliciosa") and terms like "cross-section" or "rhizome" for true scientific accuracy.'
    },
    'Mandala': {
        title: 'Thematic Geometry',
        tip: 'Don\'t just say "Mandala". Try "Celestial Mandala" or "Owl Mandala" to guide the geometry.'
    },
    'Zentangle': {
        title: 'Zentangle Method (ZIA)',
        tip: 'Think of your subject as a "Container". The AI will divide it into "Strings" and fill each with a unique pattern (tangle).'
    },
    'Fantasy': {
        title: 'The Grimoire',
        tip: 'Use terms like "Heroic Proportions", "Knolling" (for inventory), or "Low Angle" to get that epic RPG look.'
    },
    'Gothic': {
        title: 'Architecture of Shadows',
        tip: 'Use specific vocabulary like "Rib Vault", "Filigree", "Lace", or "Withered Roses" to guide the texture.'
    },
    'StainedGlass': {
        title: 'Light & Lead',
        tip: 'Focus on "Light" and "Color" slots. Mentions of "Sunlight" or "Cathedral High Windows" help the AI structure the mosaic.'
    },
    'Cozy': {
        title: 'The Sanctuary',
        tip: 'Use texture words: "chunky cable-knit", "overstuffed armchair", "steaming cocoa". Avoid "modern" or "minimalist".'
    },
    'Whimsical': {
        title: 'Scale Distortion',
        tip: 'Play with size! Try "A mouse in a teacup" or "A giant mushroom house" to trigger that magical storybook look.'
    },
    'Geometric': {
        title: 'Low Poly',
        tip: 'Try combining organic subjects with this style. "Geometric Bear" or "Faceted Mountain" creates cool contrasts.'
    },
    'Realistic': {
        title: "The Engraver's Art",
        tip: "This style mimics 19th-century scientific illustrations. It replaces 'shading' with 'cross-hatching'. Describe texture and material (e.g., 'velvet', 'bark') clearly."
    },
    'Wildlife': {
        title: 'Habitat Context',
        tip: 'Always specify the background habitat (e.g., "in a dense jungle") to give your animal context.'
    },
    'Floral': {
        title: 'Pattern Design',
        tip: 'This creates repeating patterns. Great for making your own wrapping paper or fabric designs!'
    },
    'Abstract': {
        title: 'Flow & Motion',
        tip: 'Focus on movement words. "Swirling", "Exploding", or "Meandering" give the best abstract compositions.'
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
