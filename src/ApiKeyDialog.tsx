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
           <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
           </div>
           <h2 className="text-2xl font-semibold text-white mb-2">API Key Required</h2>
           <p className="text-gray-400 text-sm leading-relaxed">
             This application uses the advanced Gemini 3 Pro model which requires a billing-enabled Google Cloud project.
           </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
             <p className="text-xs text-gray-300 leading-relaxed text-center">
                Please ensure you have set up your API key with the correct permissions. 
                <br/>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors mt-2 inline-block font-medium">View Billing Documentation &rarr;</a>
             </p>
        </div>

        <button 
          onClick={onContinue}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20 active:scale-[0.98]"
        >
          Connect API Key
        </button>
      </div>
    </div>
  );
};