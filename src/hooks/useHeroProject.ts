/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CharacterDNA,
    HeroProject,
    HeroReferenceMode,
    VISUAL_STYLES
} from '../types';
import { useAutosave } from './useAutosave';

// Default empty DNA
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

interface UseHeroProjectProps {
    showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, emoji?: string) => void;
    isGenerating: boolean;
}

export const useHeroProject = ({ showToast, isGenerating }: UseHeroProjectProps) => {
    // --- Core State ---
    const [projectName, setProjectName] = useState('');
    const [dna, setDna] = useState<CharacterDNA>(INITIAL_DNA);
    const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));

    // --- Reference Image State ---
    const [referenceImage, setReferenceImage] = useState<{ base64: string; mimeType: string } | null>(null);
    const [referenceMode, setReferenceMode] = useState<HeroReferenceMode>('inspiration');

    // --- Generated Outputs ---
    const [baseImageUrl, setBaseImageUrl] = useState<string | undefined>(undefined);
    const [profileSheetUrl, setProfileSheetUrl] = useState<string | undefined>(undefined);

    // --- Persistence State ---
    const { projectId: urlProjectId } = useParams<{ projectId?: string }>();
    const navigate = useNavigate();
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

    // --- Build project state for autosave ---
    const currentProjectState: HeroProject = useMemo(() => ({
        id: currentProjectId || '',
        toolType: 'hero_lab',
        projectName: projectName || dna.name || 'Untitled Hero',
        dna,
        referenceImageUrl: referenceImage?.base64,
        referenceMode,
        baseImageUrl,
        profileSheetUrl,
        seed,
        // Required SavedProject fields
        pageAmount: 1,
        pageSizeId: 'portrait',
        visualStyle: dna.styleLock || VISUAL_STYLES[0].id,
        complexity: 'Moderate',
        targetAudienceId: 'kids',
        userPrompt: '',
        hasHeroRef: false,
        heroImage: null,
        includeText: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        thumbnail: profileSheetUrl || baseImageUrl,
    }), [
        currentProjectId, projectName, dna, referenceImage, referenceMode,
        baseImageUrl, profileSheetUrl, seed
    ]);

    // --- Autosave Logic ---
    const { status: saveStatus, lastSavedAt } = useAutosave({
        project: currentProjectState,
        onSave: async (proj) => {
            const { saveProject } = await import('../services/projectsService');
            const saved = await saveProject(proj);

            if (saved.id !== currentProjectId) {
                setCurrentProjectId(saved.id);
                navigate(`/hero-lab/${saved.id}`, { replace: true });
            }

            return saved;
        },
        enabled: !!(projectName || dna.name) && !isGenerating,
        interval: 5000
    });

    // --- Load Project ---
    const loadProject = useCallback((project: HeroProject) => {
        setProjectName(project.projectName);
        setDna(project.dna || INITIAL_DNA);
        setSeed(project.seed || Math.floor(Math.random() * 1000000));
        setReferenceMode(project.referenceMode || 'inspiration');
        setBaseImageUrl(project.baseImageUrl);
        setProfileSheetUrl(project.profileSheetUrl);
        setCurrentProjectId(project.id);

        // Handle reference image if stored
        if (project.referenceImageUrl) {
            setReferenceImage({ base64: project.referenceImageUrl, mimeType: 'image/png' });
        }

        showToast('success', `Loaded hero: ${project.projectName}`, '🦸');
    }, [showToast]);

    // --- Clear/Reset ---
    const handleClear = useCallback(() => {
        setProjectName('');
        setDna(INITIAL_DNA);
        setSeed(Math.floor(Math.random() * 1000000));
        setReferenceImage(null);
        setReferenceMode('inspiration');
        setBaseImageUrl(undefined);
        setProfileSheetUrl(undefined);
        setCurrentProjectId(null);
        navigate('/hero-lab', { replace: true });
    }, [navigate]);

    // --- Load from URL on mount ---
    useEffect(() => {
        if (urlProjectId && urlProjectId !== currentProjectId) {
            async function load() {
                try {
                    const { fetchProject } = await import('../services/projectsService');
                    const project = await fetchProject(urlProjectId!);
                    if (project && project.toolType === 'hero_lab') {
                        loadProject(project as HeroProject);
                    }
                } catch (err) {
                    console.error('Failed to load hero project:', err);
                    showToast('error', 'Failed to load hero', '❌');
                }
            }
            load();
        }
    }, [urlProjectId]);

    return {
        // Core
        projectName, setProjectName,
        dna, setDna,
        seed, setSeed,

        // Reference
        referenceImage, setReferenceImage,
        referenceMode, setReferenceMode,

        // Outputs
        baseImageUrl, setBaseImageUrl,
        profileSheetUrl, setProfileSheetUrl,

        // Persistence
        currentProjectId,
        saveStatus,
        lastSavedAt,

        // Actions
        loadProject,
        handleClear,

        // Computed
        currentProjectState,
        INITIAL_DNA
    };
};
