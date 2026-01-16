/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PAGE_SIZES, VISUAL_STYLES, TARGET_AUDIENCES, COMPLEXITY_LEVELS, SavedProject, CreativeVariation, ColoringPage } from '../types';
import { useAutosave } from './useAutosave';
import { saveProject, fetchProject } from '../services/projectsService';

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
        pages // Pass pages for persistence
    }), [
        currentProjectId, projectName, pageAmount, pageSizeId, visualStyle,
        complexity, targetAudienceId, userPrompt, hasHeroRef, heroImage,
        includeText, pages
    ]);

    const { status: saveStatus, lastSavedAt } = useAutosave({
        project: currentProjectState,
        onSave: async (proj) => {
            const saved = await saveProject(proj);
            if (saved.id !== currentProjectId) {
                setCurrentProjectId(saved.id);
                // Silent URL update
                navigate(`/studio/project/${saved.id}`, { replace: true });
            }

            // Update pages (populates DB IDs and signed URLs if fresh)
            if (saved.pages) {
                setPages(saved.pages);
            }

            return saved;
        },
        enabled: !!(projectName || userPrompt) && pages.length > 0 && !isGenerating,
        interval: 5000 // 5 seconds debounce
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
            console.error('Failed to save project:', err);
            showToast("error", "Failed to save project.", "❌");
        }
    }, [currentProjectState, urlProjectId, navigate, showToast]);

    const handleLoadProject = useCallback((project: SavedProject) => {
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

        if (project.pages) {
            setPages(project.pages);
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
    }, [setPages]);

    // Load project on mount if URL ID exists
    useEffect(() => {
        if (urlProjectId) {
            async function load() {
                try {
                    const proj = await fetchProject(urlProjectId!);
                    if (proj) {
                        handleLoadProject(proj);
                    } else {
                        console.log('Project not found, treating as new:', urlProjectId);
                        setCurrentProjectId(urlProjectId);
                    }
                } catch (err) {
                    console.error('Failed to load project:', err);
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

        currentProjectId,
        saveStatus,
        lastSavedAt,

        handleSaveProject,
        handleLoadProject,
        handleClear
    };
};
