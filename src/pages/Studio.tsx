/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { PAGE_SIZES, VISUAL_STYLES, TARGET_AUDIENCES, COMPLEXITY_LEVELS, ColoringPage, CreativeVariation, SavedProject } from '../types';
import { Setup } from '../components/Setup';
import { Book } from '../components/Book';
import { useApiKey } from '../useApiKey';
import { ApiKeyDialog } from '../components/ApiKeyDialog';
import { processGeneration } from '../server/jobs/process-generation';
import { brainstormPrompt } from '../services/geminiService';
import { motion } from 'framer-motion';
import { batchLogStore, isBatchLoggingEnabled } from '../logging/batchLog';
import { dataUrlToBlob } from '../logging/utils';
import { PageGenerationEvent } from '../logging/events';
import { Navigation } from '../components/Navigation';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useSettings } from '../context/settingsContext';
import { ImageEditChatPanel } from '../components/ImageEditChatPanel';
import { useImageEditChat } from '../hooks/useImageEditChat';

import coloringStudioIcon from '../assets/coloring-studio.png';

// Lazy-load BatchLogPanel (dev feature)
const BatchLogPanel = React.lazy(() => import('../components/BatchLogPanel'));

const BATCH_LOGS_ENABLED = isBatchLoggingEnabled();

const App: React.FC = () => {
  const { validateApiKey, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  // Toolbar State
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

  // App State
  const location = useLocation();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [pages, setPages] = useState<ColoringPage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activePageNumber, setActivePageNumber] = useState<number | null>(null);
  const [generationPhase, setGenerationPhase] = useState<'planning' | 'generating' | 'complete'>('planning');
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showBatchLogs, setShowBatchLogs] = useState(false);
  const [showEditChat, setShowEditChat] = useState(false);

  // Toast notifications
  const toast = useToast();

  // Settings
  const { settings } = useSettings();

  // Image Edit Chat Hook
  const handleImageEdited = useCallback((pageIndex: number, newImageUrl: string, isNewVersion: boolean) => {
    if (isNewVersion) {
      // Create a new page with the edited image (inserted after current page)
      const newPage: ColoringPage = {
        id: `edited-${Date.now()}`,
        imageUrl: newImageUrl,
        prompt: `Edited version of page ${pageIndex + 1}`,
        isLoading: false,
        pageIndex: pages.length, // Add at end
        status: 'complete',
      };
      setPages(prev => [...prev, newPage]);
      toast.success('Edit complete! New version added.', '✨');
    } else {
      // Replace the original image
      setPages(prev => prev.map(p =>
        p.pageIndex === pageIndex ? { ...p, imageUrl: newImageUrl } : p
      ));
    }
  }, [pages.length, toast]);

  const imageEditChat = useImageEditChat(handleImageEdited);

  // Handle image selection from Book component
  const handleImageSelect = useCallback((imageUrl: string, pageIndex: number) => {
    imageEditChat.setSelectedImage(imageUrl, pageIndex);
    setShowEditChat(true);
  }, [imageEditChat]);

  const handleCloseEditChat = useCallback(() => {
    setShowEditChat(false);
  }, []);

  const handleDeletePage = useCallback((targetPageIndex: number) => {
    setPages(currentPages => {
      const kept = currentPages.filter(p => p.pageIndex !== targetPageIndex);
      const reindexed = kept.map((p, i) => ({ ...p, pageIndex: i }));

      // Safety check for current index
      if (currentSheetIndex >= reindexed.length) {
        setCurrentSheetIndex(Math.max(0, reindexed.length - 1));
      }

      return reindexed;
    });
    toast.success('Page deleted', '🗑️');
  }, [currentSheetIndex, toast]);

  // Cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keyboard shortcuts (when enabled in settings)
  useEffect(() => {
    if (!settings.enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + Enter: Generate
      if (isMod && e.key === 'Enter' && userPrompt && !isGenerating) {
        e.preventDefault();
        // Trigger generation - we'll call the ref below
        document.getElementById('generate-btn')?.click();
      }

      // Cmd/Ctrl + E: Enhance prompt
      if (isMod && e.key === 'e' && userPrompt && !isEnhancing) {
        e.preventDefault();
        document.getElementById('enhance-btn')?.click();
      }

      // Cmd/Ctrl + N: Clear/New project
      if (isMod && e.key === 'n') {
        e.preventDefault();
        document.getElementById('clear-btn')?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.enableKeyboardShortcuts, userPrompt, isGenerating, isEnhancing]);


  const handleEnhancePrompt = async () => {
    const hasKey = await validateApiKey();
    if (!hasKey || !userPrompt.trim()) return;

    setIsEnhancing(true);
    try {
      const enhanced = await brainstormPrompt(userPrompt);
      if (enhanced) {
        setUserPrompt(enhanced);
      }
    } catch (e) {
      console.error("Enhance failed", e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleGenerate = async () => {
    const hasKey = await validateApiKey();
    if (!hasKey) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setProgress(0);
    setPages([]);
    setCurrentSheetIndex(0);

    let completedTasks = 0;
    let totalTasks = 0;

    const updateProgress = () => {
      completedTasks++;
      const p = Math.round((completedTasks / totalTasks) * 100);
      setProgress(p);
    };

    try {
      const sizeConfig = PAGE_SIZES.find(s => s.id === pageSizeId);
      const aspectRatio = sizeConfig?.ratio || '1:1';
      const audienceLabel = TARGET_AUDIENCES.find(a => a.id === targetAudienceId)?.label || "General";

      const loggingEnabled = BATCH_LOGS_ENABLED;
      let batchId: string | undefined;

      if (loggingEnabled) {
        const heroDataUrl = hasHeroRef && heroImage
          ? `data:${heroImage.mimeType};base64,${heroImage.base64}`
          : undefined;
        const estimatedHeroSize = heroImage?.base64 ? Math.ceil((heroImage.base64.length * 3) / 4) : undefined;

        batchId = await batchLogStore.createBatch({
          projectName: projectName || 'Untitled Project',
          userIdea: userPrompt,
          pageCount: pageAmount,
          audience: audienceLabel,
          style: visualStyle,
          complexity: complexity,
          aspectRatio: aspectRatio,
          includeText: includeText,
          hasHeroRef: hasHeroRef,
          heroImageMeta: heroImage
            ? {
              mimeType: heroImage.mimeType,
              size: estimatedHeroSize,
            }
            : undefined,
          heroImageDataUrl: heroDataUrl,
        });
      }

      const handlePageEvent = async (event: PageGenerationEvent) => {
        // Update UI state based on event type
        switch (event.type) {
          case 'start':
            setPages(prev => prev.map(p =>
              p.pageIndex === event.pageNumber - 1
                ? { ...p, status: 'generating', statusMessage: 'Generating image...', startedAt: new Date() }
                : p
            ));
            setActivePageNumber(event.pageNumber);
            setGenerationPhase('generating');
            break;

          case 'success':
            setPages(prev => prev.map(p =>
              p.pageIndex === event.pageNumber - 1
                ? { ...p, status: 'complete', completedAt: new Date() }
                : p
            ));
            break;

          case 'error':
            setPages(prev => prev.map(p =>
              p.pageIndex === event.pageNumber - 1
                ? { ...p, status: 'error', statusMessage: event.error }
                : p
            ));
            break;

          case 'cooldown_start':
            setPages(prev => prev.map(p =>
              p.pageIndex === event.pageNumber - 1
                ? {
                  ...p,
                  status: 'cooldown',
                  statusMessage: `Waiting ${Math.ceil(event.cooldownMs / 1000)}s before next page`,
                  cooldownRemaining: Math.ceil(event.cooldownMs / 1000)
                }
                : p
            ));
            break;

          case 'cooldown_progress':
            setPages(prev => prev.map(p =>
              p.pageIndex === event.pageNumber - 1
                ? {
                  ...p,
                  cooldownRemaining: Math.ceil(event.remainingMs / 1000),
                  statusMessage: `${Math.ceil(event.remainingMs / 1000)}s remaining...`
                }
                : p
            ));
            break;

          case 'cooldown_end':
            // Status will be updated by the next 'start' event
            break;

          case 'qa_start':
            setPages(prev => prev.map(p =>
              p.pageIndex === event.pageNumber - 1
                ? { ...p, status: 'qa_checking', statusMessage: 'Running quality checks...' }
                : p
            ));
            break;

          case 'qa_complete':
            // Status updated based on whether retry is needed (handled by retry events)
            break;

          case 'retry_start':
            setPages(prev => prev.map(p =>
              p.pageIndex === event.pageNumber - 1
                ? { ...p, status: 'retrying', statusMessage: 'Quality issue detected, retrying...' }
                : p
            ));
            break;

          case 'retry_complete':
            setPages(prev => prev.map(p =>
              p.pageIndex === event.pageNumber - 1
                ? { ...p, statusMessage: `Retry complete (score: ${event.newScore})` }
                : p
            ));
            break;
        }

        // Logging (only if enabled)
        if (!loggingEnabled || !batchId) return;

        if (event.type === 'start') {
          await batchLogStore.recordPageStart(batchId, event.pageNumber, {
            aspectRatio: event.aspectRatio,
            resolution: event.resolution,
            width: event.width,
            height: event.height,
            fullPrompt: event.fullPrompt,
            fullNegativePrompt: event.fullNegativePrompt,
            startedAt: new Date().toISOString(),
          });
          return;
        }

        if (event.type === 'success') {
          const imageBlob = await dataUrlToBlob(event.imageUrl);
          await batchLogStore.recordPageResult(batchId, event.pageNumber, {
            aspectRatio: event.aspectRatio,
            resolution: event.resolution,
            width: event.width,
            height: event.height,
            fullPrompt: event.fullPrompt,
            fullNegativePrompt: event.fullNegativePrompt,
            imageBlob,
            imageDataUrl: event.imageUrl,
            startedAt: event.startedAt,
            finishedAt: event.finishedAt,
            latencyMs: event.latencyMs,
            qa: event.qa,
          });
          return;
        }

        if (event.type === 'error') {
          await batchLogStore.recordPageResult(batchId, event.pageNumber, {
            error: event.error,
            startedAt: event.startedAt,
            finishedAt: event.finishedAt,
            latencyMs: event.latencyMs,
          });
        }
      };

      await processGeneration(
        {
          batchId,
          userIdea: userPrompt,
          pageCount: pageAmount,
          audience: audienceLabel,
          style: visualStyle,
          complexity: complexity,
          hasHeroRef: hasHeroRef,
          heroImage: (hasHeroRef && heroImage) ? heroImage : undefined,
          aspectRatio: aspectRatio,
          includeText: includeText,
          creativeVariation: creativeVariation,
          signal: controller.signal
        },
        // 1. On Plan Generated
        (plan) => {
          let finalPlan = plan;
          if (!finalPlan || finalPlan.length === 0) {
            finalPlan = Array.from({ length: pageAmount }).map((_, i) => ({
              pageNumber: i + 1,
              prompt: `${userPrompt} (Scene ${i + 1})`,
              vectorMode: 'standard',
              complexityDescription: "Standard coloring book style",
              requiresText: false
            }));
          }

          const newPages: ColoringPage[] = [];

          finalPlan.forEach((item) => {
            newPages.push({
              id: `page-${item.pageNumber}`,
              prompt: item.prompt,
              isLoading: true,
              pageIndex: item.pageNumber - 1,
              status: 'queued',
              statusMessage: 'Queued'
            });
          });

          setPages(newPages);
          totalTasks = newPages.length;

          if (loggingEnabled && batchId) {
            batchLogStore.savePlan(
              batchId,
              finalPlan.map((p) => ({
                pageNumber: p.pageNumber,
                planPrompt: p.prompt,
                requiresText: p.requiresText,
              }))
            ).catch((err) => console.error('Logging plan failed', err));
          }
        },
        // 2. On Page Complete
        (pageNumber, imageUrl) => {
          setPages(prev => prev.map(p => p.pageIndex === pageNumber - 1 ? { ...p, imageUrl, isLoading: false } : p));
          updateProgress();
        },
        (event) => {
          // Fire and forget to avoid blocking generation
          handlePageEvent(event).catch((err) => console.error('Logging failed', err));
        }
      );

    } catch (e: any) {
      if (e.message === 'Aborted') {
        console.log("Generation cancelled by user.");
      } else {
        console.error("Workflow failed", e);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const downloadPDF = async () => {
    // Dynamic import - loads jsPDF bundle only when needed
    const { generateColoringBookPDF } = await import('../utils/pdf-generator');

    // Resolve human-readable labels for the receipt
    const styleLabel = VISUAL_STYLES.find(s => s.id === visualStyle)?.label || visualStyle;
    const audienceLabel = TARGET_AUDIENCES.find(a => a.id === targetAudienceId)?.label || targetAudienceId;

    // Sanitize the project name to make a safe filename
    const safeTitle = (projectName || 'coloring_book')
      .slice(0, 30)                // Limit length
      .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric with _
      .replace(/_+/g, '_')         // Remove duplicate _
      .toLowerCase();

    const filename = `${safeTitle}_${Date.now()}.pdf`;

    generateColoringBookPDF(
      pages,
      projectName || 'My Coloring Book',
      pageSizeId,
      {
        style: styleLabel,
        complexity: complexity,
        audience: audienceLabel,
        originalPrompt: userPrompt
      },
      filename
    );
  };

  const downloadZIP = async () => {
    // Dynamic import - loads jszip bundle only when needed
    const JSZip = (await import('jszip')).default;

    const zip = new JSZip();
    const finishedPages = pages.filter(p => p.imageUrl);

    finishedPages.forEach((page) => {
      if (page.imageUrl) {
        const data = page.imageUrl.split(',')[1];
        const fileName = page.isCover
          ? `00_cover.png`
          : `${String(page.pageIndex).padStart(2, '0')}_page.png`;

        zip.file(fileName, data, { base64: true });
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(projectName || 'coloring_book').replace(/\s+/g, '-')}_images.zip`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

}
  };

const handleSaveProject = () => {
  // 1. Create project object
  const newProject: SavedProject = {
    id: currentProjectId || crypto.randomUUID(),
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
    // Optionally add a thumbnail from the first generated page if available
    thumbnail: pages.find(p => p.imageUrl)?.imageUrl
  };

  try {
    // 2. Get existing projects
    const existingJson = localStorage.getItem('myjoe_projects');
    let projects: SavedProject[] = existingJson ? JSON.parse(existingJson) : [];

    // 3. Update or Add
    const index = projects.findIndex(p => p.id === newProject.id);
    if (index >= 0) {
      projects[index] = { ...newProject, createdAt: projects[index].createdAt, updatedAt: Date.now() };
    } else {
      projects.push(newProject);
    }

    // 4. Save to localStorage
    // Check for size limit - if too big, try removing large images from the LIST (but maybe keep current in memory)
    const serialized = JSON.stringify(projects);

    try {
      localStorage.setItem('myjoe_projects', serialized);
      setCurrentProjectId(newProject.id);
      toast.success("Project saved to Vault!", "🔐");
    } catch (e) {
      // If quota exceeded, try to save without the hero image/thumbnail for this entry
      // This is a basic fallback.
      const strippedProject = { ...newProject, heroImage: null, thumbnail: undefined };
      if (index >= 0) projects[index] = strippedProject;
      else projects[projects.length - 1] = strippedProject;

      localStorage.setItem('myjoe_projects', JSON.stringify(projects));
      setCurrentProjectId(newProject.id);
      toast.warning("Saved (without images due to space limits)", "⚠️");
    }

  } catch (e) {
    console.error(e);
    toast.error("Failed to save project.", "❌");
  }
};

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

  toast.success(`Loaded "${project.projectName}"`, "📂");
}, [toast]);

// Check for project to load from navigation state
useEffect(() => {
  if (location.state && (location.state as any).project) {
    const projectToLoad = (location.state as any).project as SavedProject;
    handleLoadProject(projectToLoad);
    // Clear state so we don't reload on refresh (optional, but good practice)
    window.history.replaceState({}, document.title);
  }
}, [location.state, handleLoadProject]);


const handleClear = () => {
  // Cancel any ongoing generation
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  // Reset all form fields to defaults
  setProjectName("");
  setPageAmount(5);
  setPageSizeId(PAGE_SIZES[0].id);
  setVisualStyle(VISUAL_STYLES[0].id);
  setComplexity(COMPLEXITY_LEVELS[1]); // Default to 'Simple'
  setTargetAudienceId(TARGET_AUDIENCES[0].id);
  setUserPrompt("");
  setHasHeroRef(false);
  setHeroImage(null);
  setIncludeText(false);

  // Clear generated pages and reset progress
  setPages([]);
  setProgress(0);
  setCurrentSheetIndex(0);
  setIsGenerating(false);
  setIsEnhancing(false);
};

const { completedPages, totalPages, derivedProgress } = useMemo(() => {
  const total = pages.length || pageAmount;
  const completed = pages.filter(p => !p.isLoading).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { completedPages: completed, totalPages: total, derivedProgress: percent };
}, [pages, pageAmount]);

const displayProgress = isGenerating ? Math.max(progress, derivedProgress) : derivedProgress;

return (
  <div className="dark h-screen w-screen overflow-hidden bg-[hsl(var(--background))] text-white selection:bg-white/30 font-sans flex flex-col">
    <div className="aurora-veil" />
    {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}

    {/* Navigation Bar */}
    <Navigation />

    {/* Main Content Wrapper */}
    <div className="flex flex-1 pt-16 overflow-hidden">
      {/* Sidebar - Fixed Left Panel */}
      <div className="w-[400px] flex-shrink-0 flex flex-col glass-sidebar z-20 shadow-2xl overflow-hidden text-zinc-100">

        {/* Setup Form - Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <Setup
            projectName={projectName}
            setProjectName={setProjectName}
            pageAmount={pageAmount}
            setPageAmount={setPageAmount}
            pageSize={pageSizeId}
            setPageSize={setPageSizeId}
            visualStyle={visualStyle}
            setVisualStyle={setVisualStyle}
            complexity={complexity}
            setComplexity={setComplexity}
            targetAudience={targetAudienceId}
            setTargetAudience={setTargetAudienceId}
            userPrompt={userPrompt}
            setUserPrompt={setUserPrompt}
            hasHeroRef={hasHeroRef}
            setHasHeroRef={setHasHeroRef}
            heroImage={heroImage}
            setHeroImage={setHeroImage}
            isGenerating={isGenerating}
            isEnhancing={isEnhancing}
            onEnhancePrompt={handleEnhancePrompt}
            progress={progress}
            onGenerate={handleGenerate}
            onCancel={handleCancel}
            onDownloadPDF={downloadPDF}
            onDownloadZIP={downloadZIP}
            hasPages={pages.some(p => !p.isLoading)}
            isDarkMode={isDarkMode}
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            includeText={includeText}
            setIncludeText={setIncludeText}
            onSaveProject={handleSaveProject}
            onLoadProject={() => { }} // Load is now handled via Vault navigation
            onClear={handleClear}
            showToast={(type, message, emoji) => {
              switch (type) {
                case 'success': toast.success(message, emoji); break;
                case 'error': toast.error(message, emoji); break;
                case 'warning': toast.warning(message, emoji); break;
                case 'info': toast.info(message, emoji); break;
              }
            }}
            // Hide header/footer in Setup component since we handle it here
            embeddedMode={true}
            creativeVariation={creativeVariation}
            setCreativeVariation={setCreativeVariation}
          />
        </div>

        {/* Sidebar Footer - Stats & Actions */}
        <div className="flex-shrink-0 p-6 border-t border-white/5 bg-transparent z-10">
          <div className="flex flex-col gap-3">
            {(isGenerating || (displayProgress > 0 && displayProgress < 100)) ? (
              <button
                onClick={handleCancel}
                className="w-full py-3 rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/10 font-medium transition-all"
              >
                Stop Creating
              </button>
            ) : (
              <button
                id="generate-btn"
                onClick={handleGenerate}
                disabled={!userPrompt}
                className="btn-primary w-full py-3 text-base shadow-lg"
              >
                ✨ Create My Book
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Main Workspace - Flexible Area */}
      <main className="flex-1 h-full relative flex flex-col bg-transparent overflow-hidden">

        {/* Workspace Top Bar */}
        <div className="absolute top-6 right-6 z-50 flex gap-4 pointer-events-none">
          <div className="pointer-events-auto flex gap-3 items-center">
            {(isGenerating || displayProgress > 0) ? (
              <div className="flex items-center gap-3 bg-[hsl(var(--card))]/85 border border-white/10 rounded-2xl px-3 py-2 shadow-lg backdrop-blur">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10" viewBox="0 0 100 100" aria-hidden>
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 42}
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#a5b4ff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42}
                      initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      animate={{ strokeDashoffset: (1 - displayProgress / 100) * (2 * Math.PI * 42) }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-white">{displayProgress}%</div>
                </div>
                <div className="flex flex-col">
                  {generationPhase === 'planning' ? (
                    <span className="text-xs font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                      🎨 Planning your pages...
                    </span>
                  ) : generationPhase === 'generating' && activePageNumber ? (
                    <span className="text-xs font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                      ✨ Creating page {activePageNumber}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-white leading-tight">
                      {Math.round(displayProgress)}% complete!
                    </span>
                  )}
                  <span className="text-[11px] text-white/60 leading-tight">
                    {completedPages} of {totalPages || pageAmount} complete
                  </span>
                </div>
                {isGenerating && (
                  <button
                    onClick={handleCancel}
                    className="text-[11px] font-semibold text-white/80 hover:text-white transition-colors px-2 py-1 rounded-lg border border-white/15 bg-white/5"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className="glass-pill border-white/10 bg-[hsl(var(--card))]/80">
                <span className="dot bg-zinc-500" />
                Ready
              </div>
            )}

            {BATCH_LOGS_ENABLED && (
              <button
                onClick={() => setShowBatchLogs(true)}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/10 text-white text-sm hover:bg-white/20"
              >
                Batch Logs (dev)
              </button>
            )}

            {pages.some(p => !p.isLoading) && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="btn-primary w-auto px-5 py-2 text-sm shadow-none border-white/10 bg-white/10 hover:bg-white/20 text-white"
                >
                  Export
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1"><path d="M6 9l6 6 6-6" /></svg>
                </button>

                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute top-full right-0 mt-2 z-50 w-56 bg-[hsl(var(--popover))] border border-white/10 rounded-xl shadow-2xl p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                      <button onClick={() => { downloadPDF(); setShowExportMenu(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm text-zinc-200 flex items-center gap-3 transition-colors">
                        <span className="w-8 h-8 rounded-md bg-white/10 text-white grid place-items-center border border-white/20"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></span>
                        <div>
                          <div className="font-medium">PDF Document</div>
                          <div className="text-[10px] text-zinc-500">Printable format</div>
                        </div>
                      </button>
                      <button onClick={() => { downloadZIP(); setShowExportMenu(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm text-zinc-200 flex items-center gap-3 transition-colors">
                        <span className="w-8 h-8 rounded-md bg-white/10 text-white grid place-items-center border border-white/20"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg></span>
                        <div>
                          <div className="font-medium">Image ZIP</div>
                          <div className="text-[10px] text-zinc-500">High-res PNGs</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Workspace Canvas */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

          {pages.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center max-w-md text-center border border-white/5 shadow-2xl backdrop-blur-3xl">
              <div className="relative mb-8 group cursor-default">
                <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center relative backdrop-blur-md shadow-inner">
                  <img src={coloringStudioIcon} className="w-16 h-16 object-contain drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500" alt="Studio" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gradient-sleek mb-4 tracking-tight">
                Ready to Create Your Coloring Book?
              </h2>
              <p className="text-base text-white/60 leading-relaxed">
                Configure your book settings on the left and click "Create My Book"
                to generate professional coloring pages ready for KDP.
              </p>
            </div>
          ) : <Book
            pages={pages}
            currentSheetIndex={currentSheetIndex}
            onSheetClick={setCurrentSheetIndex}
            pageSizeId={pageSizeId}
            onImageSelect={handleImageSelect}
            selectedImageIndex={showEditChat ? imageEditChat.selectedImage?.pageIndex : null}
            onDeletePage={handleDeletePage}
          />
          }
        </div>
      </main>
    </div>
    {/* End Main Content Wrapper */}

    {/* Toast Notifications */}
    <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

    {/* Image Edit Chat Panel */}
    <ImageEditChatPanel
      isOpen={showEditChat}
      selectedImage={imageEditChat.selectedImage}
      messages={imageEditChat.messages}
      isLoading={imageEditChat.isLoading}
      currentMask={imageEditChat.currentMask}
      onClose={handleCloseEditChat}
      onSendEdit={imageEditChat.sendEdit}
      onMaskGenerated={imageEditChat.setMask}
      onClearChat={imageEditChat.clearChat}
      onApplyEdit={imageEditChat.applyEdit}
    />

    {BATCH_LOGS_ENABLED && (
      <React.Suspense fallback={<div className="text-white/60 text-sm p-4">Loading logs...</div>}>
        <BatchLogPanel
          isOpen={showBatchLogs}
          onClose={() => setShowBatchLogs(false)}
        />
      </React.Suspense>
    )}
  </div>
);
};
export default App;