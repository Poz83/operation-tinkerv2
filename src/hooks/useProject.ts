/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PAGE_SIZES, VISUAL_STYLES, TARGET_AUDIENCES, COMPLEXITY_LEVELS, SavedProject, CreativeVariation, ColoringPage, CharacterDNA, StyleReference } from '../types';
import { useAutosave } from './useAutosave';
import { saveProject, fetchProject } from '../services/projectsService';
import { Logger } from '../lib/logger';

export const useProject = (
    pages: ColoringPage[],
    setPages: React.Dispatch<React.SetStateAction<ColoringPage[]>>,
    isGenerating: boolean,
    showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, emoji?: string) => void
) => {
    // --- Toolbar State ---
    const [projectName, setProjectName] = useState("");
    const [pageAmount, setPageAmount] = useState(1);
    const [pageSizeId, setPageSizeId] = useState(PAGE_SIZES[0].id);
    const [visualStyle, setVisualStyle] = useState(VISUAL_STYLES[0].id);
    const [complexity, setComplexity] = useState(COMPLEXITY_LEVELS[1]); // Default to 'Simple'
    const [targetAudienceId, setTargetAudienceId] = useState(TARGET_AUDIENCES[0].id);
    const [userPrompt, setUserPrompt] = useState("");
    const [hasHeroRef, setHasHeroRef] = useState(false);
    const [heroImage, setHeroImage] = useState<{ base64: string; mimeType: string } | null>(null);
    const [includeText, setIncludeText] = useState(false);
    const [creativeVariation, setCreativeVariation] = useState<CreativeVariation>('auto');
    const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>('private');
    const [characterDNA, setCharacterDNA] = useState<CharacterDNA | null>(null);
    const [autoConsistency, setAutoConsistency] = useState(true); // v3.0: Default ON for consistency
    const [heroPresence, setHeroPresence] = useState<number | undefined>(undefined);
    const [cinematics, setCinematics] = useState('dynamic');
    const [styleReferences, setStyleReferences] = useState<StyleReference[]>([]);

    // --- Persistence State ---
    const { projectId: urlProjectId } = useParams<{ projectId?: string }>();
    const navigate = useNavigate();
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

    // --- Autosave Logic ---
    const currentProjectState: SavedProject = useMemo(() => ({
        id: currentProjectId || '',
        projectName: projectName || 'Untitled Project',
        pageAmount,
        pageSizeId,
        visualStyle,
        complexity,
        targetAudienceId,
        userPrompt,
        hasHeroRef,
        heroImage,
        includeText,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        thumbnail: pages.find(p => p.imageUrl)?.imageUrl,
        pages, // Pass pages for persistence
        visibility,
        characterDNA: characterDNA || undefined,
        heroPresence,
        cinematics: cinematics as any, // Cast to avoid strict type issues locally only
        styleReferences: styleReferences.length > 0 ? styleReferences : undefined,
        // autoConsistency - consider adding to type if needed, but for now treating as session state mixed in
        // actually, let's keep it purely session-based for "Lite" mode unless requested
    }), [
        currentProjectId, projectName, pageAmount, pageSizeId, visualStyle,
        complexity, targetAudienceId, userPrompt, hasHeroRef, heroImage,
        includeText, pages, visibility, characterDNA, heroPresence, cinematics, styleReferences
    ]);

    const { status: saveStatus, lastSavedAt } = useAutosave({
        project: currentProjectState,
        onSave: async (proj) => {
            // [Fix]: Autosave Duplication Logic
            // If we have a currentProjectId, ensure we use it to overwrite, not create new.
            // The logic in saveProject handles 'CB'/'HL' updates, but we need to make sure 'proj' has the ID.
            const projectToSave = {
                ...proj,
                id: currentProjectId || proj.id
            };

            const saved = await saveProject(projectToSave);

            if (saved.id !== currentProjectId) {
                Logger.debug('SYSTEM', `Autosave: Project ID updated from ${currentProjectId} to ${saved.id}`);
                setCurrentProjectId(saved.id);
                // Silent URL update
                navigate(`/studio/project/${saved.id}`, { replace: true });
            }

            // Update pages (populates DB IDs and signed URLs if fresh)
            if (saved.pages) {
                // Only update pages if we're not actively generating to avoid race conditions
                if (!isGenerating) {
                    setPages(saved.pages);
                }
            }

            return saved;
        },
        // Only enabled if we have content and we are not currently generating (to avoid partial state saves)
        enabled: !!(projectName || userPrompt) && (pages.length > 0 || !!characterDNA) && !isGenerating,
        interval: 3000 // 3 seconds debounce
    });

    // --- Actions ---

    const handleSaveProject = useCallback(async () => {
        try {
            const saved = await saveProject(currentProjectState);
            setCurrentProjectId(saved.id);

            if (!urlProjectId || urlProjectId !== saved.id) {
                navigate(`/studio/project/${saved.id}`, { replace: true });
            }
            showToast("success", "Project saved to Vault!", "🔐");
        } catch (err) {
            Logger.error('NETWORK', 'Failed to save project', err);
            showToast("error", "Failed to save project.", "❌");
        }
    }, [currentProjectState, urlProjectId, navigate, showToast]);

    const handleLoadProject = useCallback(async (project: SavedProject) => {
        setProjectName(project.projectName);
        setPageAmount(project.pageAmount);
        setPageSizeId(project.pageSizeId);
        setVisualStyle(project.visualStyle);
        setComplexity(project.complexity);
        setTargetAudienceId(project.targetAudienceId);
        setUserPrompt(project.userPrompt);
        setHasHeroRef(project.hasHeroRef);
        setHeroImage(project.heroImage);
        setIncludeText(project.includeText);
        setCurrentProjectId(project.id);
        setCharacterDNA(project.characterDNA || null);
        setVisibility(project.visibility || 'private');
        setHeroPresence(project.heroPresence);
        setCinematics(project.cinematics || 'dynamic');
        setStyleReferences(project.styleReferences || []);

        if (project.pages) {
            // Hydrate pages from local cache for instant loading
            const { getCachedImage, cacheFromUrl } = await import('../services/ImageCacheService');

            const hydratedPages = await Promise.all(
                project.pages.map(async (page) => {
                    if (!page.imageUrl || !page.id) return page;

                    // Try to get from local cache first
                    const cachedUrl = await getCachedImage(page.id);
                    if (cachedUrl) {
                        return { ...page, imageUrl: cachedUrl };
                    }

                    // Not cached - trigger background caching for next time
                    cacheFromUrl(page.id, page.imageUrl, page.id);
                    return page;
                })
            );

            setPages(hydratedPages);
        }

        showToast("success", `Loaded "${project.projectName}"`, "📂");
    }, [setPages, showToast]);

    const handleClear = useCallback(() => {
        setProjectName("");
        setPageAmount(5); // Default reset
        setPageSizeId(PAGE_SIZES[0].id);
        setVisualStyle(VISUAL_STYLES[0].id);
        setComplexity(COMPLEXITY_LEVELS[1]);
        setTargetAudienceId(TARGET_AUDIENCES[0].id);
        setUserPrompt("");
        setHasHeroRef(false);
        setHeroImage(null);
        setIncludeText(false);
        setCurrentProjectId(null);
        setPages([]);
        setVisibility('private');
        setCharacterDNA(null);
        setHeroPresence(undefined);
        setCinematics('dynamic');
        setStyleReferences([]);
    }, [setPages]);

    // Load project on mount if URL ID exists
    useEffect(() => {
        if (urlProjectId) {
            // [Fix]: When switching projects, clear the previous state immediately to prevent "Zombie State" pollution
            // if the fetch fails or takes time.
            if (currentProjectId && currentProjectId !== urlProjectId) {
                handleClear();
            }

            async function load() {
                try {
                    const proj = await fetchProject(urlProjectId!, 'cache-first');
                    if (proj) {
                        handleLoadProject(proj);
                    } else {
                        Logger.debug('SYSTEM', `Project not found, treating as new: ${urlProjectId}`);
                        // [Fix]: Ensure we don't carry over old state if project doesn't exist yet
                        handleClear();
                        // [Fix]: Only set currentProjectId if it's a valid public ID (CB/HL prefix)
                        // Otherwise, leave it null so saveProject creates a proper new ID
                        const isValidPublicId = urlProjectId!.startsWith('CB') || urlProjectId!.startsWith('HL');
                        if (isValidPublicId) {
                            setCurrentProjectId(urlProjectId!);
                        }
                        // If invalid ID, currentProjectId stays null, and first save will create proper CB/HL ID
                    }
                } catch (err) {
                    Logger.error('NETWORK', 'Failed to load project', err);
                    showToast("error", "Failed to load project", "⚠️");
                }
            }
            load();
        }
    }, [urlProjectId]); // Intentionally not including handleLoadProject to avoid loops, though it is memoized

    return {
        projectName, setProjectName,
        pageAmount, setPageAmount,
        pageSizeId, setPageSizeId,
        visualStyle, setVisualStyle,
        complexity, setComplexity,
        targetAudienceId, setTargetAudienceId,
        userPrompt, setUserPrompt,
        hasHeroRef, setHasHeroRef,
        heroImage, setHeroImage,
        includeText, setIncludeText,
        creativeVariation, setCreativeVariation,
        visibility, setVisibility,
        characterDNA, setCharacterDNA,
        autoConsistency, setAutoConsistency,
        heroPresence, setHeroPresence,
        cinematics, setCinematics,
        styleReferences, setStyleReferences,

        currentProjectId,
        saveStatus,
        lastSavedAt,

        handleSaveProject,
        handleLoadProject,
        handleClear
    };
};
