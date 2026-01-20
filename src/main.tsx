import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// "Secure Console Logs" - Branding Banner
// Using indirect console logging to bypass esbuild stripping (VITE_DROP_CONSOLE)
const log = console.log;
const banner = `
%c  _ __  _   _    (_)  ___   ___  
 | '_ \\| | | |   | | / _ \\ / _ \\ 
 | | | | |_| |   | || (_) |  __/ 
 |_| |_|\\__, |  _/ | \\___/ \\___| 
        |___/  |__/              
`;
const style = 'color: #6366f1; font-weight: bold; background: #e0e7ff; padding: 4px; border-radius: 4px;';
log(banner, style);

ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
                <App />
        </React.StrictMode>,
)
