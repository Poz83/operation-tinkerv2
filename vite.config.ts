import { execSync } from 'child_process';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const dropConsole = env.VITE_DROP_CONSOLE === 'true';

  return {
    esbuild: {
      drop: dropConsole ? ['debugger'] : [],
      pure: dropConsole ? ['console.log', 'console.info', 'console.debug', 'console.trace'] : [],
    },
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      '__COMMIT_HASH__': JSON.stringify(commitHash),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React & Router
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],

            // Supabase (large dependency)
            'vendor-supabase': ['@supabase/supabase-js'],

            // AI Client
            'vendor-gemini': ['@google/genai'],

            // UI & Visualization
            'vendor-ui': ['framer-motion', 'lucide-react', 'recharts', 'canvas-confetti'],

            // PDF & Export (Heavy)
            'vendor-export': ['jspdf', 'jszip', 'modern-screenshot'],

            // Cloud Storage
            // 'vendor-aws': ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
