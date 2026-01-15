/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import coloringStudioIcon from '../assets/coloring-studio.png';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { userEmail, isAdmin } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[rgba(10,10,11,0.8)] backdrop-blur-xl border-b border-white/5">
      <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center justify-between">
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-2">
          <img src={coloringStudioIcon} alt="Studio Logo" className="w-8 h-8 object-contain drop-shadow" />
          <span className="text-xl font-bold text-gradient-sleek">
            Myjoe Studio
          </span>
        </div>

        {/* Center: Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {location.pathname.startsWith('/studio/project/') ? (
            // Studio Editor Navigation
            <>
              <Link to="/studio" className="nav-link">Projects</Link>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/gallery" className={`nav-link ${isActive('/gallery') ? 'active' : ''}`}>Gallery</Link>
              <Link to="/vault" className={`nav-link ${isActive('/vault') ? 'active' : ''}`}>Vault</Link>
            </>
          ) : (
            // Default Navigation
            <>
              <Link to="/studio" className={`nav-link ${isActive('/studio') ? 'active' : ''}`}>Studio</Link>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/gallery" className="nav-link">Gallery</Link>
              {/* Hide Resources and Help for the dev account */}
              {userEmail !== 'jamie@myjoe.app' && (
                <>
                  {/* <a href="#" className="nav-link">Resources</a> */}
                  <a href="#" className="nav-link">Help</a>
                </>
              )}
            </>
          )}
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className={`icon-button ${isActive('/settings') ? 'bg-white/10 border-white/20' : ''}`}
            aria-label="Settings"
            title="Settings"
          >
            <span role="img" aria-label="settings">⚙️</span>
          </Link>
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-zinc-400 cursor-pointer shadow-lg"
            role="button"
            aria-label="User profile"
            title="User profile"
          />
        </div>
      </div>
    </nav>
  );
};
