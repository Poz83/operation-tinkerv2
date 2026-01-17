/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import joeMascot from '../assets/joe-mascot.png';
// import logoFull from '../assets/logo_full.png'; // No longer used
import { BrandLogo } from './BrandLogo';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { userEmail, isAdmin, logout, avatarUrl, isAuthenticated } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)] transition-colors duration-300">
      <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center justify-between">
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-2">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="block hover:scale-105 transition-transform duration-300">
            <BrandLogo className="h-14 w-44" />
          </Link>
        </div>

        {/* Center: Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {location.pathname.startsWith('/studio/project/') ? (
            // Studio Editor Navigation
            <>
              <Link to="/studio" className="nav-link text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Projects</Link>
              <Link to="/dashboard" className="nav-link text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Dashboard</Link>
              <Link to="/gallery" className={`nav-link ${isActive('/gallery') ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>Gallery</Link>
              <Link to="/vault" className={`nav-link ${isActive('/vault') ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>Vault</Link>
            </>
          ) : (
            // Default Navigation
            <>
              <Link to="/studio" className={`nav-link ${isActive('/studio') ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>Studio</Link>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>Dashboard</Link>
              <Link to="/gallery" className="nav-link text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Gallery</Link>
              {/* Hide Resources and Help for the dev account */}
              {userEmail !== 'jamie@myjoe.app' && (
                <>
                  {/* <a href="#" className="nav-link">Resources</a> */}
                  <a href="#" className="nav-link text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Help</a>
                </>
              )}
            </>
          )}
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className={`icon-button ${isActive('/settings') ? 'bg-[hsl(var(--card))]/10 border-[hsl(var(--border))]' : ''} text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border border-transparent hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--card))]/50`}
            aria-label="Settings"
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            className="icon-button text-[hsl(var(--muted-foreground))] hover:text-red-400 border border-transparent hover:border-red-500/20 hover:bg-red-500/10 transition-colors"
            aria-label="Sign Out"
            title="Sign Out"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>

          <Link
            to="/settings"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted))] cursor-pointer shadow-lg border border-[hsl(var(--border))] overflow-hidden hover:ring-2 hover:ring-[hsl(var(--ring))] transition-all"
            aria-label="User profile"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">
                {userEmail?.[0] || '?'}
              </div>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};
