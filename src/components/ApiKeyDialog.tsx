import React, { useState } from 'react';
import { useApiKeyContext } from '../context/apiKeyContext';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  const { setApiKey, validateKeyFormat } = useApiKeyContext();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!inputKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!validateKeyFormat(inputKey)) {
      setError('Invalid API key format. Gemini keys start with "AIza".');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await setApiKey(inputKey);

    if (result.success) {
      onContinue();
    } else {
      setError(result.error || 'Failed to save API key');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-8 transform scale-100 transition-all">

        <div className="flex flex-col items-center text-center mb-6">
          <div className="text-5xl mb-4">🔑</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            Get Started
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Enter your Gemini API key to start creating.
            It will be securely saved for your next visit.
          </p>

          <div className="w-full space-y-3">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError(null);
              }}
              placeholder="AIza..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono text-sm"
              autoComplete="off"
            />

            {error && (
              <p className="text-red-400 text-xs text-left px-1">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !inputKey}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-purple-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Start Creating'}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <p className="text-xs text-zinc-500 text-center">
            Don't have a key?{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Get one for free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};