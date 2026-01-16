/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import joeMascot from '../assets/joe-mascot.png';
import logoFull from '../assets/logo_full.png';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { userEmail, isAdmin } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)] transition-colors duration-300">
      <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center justify-between">
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-2">
          <img src={logoFull} alt="Myjoe Creative Suite" className="h-12 object-contain drop-shadow-md hover:scale-105 transition-transform duration-300" />
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
            <span role="img" aria-label="settings">⚙️</span>
          </Link>
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted))] cursor-pointer shadow-lg border border-[hsl(var(--border))]"
            role="button"
            aria-label="User profile"
            title="User profile"
          />
        </div>
      </div>
    </nav>
  );
};
