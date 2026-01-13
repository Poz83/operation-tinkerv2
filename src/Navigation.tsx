/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

export const Navigation: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#1E1E1F]/80 backdrop-blur-xl border-b border-white/10">
      <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center justify-between">
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="palette">🎨</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CB Studio
          </span>
        </div>

        {/* Center: Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/CBstudio" className="nav-link active">Studio</a>
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="#" className="nav-link">Gallery</a>
          <a href="#" className="nav-link">Resources</a>
          <a href="#" className="nav-link">Help</a>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-3">
          <button
            className="icon-button"
            aria-label="Notifications"
            title="Notifications"
          >
            <span role="img" aria-label="bell">🔔</span>
          </button>
          <button
            className="icon-button"
            aria-label="Settings"
            title="Settings"
          >
            <span role="img" aria-label="settings">⚙️</span>
          </button>
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 cursor-pointer"
            role="button"
            aria-label="User profile"
            title="User profile"
          />
        </div>
      </div>
    </nav>
  );
};
