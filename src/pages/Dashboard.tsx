/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';

// Import custom 3D icons
import coloringStudioIcon from '../assets/coloring-studio.png';
import magicWandIcon from '../assets/magic-wand.png';
import heroLabIcon from '../assets/hero-lab.png';
import coverCreatorIcon from '../assets/cover-creator.png';
import monochromeMakerIcon from '../assets/monochrome-maker.png';
import storybookCreatorIcon from '../assets/storybook-creator.png';
import paintByNumbersIcon from '../assets/paint-by-numbers.png';
import vaultIcon from '../assets/vault.png';
import settingsIcon from '../assets/settings.png';

interface TileProps {
    title: string;
    description: string;
    icon: string;
    to: string;
    gradient: string;
    delay: number;
}

const Tile: React.FC<TileProps> = ({ title, description, icon, to, gradient, delay }) => (
    <Link
        to={to}
        className="tile-card group"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`tile-icon ${gradient} !p-0 overflow-hidden`}>
            <img src={icon} alt={title} className="w-full h-full object-cover mix-blend-screen" />
        </div>
        <h3 className="tile-title">{title}</h3>
        <p className="tile-description">{description}</p>
        <div className="tile-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
        </div>
    </Link>
);

import { useAuth } from '../context/AuthContext';

const tiles = [
    {
        title: 'Coloring Book Studio',
        description: 'Create stunning AI-generated coloring pages',
        icon: coloringStudioIcon,
        to: '/studio',
        gradient: 'gradient-purple',
    },
    {
        title: 'Community Gallery',
        description: 'Explore and remix community artwork',
        icon: magicWandIcon,
        to: '/gallery',
        gradient: 'gradient-blue',
    },
    {
        title: 'Hero Lab',
        description: 'Design unique character illustrations',
        icon: heroLabIcon,
        to: '/hero-lab',
        gradient: 'gradient-blue',
    },
    {
        title: 'Cover Creator',
        description: 'Generate professional book covers',
        icon: coverCreatorIcon,
        to: '/cover-creator',
        gradient: 'gradient-pink',
    },
    {
        title: 'Monochrome Maker',
        description: 'Convert images to black & white art',
        icon: monochromeMakerIcon,
        to: '/monochrome-maker',
        gradient: 'gradient-gray',
    },
    {
        title: 'Story Book Creator',
        description: 'Craft illustrated children\'s stories',
        icon: storybookCreatorIcon,
        to: '/storybook-creator',
        gradient: 'gradient-orange',
    },
    {
        title: 'Paint by Numbers',
        description: 'Transform photos into paint-by-number art',
        icon: paintByNumbersIcon,
        to: '/paint-by-numbers',
        gradient: 'gradient-cyan',
    },
    {
        title: 'Vault',
        description: 'Securely store and manage your creations',
        icon: vaultIcon,
        to: '/vault',
        gradient: 'gradient-green',
    },
    {
        title: 'Settings',
        description: 'Configure your account and preferences',
        icon: settingsIcon,
        to: '/settings',
        gradient: 'gradient-slate',
    },
];

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const Dashboard: React.FC = () => {
    const { isAdmin, userEmail } = useAuth();
    const navigate = useNavigate();
    const [isDevModalOpen, setIsDevModalOpen] = useState(false);
    const [devPassword, setDevPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [storedPassword, setStoredPassword] = useState('jamie-dev-123'); // Default fallback

    useEffect(() => {
        const fetchDevPassword = async () => {
            if (isAdmin && userEmail === 'jamie@myjoe.app') {
                const { data } = await supabase
                    .from('app_settings' as any)
                    .select('value')
                    .eq('key', 'dev_password')
                    .single();

                if (data?.value) {
                    setStoredPassword(data.value);
                }
            }
        };
        fetchDevPassword();
    }, [isAdmin, userEmail]);

    const handleDevAccess = (e: React.FormEvent) => {
        e.preventDefault();

        if (devPassword === storedPassword) {
            navigate('/admin');
        } else {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 1000);
        }
    };

    // Add Dev Tile if user is authorized (still kept hidden from regular users for cleanliness)
    const displayTiles = [...tiles];
    if (isAdmin && userEmail === 'jamie@myjoe.app') {
        displayTiles.push({
            title: 'Dev Portal',
            description: 'Restricted Access',
            icon: settingsIcon,
            to: '#', // Handled by onClick
            gradient: 'gradient-orange',
        });
    }

    const handleTileClick = (e: React.MouseEvent, tile: any) => {
        if (tile.title === 'Dev Portal') {
            e.preventDefault();
            setIsDevModalOpen(true);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="aurora-veil opacity-50 dark:opacity-100 transition-opacity duration-500" />

            <header className="dashboard-header">
                <h1 className="dashboard-title">
                    <span className="text-gradient-sleek">Myjoe</span> Creative Suite
                </h1>
                <p className="dashboard-subtitle">
                    Professional AI-Powered Design Tools
                </p>
            </header>

            {/* Grid Layout: LG 5 columns for 2 rows of 5 */}
            <main className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto px-6 py-12">
                {displayTiles.map((tile, index) => (
                    <div key={tile.title} onClick={(e) => handleTileClick(e, tile)}>
                        {tile.title === 'Dev Portal' ? (
                            <div
                                className="tile-card group cursor-pointer"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className={`tile-icon ${tile.gradient} !p-0 overflow-hidden`}>
                                    <img src={tile.icon} alt={tile.title} className="w-full h-full object-cover mix-blend-screen" />
                                </div>
                                <h3 className="tile-title">{tile.title}</h3>
                                <p className="tile-description">{tile.description}</p>
                                <div className="tile-arrow">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 15l-3-3m0 0l3-3m-3 3h8M5 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                                    </svg>
                                </div>
                            </div>
                        ) : (
                            <Tile
                                {...tile}
                                delay={index * 50}
                            />
                        )}
                    </div>
                ))}
            </main>

            {/* Dev Password Modal */}
            {isDevModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#131314] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Dev Access Required</h2>
                            <button onClick={() => setIsDevModalOpen(false)} className="text-zinc-500 hover:text-white">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleDevAccess} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2">Password</label>
                                <input
                                    type="password"
                                    autoFocus
                                    value={devPassword}
                                    onChange={(e) => setDevPassword(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${passwordError ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-purple-500/50'} text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-all`}
                                    placeholder="Enter dev password..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDevModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20"
                                >
                                    Access Portal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
