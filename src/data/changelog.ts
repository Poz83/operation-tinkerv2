/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChangelogEntry {
    id: string;
    date: string; // ISO format: YYYY-MM-DD
    title: string;
    version?: string;
    description: string;
    changes: string[];
    type: 'major' | 'minor' | 'patch';
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        id: 'update-2026-01-18-cinematics',
        date: '2026-01-18',
        title: 'Cinematic Intelligence',
        version: 'v2.2.1',
        type: 'minor',
        description: 'Added a dynamic camera system to vary composition angles automatically.',
        changes: [
            'Implemented "Dynamic Camera" logic: Randomly selects from 8 cinematic angles (e.g., Low Angle, Dutch Angle, Worm\'s Eye) when "Dynamic" is chosen.',
            'Added smart override: Obey\'s explicit camera selections while randomizing "Dynamic" defaults.'
        ]
    },
    {
        id: 'update-2026-01-18-ai-qa',
        date: '2026-01-18',
        title: 'Agentic QA & Smart Repairs',
        version: 'v2.2.0',
        type: 'minor',
        description: 'Introduced a self-correcting AI Quality Assurance system that grades and fixes images automatically.',
        changes: [
            'Implemented Gemini 1.5 Pro Vision to semantically analyze every image (detects unwanted text, anatomy issues, and scary content).',
            'Added "Smart Repairs": The system now translates QA failures into specific engineering directives (e.g., "CRITICAL: REMOVE TEXT") for retries.',
            'Optimized with Hybrid Validation: Uses fast pixel heuristics first, then deep AI analysis only when needed.',
            'Refined Retry Logic: "Smart Retry" skips redundant checks on repaired images to save latency and cost.'
        ]
    },
    {
        id: 'update-2026-01-18-performance',
        date: '2026-01-18',
        title: 'Performance & Infrastructure',
        version: 'v2.1.4',
        type: 'patch',
        description: 'Major infrastructure optimization for faster project loading.',
        changes: [
            'Implemented batched signed URL generation to reduce network overhead.',
            'Optimized project loading speed for large coloring books.',
            'Refactored backend storage service for better scalability.'
        ]
    },
    {
        id: 'update-2026-01-17-consistency',
        date: '2026-01-17',
        title: 'Auto-Consistency Lite',
        version: 'v2.1.3',
        type: 'minor',
        description: 'Added a lightweight consistency mode for sessions.',
        changes: [
            'Added "Auto-Consistency" toggle to Setup panel.',
            'Automatically analyzes layout and style of the first page to guide subsequent pages.',
            'Great for maintaining vibe without setting up a full Hero.'
        ]
    },
    {
        id: '2.1.2',
        date: '2026-01-17',
        title: 'Magic Editor & UX Polish',
        version: 'v2.1.2',
        description: 'Major usability upgrades for the Magic Editor across Studio and Hero Lab.',
        changes: [
            'New "Auto-Consistency" mode: Uses the first generated page as a reference for the rest of the batch.',
            'Magic Editor: Unified visual design between Studio and Hero Lab.',
            'Magic Editor: Added Next/Previous navigation buttons for rapid editing.',
            'Fixed legacy image URL bugs in Magic Editor.'
        ],
        type: 'patch'
    },
    {
        id: 'update-2026-01-17-hero-consistency',
        date: '2026-01-17',
        title: 'Hero Card Consistency & UI Polish',
        version: 'v2.1.1',
        description: 'Fixed critical consistency issues in hero generation and cleaned up the reference card UI.',
        changes: [
            'Refined Hero Card UI: Removed header and footer for a cleaner look',
            'Enforced strict Black & White output for all hero generations',
            'Implemented Material Consistency rules (solid helmets, transparent visors)',
            'Fixed TypeScript syntax errors in prompt generation logic'
        ],
        type: 'patch'
    },
    {
        id: 'update-2026-01-17',
        date: '2026-01-17',
        title: 'Development Update',
        version: 'v2.1.x',
        description: 'Latest changes and improvements based on recent development.',
        changes: [
            'Add Release Notes System & Automated Changelog',
            'Enable scrolling on Updates page',
            'Restrict automated changelog to significant commits only'
        ],
        type: 'minor'
    },
    {
        id: 'release-v1.0.0',
        date: '2026-01-17',
        title: 'Official Release v1.0.0',
        version: 'v1.0.0',
        description: 'First official release of the myjoe Creative Suite. Includes Hero Lab, Book Studio, and Gemini 3 Pro integration.',
        changes: [
            'Optimize Prompts for Gemini 3 Pro & Improve AI Editors',
            'Refine Hero Lab flow and DNA extraction logic',
            'Fix hero reference card transfer to studio using hybrid vault approach',
            'Increase logo size on dashboard and landing page',
            'Update logo to high-res 2048px version',
            'Restore missing joe-mascot.png with updated design',
            'Update logo asset',
            'Fix hero image transfer from Hero Lab to Studio',
            'Update myjoe brand logo with dark background compatible version',
            'Fix dashboard scrolling: enforce height 100vh to enable internal scrollbar',
            'Fix dashboard layout: increase header top padding to clear navbar',
            'Site-wide visual polish: fix Dashboard layout overlap, improve text readability, fix Gallery scrolling, and update Monochrome icon',
            'Update Dashboard icons, refine Designer Tips, and rename Paint by Numbers',
            'Finalize scroll layout improvements for Studio Launchpad',
            'Fix Vault page scrolling clipping',
            'Improve Studio Launchpad layout for better visibility of recent projects',
            'Apply global anti-repetition rules to prompt generation',
            'Fix(prompts): reduce repetitive iconography in Cozy style and diversify brainstorming details',
            'Refactor: split DirectPromptService into ColoringStudioService and HeroLabService',
            'Implement Cozy Hand-Drawn style with felt-tip pen aesthetic and strict closure rules',
            'Fix(herolab): Switch profile sheet generation to landscape layout for better 5-angle arrangement',
            'Feat(vault): Implement Reference Gallery and update hero image persistence',
            'Fix(vault): Handle missing or array-wrapped hero_lab_data to prevent page crash',
            'Feat(hero-lab): Implement Profile Sheet generation and DNA consistency',
            'Resolve Hero Lab seed error and update migration logic',
            'Implement Hero Lab with Character DNA, Seed Control, and Studio Integration',
            'Fix: Add Navigation component to Dashboard to enable Sign Out',
            'Add migration 006: Enable admin delete policy for feedback',
            'Replace html2canvas with modern-screenshot to fix oklab error',
            'Add delete functionality to feedback inbox in Admin Portal',
            'Fix feedback screenshot capture by disabling allowTaint',
            'Refactor Magic Edit UI: Side-by-side layout, full image visibility, and Tailwind styling',
            'Empty commit',
            'Fix TypeScript errors in Dev Portal password logic',
            'Restructure dashboard: 2x5 grid, unified Dev Portal with password protection backed by Supabase',
            'Add Community Gallery tile to Main Dashboard',
            'Implement Community Gallery feature: RLS policies, Gallery UI, and Project Privacy settings',
            'Remove dangling batchLog import from useGeneration',
            'Refine light mode, update icons, and remove dev tools',
            'Chore: exclude .wrangler from version control',
            'Feat: Forensic Style Analysis & KDP Export'
        ],
        type: 'minor'
    },
    {
        id: 'update-gemini-3-pro',
        date: '2026-01-16',
        title: 'Gemini 3 Pro Integration',
        version: 'v2.1.0',
        description: 'Major upgrade to the AI core, introducing "Thinking Process" capabilities and smarter editing tools.',
        changes: [
            'Simulated "Thinking Process" for image generation: The AI now plans composition and narrative before drawing.',
            'Subject-Aware Editing: The AI editor now understands exactly what character or scene it is modifying.',
            'Masking Support: Use the Brush Tool to surgically edit specific parts of an image.',
            'Semantic Negative Prompts: Switched to affirmative constraints for higher quality and better compliance.',
            'Improved Book Planning: Story plans now have better narrative arcs and coherence.'
        ],
        type: 'major'
    }
];
