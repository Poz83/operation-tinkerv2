/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-8 transform scale-100 transition-all">
        
        <div className="flex flex-col items-center text-center mb-6">
           <div className="text-5xl mb-4">🔑</div>
           <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
             Let's Get You Set Up!
           </h2>
           <p className="text-gray-400 text-sm leading-relaxed">
             To create your coloring books, we need your Gemini API key.
             Don't have one? No worries—we'll show you how!
           </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-purple-500/30 active:scale-[0.98] mb-3"
        >
          🔗 Connect Your Key
        </button>

        <a
          href="https://ai.google.dev/gemini-api/docs/billing"
          target="_blank"
          rel="noreferrer"
          className="block text-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          📖 Learn More
        </a>
      </div>
    </div>
  );
};