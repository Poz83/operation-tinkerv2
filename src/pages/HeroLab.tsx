import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { CharacterSetup } from '../components/CharacterSetup';
import { CharacterView } from '../components/CharacterView';
import { CharacterDNA, HeroReferenceMode } from '../types';
import { useGeneration } from '../hooks/useGeneration';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { useHeroProject } from '../hooks/useHeroProject';
import { DirectPromptService } from '../services/direct-prompt-service';

/**
 * Build a profile sheet prompt from DNA
 * Creates a 5-angle turnaround: Front, Back, Left, Right, 3/4 View
 */
const buildProfileSheetPrompt = (dna: CharacterDNA, referenceImage?: boolean, replicateMode?: boolean): string => {
    if (replicateMode && referenceImage) {
        return `
CHARACTER TURNAROUND SHEET - EXACT REPLICATION

Analyze the provided character image and create a 5-angle reference sheet showing this EXACT character in a grid layout:

┌─────────┬─────────┐
│  FRONT  │  BACK   │
├─────────┼─────────┤
│  LEFT   │  RIGHT  │
├─────────┴─────────┤
│    3/4 VIEW       │
└───────────────────┘

CRITICAL RULES:
1. EXACTLY replicate the character's appearance from the reference
2. Maintain all details: outfit, accessories, hairstyle, proportions
3. Infer unseen angles logically (what does the back look like?)
4. Keep the SAME art style as the reference
5. Each view must show the SAME character - perfect consistency

TECHNICAL STYLE:
Coloring book line art, clean monoline black outlines, bold thick lines, no shading, no gradients, no gray tones.
White background, high contrast. All 5 views clearly separated.

OUTPUT: 5-angle turnaround maintaining perfect consistency with reference.
`.trim();
    }

    return `
CHARACTER TURNAROUND SHEET - 5-ANGLE REFERENCE

Create a professional character reference sheet showing the SAME character from 5 angles arranged in a grid:

┌─────────┬─────────┐
│  FRONT  │  BACK   │
├─────────┼─────────┤
│  LEFT   │  RIGHT  │
├─────────┴─────────┤
│    3/4 VIEW       │
└───────────────────┘

${referenceImage ? 'Use the provided image as CREATIVE INSPIRATION. Capture the essence and vibe, but feel free to interpret and enhance based on the DNA below.' : ''}

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
- Outfit: ${dna.outfitCanon}
- Style: ${dna.styleLock}

CRITICAL RULES:
1. ALL 5 views must show the EXACT SAME character with IDENTICAL features
2. Signature features (${dna.signatureFeatures}) must appear in EVERY view where visible
3. Outfit must be consistent across all angles
4. Use T-pose or relaxed standing pose for clear silhouette
5. Plain white background for each view
6. Clear visual separation between views (thin lines or white space)

TECHNICAL STYLE:
Coloring book line art, clean monoline black outlines, bold thick lines matching "${dna.styleLock}" style.
No shading, no gradients, no gray. White background, high contrast.
`.trim();
};

export const HeroLab: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();

    // Use the new hero project hook with autosave
    const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, emoji?: string) => {
        switch (type) {
            case 'success': toast.success(message, emoji); break;
            case 'error': toast.error(message, emoji); break;
            case 'warning': toast.warning(message, emoji); break;
            case 'info': toast.info(message, emoji); break;
        }
    }, [toast]);

    const [isExtracting, setIsExtracting] = useState(false);
    const [dummyPages, setDummyPages] = useState<any[]>([]);

    // Use the new hook
    const project = useHeroProject({
        showToast,
        isGenerating: false // Will be updated
    });

    // Generation hook
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
        showToast,
        setPages: setDummyPages,
        setUserPrompt: () => { }
    });

    // Handle incoming reference URL from Vault
    const location = useLocation();
    React.useEffect(() => {
        const state = location.state as { referenceUrl?: string } | null;
        if (state?.referenceUrl) {
            fetch(state.referenceUrl)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        project.setReferenceImage({ base64: result, mimeType: blob.type });
                        project.setReferenceMode('inspiration');
                        showToast('success', 'Reference loaded from Vault', '🖼️');

                        // Clear state
                        window.history.replaceState({}, document.title);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(err => {
                    console.error('Failed to load reference:', err);
                    showToast('error', 'Failed to load reference image');
                });
        }
    }, [location.state]);

    // Handle reference image upload with DNA extraction
    const handleReferenceImageUpload = useCallback(async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = e.target?.result as string;
            if (!result) return;

            // Extract base64 from data URL
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            const mimeType = file.type || 'image/png';

            project.setReferenceImage({ base64: result, mimeType });

            // If in replicate mode, auto-extract DNA
            if (project.referenceMode === 'replicate') {
                setIsExtracting(true);
                try {
                    const service = new DirectPromptService();
                    const extractedDNA = await service.extractCharacterDNA(base64, mimeType);

                    if (extractedDNA) {
                        project.setDna(extractedDNA);
                        project.setProjectName(extractedDNA.name || 'Extracted Hero');
                        toast.success('Character DNA extracted!', '🧬');
                    }
                } catch (err) {
                    console.error('DNA extraction failed:', err);
                    toast.error('Failed to extract DNA from image');
                } finally {
                    setIsExtracting(false);
                }
            }
        };
        reader.readAsDataURL(file);
    }, [project, toast]);

    const handleReferenceImageClear = useCallback(() => {
        project.setReferenceImage(null);
    }, [project]);

    // Handle mode change - trigger extraction if switching to replicate with an image
    const handleReferenceModeChange = useCallback(async (mode: HeroReferenceMode) => {
        project.setReferenceMode(mode);

        // If switching to replicate and we have an image, extract DNA
        if (mode === 'replicate' && project.referenceImage) {
            setIsExtracting(true);
            try {
                const base64 = project.referenceImage.base64.includes(',')
                    ? project.referenceImage.base64.split(',')[1]
                    : project.referenceImage.base64;

                const service = new DirectPromptService();
                const extractedDNA = await service.extractCharacterDNA(base64, project.referenceImage.mimeType);

                if (extractedDNA) {
                    project.setDna(extractedDNA);
                    project.setProjectName(extractedDNA.name || project.projectName);
                    toast.success('Character DNA extracted!', '🧬');
                }
            } catch (err) {
                console.error('DNA extraction failed:', err);
                toast.error('Failed to extract DNA from image');
            } finally {
                setIsExtracting(false);
            }
        }
    }, [project, toast]);

    const handleUseInStudio = useCallback(() => {
        const heroImage = project.profileSheetUrl || project.baseImageUrl;
        if (!heroImage) return;

        navigate('/studio', {
            state: {
                heroData: {
                    dna: project.dna,
                    image: heroImage,
                    seed: project.seed
                }
            }
        });
    }, [project, navigate]);

    const handleImageUpload = useCallback((file: File) => {
        // This is for the CharacterView upload - saves as base image
        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = e.target?.result as string;
            if (result) {
                project.setBaseImageUrl(result);
            }
        };
        reader.readAsDataURL(file);
    }, [project]);

    const handleGeneration = useCallback(async () => {
        if (!project.dna.name && !project.referenceImage) return;

        const hasRef = !!project.referenceImage;
        const isReplicate = project.referenceMode === 'replicate';

        const fullPrompt = buildProfileSheetPrompt(project.dna, hasRef, isReplicate);

        // Use square aspect for profile sheet grid layout
        startGeneration({
            projectName: project.projectName || project.dna.name,
            userPrompt: fullPrompt,
            pageAmount: 1,
            pageSizeId: 'square', // Square for grid layout
            visualStyle: project.dna.styleLock,
            complexity: 'Moderate',
            targetAudienceId: 'kids',
            hasHeroRef: hasRef,
            heroImage: hasRef && project.referenceImage ? {
                base64: project.referenceImage.base64.includes(',')
                    ? project.referenceImage.base64.split(',')[1]
                    : project.referenceImage.base64,
                mimeType: project.referenceImage.mimeType
            } : null,
            includeText: false,
            creativeVariation: 'precision', // Lower temp for consistency
            characterDNA: project.dna
        });
    }, [project, startGeneration]);

    // Sync generation result to profile sheet
    React.useEffect(() => {
        const lastPage = dummyPages[dummyPages.length - 1];
        if (lastPage && lastPage.imageUrl && !lastPage.isLoading && lastPage.status === 'complete') {
            project.setProfileSheetUrl(lastPage.imageUrl);
            // Also set as base image for backwards compatibility
            project.setBaseImageUrl(lastPage.imageUrl);
            toast.success('Profile sheet generated!', '🖼️');
        }
    }, [dummyPages, project, toast]);

    return (
        <div className="h-screen w-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col font-sans">
            <div className="aurora-veil opacity-50 transition-opacity duration-500" />

            <Navigation />
            <ToastContainer />

            <div className="flex flex-1 pt-16 overflow-hidden">
                {/* Left Sidebar: Character Setup */}
                <div className="w-[400px] flex-shrink-0 flex flex-col bg-[hsl(var(--card))]/30 backdrop-blur-xl border-r border-[hsl(var(--border))] z-20 shadow-2xl overflow-hidden">
                    <CharacterSetup
                        dna={project.dna}
                        setDna={project.setDna}
                        onGenerate={handleGeneration}
                        isGenerating={isGenerating}
                        projectName={project.projectName}
                        setProjectName={project.setProjectName}
                        seed={project.seed}
                        setSeed={project.setSeed}
                        referenceImage={project.referenceImage}
                        onReferenceImageUpload={handleReferenceImageUpload}
                        onReferenceImageClear={handleReferenceImageClear}
                        referenceMode={project.referenceMode}
                        setReferenceMode={handleReferenceModeChange}
                        isExtracting={isExtracting}
                    />
                </div>

                {/* Center Canvas: Character View */}
                <CharacterView
                    baseImageUrl={project.profileSheetUrl || project.baseImageUrl || (dummyPages[0]?.imageUrl)}
                    isGenerating={isGenerating}
                    projectName={project.projectName || project.dna.name}
                    onImageUpload={handleImageUpload}
                    onUseInStudio={handleUseInStudio}
                />
            </div>

            {/* Save Status Indicator */}
            {project.saveStatus && project.saveStatus !== 'saved' && (
                <div className="fixed bottom-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium bg-[hsl(var(--card))]/80 backdrop-blur border border-[hsl(var(--border))]">
                    {project.saveStatus === 'saving' && '💾 Saving...'}
                    {project.saveStatus === 'unsaved' && '○ Unsaved changes'}
                    {project.saveStatus === 'error' && '⚠️ Save failed'}
                </div>
            )}
        </div>
    );
};
