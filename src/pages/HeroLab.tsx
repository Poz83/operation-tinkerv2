import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { CharacterSetup } from '../components/CharacterSetup';
import { CharacterView } from '../components/CharacterView';
import { CharacterDNA, HeroProject } from '../types';
import { useGeneration } from '../hooks/useGeneration';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';

const constructPrompt = (dna: CharacterDNA): string => {
    return `
CHARACTER DNA:
- Name: ${dna.name}
- Role: ${dna.role}
- Age: ${dna.age}
- Face: ${dna.face}
- Eyes: ${dna.eyes}
- Hair: ${dna.hair}
- Skin: ${dna.skin}
- Body: ${dna.body}
- Signature Features: ${dna.signatureFeatures}
- Outfit Canon: ${dna.outfitCanon}
- Style Lock: ${dna.styleLock}

SCENE:
Character standing in a neutral heroic pose, full body, plain background, clear lighting.

TECHNICAL STYLE:
Coloring book line art, clean monoline black outlines, bold thick lines, no shading, no gradients, no gray. White background, high contrast.
`.trim();
};

const INITIAL_DNA: CharacterDNA = {
    name: '',
    role: '',
    age: '',
    face: '',
    eyes: '',
    hair: '',
    skin: '',
    body: '',
    signatureFeatures: '',
    outfitCanon: '',
    styleLock: 'Bold & Easy'
};

export const HeroLab: React.FC = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [projectName, setProjectName] = useState('');
    const [dna, setDna] = useState<CharacterDNA>(INITIAL_DNA);
    const [heroImage, setHeroImage] = useState<string | undefined>(undefined);
    const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
    const [isLoading, setIsLoading] = useState(false);

    // Load Project
    React.useEffect(() => {
        if (!projectId) return;

        async function load() {
            try {
                const { fetchProject } = await import('../services/projectsService');
                const project = await fetchProject(projectId!);
                if (project && (project as any).dna) {
                    setProjectName(project.projectName);
                    setDna((project as any).dna);
                    setHeroImage((project as any).baseImageUrl);
                    if ((project as any).seed) setSeed((project as any).seed);
                }
            } catch (err) {
                console.error('Failed to load hero:', err);
                toast.error('Failed to load hero');
            }
        }
        load();
    }, [projectId, toast]);

    // Save Helper
    const saveHero = async () => {
        const { saveProject } = await import('../services/projectsService');
        try {
            // Need to cast/construct a cohesive object
            const projectToSave: HeroProject = {
                id: projectId || 'new', // will be handled by service
                toolType: 'hero_lab',
                projectName: projectName || dna.name || 'Untitled Hero',
                dna,
                baseImageUrl: heroImage,
                seed: seed,
                // Required base props
                pageAmount: 1,
                pageSizeId: 'portrait',
                visualStyle: dna.styleLock,
                complexity: 'Moderate',
                targetAudienceId: 'kids',
                userPrompt: '',
                hasHeroRef: false,
                heroImage: null,
                includeText: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                pages: []
            };

            const saved = await saveProject(projectToSave);
            // If it was new, we might want to navigate or update ID, but for now just toast
            toast.success('Hero saved successfully!');

            // If new, navigate to proper URL so subsequent saves update
            if (!projectId && saved.id) {
                navigate(`/hero-lab/${saved.id}`, { replace: true });
            }
        } catch (err) {
            console.error('Failed to save hero:', err);
            toast.error('Failed to save hero');
        }
    };


    // Custom "setPages" interceptor to catch the result
    const [dummyPages, setDummyPages] = useState<any[]>([]);

    // Reuse existing generation hook - mimicking how Studio uses it
    const { isGenerating, startGeneration } = useGeneration({
        apiKey: 'valid',
        validateApiKey: () => true,
        settings: {
            enableKeyboardShortcuts: false,
            theme: 'dark',
            defaultContrast: 'std',
            enableSummaryCard: false,
            reducedMotion: false
        },
        showToast: (t, m, e) => {
            if (t === 'error') toast.error(m, e);
            else if (t === 'success') toast.success(m, e);
            else toast.info(m, e);
        },
        setPages: setDummyPages,
        setUserPrompt: () => { }
    });



    const handleGeneration = async () => {
        if (!dna.name) return;

        const fullPrompt = constructPrompt(dna);

        // We use the existing hook's function
        // Note: startGeneration expects specific struct.
        // We are hijacking 'userPrompt' to send our full engineered prompt.
        startGeneration({
            projectName: projectName || dna.name,
            userPrompt: fullPrompt,
            pageAmount: 1,
            pageSizeId: 'portrait',
            visualStyle: dna.styleLock,
            complexity: 'Moderate',
            targetAudienceId: 'kids', // Default
            hasHeroRef: false,
            heroImage: null,
            includeText: false,
            creativeVariation: 'balanced',
            seed: seed
        });
    };

    // Sync hook result to our local hero view
    // The useGeneration hook calls setDummyPages. We watch dummyPages.
    // This is a bit hacky but reuses the complex websocket/polling logic in useGeneration.
    React.useEffect(() => {
        const lastPage = dummyPages[dummyPages.length - 1];
        if (lastPage && lastPage.imageUrl && !lastPage.isLoading && lastPage.status === 'complete') {
            setHeroImage(lastPage.imageUrl);
            // Auto-save on generation success
            saveHero();
        }
    }, [dummyPages]);

    // Override the hook's setPages to point to ours
    // We need to re-instantiate the hook with the correct setter if we want to use it this way.
    // React hooks order rules mean we can't conditionally call it.
    // The previous call to useGeneration passed `setPages: (pages) => ...` 
    // Let's refine that definition above.

    return (
        <div className="h-screen w-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col font-sans">
            <div className="aurora-veil opacity-50 transition-opacity duration-500" />

            <Navigation />
            <ToastContainer />

            <div className="flex flex-1 pt-16 overflow-hidden">
                {/* Left Sidebar: Character Setup */}
                <div className="w-[400px] flex-shrink-0 flex flex-col bg-[hsl(var(--card))]/30 backdrop-blur-xl border-r border-[hsl(var(--border))] z-20 shadow-2xl overflow-hidden">
                    <CharacterSetup
                        dna={dna}
                        setDna={setDna}
                        onGenerate={handleGeneration}
                        isGenerating={isGenerating}
                        projectName={projectName}
                        setProjectName={setProjectName}
                        seed={seed}
                        setSeed={setSeed}
                    />
                </div>

                {/* Center Canvas: Character View */}
                <CharacterView
                    baseImageUrl={heroImage || (dummyPages[0]?.imageUrl)}
                    isGenerating={isGenerating}
                    projectName={projectName || dna.name}
                />

                {/* Right Toolbar: Tools */}
                <div className="w-16 flex-shrink-0 flex flex-col items-center py-6 gap-4 bg-[hsl(var(--card))]/30 backdrop-blur-xl border-l border-[hsl(var(--border))]">
                     <button 
                        onClick={() => {
                            if (!heroImage) return;
                            navigate('/studio', { 
                                state: { 
                                    heroData: {
                                        dna,
                                        image: heroImage,
                                        seed
                                    }
                                } 
                            });
                        }}
                        disabled={!heroImage}
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative" 
                        title="Use in Studio"
                    >
                        <span className="text-xl">🎨</span>
                        <div className="absolute right-12 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                            Use in Studio
                        </div>
                     </button>
                    
                    {/* Placeholder for Magic Edit / Export */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[hsl(var(--border))] opacity-30 select-none pb-1" title="Magic Edit (Coming Soon)">
                        <span className="text-xl text-[hsl(var(--muted-foreground))]">✨</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
