/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';

// Import custom 3D icons
import coloringStudioIcon from '../assets/coloring-studio.png';
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

const tiles = [
    {
        title: 'Coloring Book Studio',
        description: 'Create stunning AI-generated coloring pages',
        icon: coloringStudioIcon,
        to: '/studio',
        gradient: 'gradient-purple',
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

export const Dashboard: React.FC = () => {
    return (
        <div className="dashboard-container">
            <div className="aurora-veil" />

            <header className="dashboard-header">
                <h1 className="dashboard-title">
                    <span className="text-gradient-sleek">Myjoe</span> Creative Suite
                </h1>
                <p className="dashboard-subtitle">
                    Professional AI-Powered Design Tools
                </p>
            </header>

            <main className="dashboard-grid">
                {tiles.map((tile, index) => (
                    <Tile
                        key={tile.title}
                        {...tile}
                        delay={index * 50}
                    />
                ))}
            </main>

            <footer className="dashboard-footer">
                <p>Powered by Gemini AI</p>
            </footer>
        </div>
    );
};

export default Dashboard;
