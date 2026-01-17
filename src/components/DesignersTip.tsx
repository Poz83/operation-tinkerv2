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
    'Bold & Easy': {
        title: 'Less is More',
        tip: 'Keep your prompt simple! Single subjects without complex backgrounds work best with these thick lines.'
    },
    'Kawaii': {
        title: 'Cuteness Overload',
        tip: 'Add words like "chibi", "happy", "round", or "sparkles" to your prompt to maximize the cute factor.'
    },
    'Whimsical': {
        title: 'Storytelling',
        tip: 'Describe a mood or a story moment (e.g., "frog reading a book") rather than just listing objects.'
    },
    'Cartoon': {
        title: 'Action Poses',
        tip: 'Use active verbs like "running", "jumping", or "flying" to get dynamic character poses.'
    },
    'Botanical': {
        title: 'Scientific Detail',
        tip: 'Using specific plant names (e.g., "Monstera Deliciosa" instead of "plant") yields much better results.'
    },
    'Mandala': {
        title: 'Thematic Focus',
        tip: 'Symmetry is automatic. Focus your prompt on the *theme* (e.g., "Fire", "Ocean") to influence the shapes.'
    },
    'Zentangle': {
        title: 'Abstract Concepts',
        tip: 'Abstract prompts work great here. Try describing a feeling or sound, like "Jazz Music" or "Calm Waves".'
    },
    'Fantasy': {
        title: 'Texture cues',
        tip: 'Mention materials like "plate armor", "dragon scales", or "rough stone" to get detailed line textures.'
    },
    'Gothic': {
        title: 'Stained Glass',
        tip: 'This style thrives on structure. Try prompting for "rose window" or "cathedral arch" frames.'
    },
    'Cozy': {
        title: 'Hygge Creator',
        tip: 'Focus on texture words in your prompt: "knitted", "wooden", "soft", or "wooly" help define the scene.'
    },
    'Geometric': {
        title: 'Low Poly',
        tip: 'Try combining organic subjects with this style. "Geometric Bear" or "Faceted Mountain" creates cool contrasts.'
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
    },
    'Realistic': {
        title: 'Detail Level',
        tip: 'Great for portraits. Mentioning "fine details" or "intricate background" pushes the AI to add more lines.'
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
