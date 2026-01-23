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
import { HeroLabService } from '../services/HeroLabService';
import { useHeroEditChat } from '../hooks/useHeroEditChat';
import { HeroEditChatPanel } from '../components/HeroEditChatPanel';

/**
 * Build a profile sheet prompt from DNA
 * Creates a 5-angle turnaround: Front, Back, Left, Right, 3/4 View
 */
const buildProfileSheetPrompt = (dna: CharacterDNA, referenceImage?: boolean, replicateMode?: boolean): string => {
    const layoutInstructions = `
ARRANGEMENT:
Strictly arrange the 5 views in a SINGLE HORIZONTAL ROW with equal spacing:
(Front)  (3/4 View)  (Side)  (Back)  (Action Pose)
--|--------|--------|--------|--------|--

CRITICAL LAYOUT RULES:
1. NO TEXT, NO NUMBERS, NO LABELS. The image must be purely visual.
2. Perfect alignment: All feet must form a straight horizontal line.
3. Equal sizing: The character must be the same height in every view.
4. Clean separation: Use whitespace between figures. No dividing lines or boxes.
`;

    if (replicateMode && referenceImage) {
        return `
CHARACTER TURNAROUND SHEET - EXACT REPLICATION

Analyze the provided character image and create a 5-angle reference sheet showing this EXACT character.

${layoutInstructions}

CRITICAL RULES:
1. PURELY VISUAL: Do not add any text, name, bio, or numbers [1][2] etc.
2. EXACTLY replicate the character's appearance from the reference.
3. Maintain all details: outfit, accessories, hairstyle, proportions.
4. Infer unseen angles logically (what does the back look like?).
5. Keep the SAME art style as the reference.
6. Each view must show the SAME character - perfect consistency.

MATERIAL CONSISTENCY RULES:
- TRANSPARENCY: If a material is transparent (e.g., glass visor), it MUST be transparent in ALL ANGLES.
- BACK VIEW LOGIC: Show the back of the head through transparent helmets. Do NOT render as opaque.

TECHNICAL STYLE:
STRICTLY BLACK AND WHITE. NO COLOR.
Coloring book line art, clean monoline black outlines, bold thick lines, no shading/gradients.
NO GRAY TONES. PURE BLACK ON WHITE.
White background, high contrast. All 5 views clearly separated in a row.
`.trim();
    }

    // Filter out empty fields to give the model a cleaner signal
    const dnaFields = [
        dna.name && `- Name: ${dna.name}`,
        dna.role && `- Role: ${dna.role}`,
        dna.age && `- Age: ${dna.age}`,
        dna.face && `- Face: ${dna.face}`,
        dna.eyes && `- Eyes: ${dna.eyes}`,
        dna.hair && `- Hair: ${dna.hair}`,
        dna.skin && `- Skin: ${dna.skin}`,
        dna.body && `- Body: ${dna.body}`,
        dna.signatureFeatures && `- Signature Features: ${dna.signatureFeatures}`,
        dna.outfitCanon && `- Outfit: ${dna.outfitCanon}`,
        dna.styleLock && `- Style: ${dna.styleLock}`
    ].filter(Boolean).join('\n');

    return `
CHARACTER TURNAROUND SHEET - 5-ANGLE REFERENCE

Create a professional character reference sheet showing the SAME character from 5 angles.

${layoutInstructions}

${referenceImage ? `
REFERENCE IMAGE INSTRUCTIONS:
Use the provided image as CREATIVE INSPIRATION for the vibe and general look.
HOWEVER, you must STRICTLY ADHERE to the text DNA below.

CONFLICT RESOLUTION:
If the Reference Image contradicts the text DNA (especially for Outfit, Role, or specific features), the TEXT DNA TAKES PRECEDENCE.
- If DNA says "Spacesuit" and image shows "T-shirt", user MUST see a Spacesuit.
` : ''}

CHARACTER DNA:
${dnaFields}

CRITICAL RULES:
1. STRICT NO-TEXT POLICY: Do not write the name, do not number the views ([1]), no labels.
2. ALL 5 views must show the EXACT SAME character with IDENTICAL features.
3. Signature features must appear in EVERY view where visible.
4. Outfit must be consistent across all angles.
5. Use T-pose or relaxed standing pose for clear silhouette.

MATERIAL CONSISTENCY RULES:
- TRANSPARENCY: If a material is transparent (e.g., glass visor), it MUST be transparent in ALL ANGLES.
- BACK VIEW LOGIC: Show the back of the head through transparent helmets. Do NOT render as opaque.
- SOLIDITY: If a material is solid (e.g., metal armor), it must remain solid in all views.

TECHNICAL STYLE:
STRICTLY BLACK AND WHITE. NO COLOR.
Coloring book line art, clean monoline black outlines, bold thick lines matching "${dna.styleLock}" style.
NO SHADING, NO GRADIENTS, NO GRAY SCALES, NO COLOR FILLS.
White background, high contrast.
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
    const [showHeroEditor, setShowHeroEditor] = useState(false);

    // Use the new hook
    const project = useHeroProject({
        showToast,
        isGenerating: false // Will be updated
    });

    // Hero edit chat hook
    const handleHeroImageEdited = useCallback((newImageUrl: string, isNewVersion: boolean) => {
        if (isNewVersion) {
            // Save as a copy (don't replace current)
            toast.success('Edit saved as copy!', '📋');
        } else {
            // Replace current image
            project.setProfileSheetUrl(newImageUrl);
            project.setBaseImageUrl(newImageUrl);
            toast.success('Hero updated!', '✨');
        }
    }, [project, toast]);

    const heroEditChat = useHeroEditChat(handleHeroImageEdited, project.dna);

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
                    const service = new HeroLabService();
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

                const service = new HeroLabService();
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

    const handleUseInStudio = useCallback(async () => {
        let projectId = project.currentProjectId;

        // If no project ID yet, force a save first
        if (!projectId) {
            toast.info('Finalizing hero for Studio...', '⏳');
            try {
                const saved = await project.saveNow();
                if (saved?.id) {
                    projectId = saved.id;
                }
            } catch (err) {
                console.error('Failed to save hero:', err);
                toast.error('Failed to save hero. Please try again.');
                return;
            }

            // If still no ID after save, something went wrong
            if (!projectId) {
                toast.error('Could not save hero. Please add a name first.');
                return;
            }
        }

        // Pass project ID instead of inline data - Studio will fetch from vault
        navigate('/studio', {
            state: { heroProjectId: projectId }
        });
    }, [project.currentProjectId, project.saveNow, navigate, toast]);

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

    // Open hero editor with current image
    const handleMagicEdit = useCallback(() => {
        const imageUrl = project.profileSheetUrl || project.baseImageUrl || dummyPages[0]?.imageUrl;
        if (!imageUrl) {
            toast.warning('Generate or upload an image first', '🖼️');
            return;
        }
        heroEditChat.setSelectedImage(imageUrl, project.projectName || project.dna.name || 'Hero');
        setShowHeroEditor(true);
    }, [project.profileSheetUrl, project.baseImageUrl, project.projectName, project.dna.name, dummyPages, heroEditChat, toast]);

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
            pageSizeId: 'landscape', // Landscape for wide turnaround layout
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
                // onMagicEdit removed - moved to sidebar
                />

                {/* Right Toolbar - Always Visible */}
                <div className="w-16 flex-shrink-0 flex flex-col items-center py-6 gap-4 bg-[hsl(var(--card))]/30 backdrop-blur-xl border-l border-[hsl(var(--border))] z-20">
                    {/* Magic Edit Button */}
                    <button
                        onClick={handleMagicEdit}
                        disabled={!project.profileSheetUrl && !project.baseImageUrl}
                        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] hover:bg-[hsl(var(--muted))]/20 disabled:opacity-40 disabled:cursor-not-allowed group"
                        title="Magic Edit"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
                            <circle cx="7.5" cy="14.5" r="1.5"></circle>
                            <circle cx="16.5" cy="14.5" r="1.5"></circle>
                        </svg>
                        <span className="text-[8px] font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]">Magic Edit</span>
                    </button>
                </div>
            </div>

            {/* Save Status Indicator */}
            {project.saveStatus && project.saveStatus !== 'saved' && (
                <div className="fixed bottom-4 right-24 px-3 py-1.5 rounded-full text-xs font-medium bg-[hsl(var(--card))]/80 backdrop-blur border border-[hsl(var(--border))] z-50">
                    {/* Saving status hidden for silent autosave */}
                    {project.saveStatus === 'unsaved' && '○ Unsaved changes'}
                    {project.saveStatus === 'error' && '⚠️ Save failed'}
                </div>
            )}

            {/* Hero Edit Chat Panel */}
            {showHeroEditor && (
                <HeroEditChatPanel
                    onClose={() => setShowHeroEditor(false)}
                    heroEditChat={heroEditChat}
                    characterDNA={project.dna}
                />
            )}
        </div>
    );
};
