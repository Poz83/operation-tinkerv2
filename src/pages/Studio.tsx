/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';

import { ColoringPage, PAGE_SIZES, VISUAL_STYLES, TARGET_AUDIENCES, COMPLEXITY_LEVELS } from '../types';
import { Setup } from '../components/Setup';
import { Book } from '../components/Book';
import { useApiKeyContext } from '../context/apiKeyContext';
import { ApiKeyDialog } from '../components/ApiKeyDialog';
import { Navigation } from '../components/Navigation';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useSettings } from '../context/settingsContext';
import { ImageEditChatPanel } from '../components/ImageEditChatPanel';
import { useImageEditChat } from '../hooks/useImageEditChat';
import { SummaryCard } from '../components/SummaryCard';
import { useProject } from '../hooks/useProject';
import { useGeneration } from '../hooks/useGeneration';

const App: React.FC = () => {
  const { hasApiKey } = useApiKeyContext();
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const toast = useToast();
  const { settings, toggleTheme } = useSettings();

  // Central Page State (Shared Source of Truth)
  const [pages, setPages] = useState<ColoringPage[]>([]);

  // Validation Helper
  const validateApiKey = useCallback(() => {
    if (!hasApiKey) {
      setShowApiKeyDialog(true);
      return false;
    }
    return true;
  }, [hasApiKey]);

  const handleApiKeyDialogContinue = () => {
    setShowApiKeyDialog(false);
  };

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, emoji?: string) => {
    switch (type) {
      case 'success': toast.success(message, emoji); break;
      case 'error': toast.error(message, emoji); break;
      case 'warning': toast.warning(message, emoji); break;
      case 'info': toast.info(message, emoji); break;
    }
  }, [toast]);

  // --- Hooks Initialization ---

  // Ref to avoid circular dependency for userPrompt setter
  const userPromptSetterRef = useRef<((s: string) => void) | null>(null);

  const generation = useGeneration({
    apiKey: hasApiKey ? 'valid' : null, // Hook just checks truthiness of apiKey usually or we pass check
    validateApiKey,
    settings,
    showToast,
    setPages,
    setUserPrompt: (s: string) => userPromptSetterRef.current?.(s),
  });

  const project = useProject(
    pages,
    setPages,
    generation.isGenerating,
    showToast
  );

  // Link the ref
  useEffect(() => {
    userPromptSetterRef.current = project.setUserPrompt;
  }, [project.setUserPrompt]);

  // --- UI State ---
  const [showEditChat, setShowEditChat] = useState(false);
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);

  // Smart Export Handler
  const handleExport = useCallback(async (format: 'png' | 'pdf') => {
    const finishedPages = pages.filter(p => p.imageUrl && !p.isLoading);
    if (finishedPages.length === 0) return;

    const safeProjectName = (project.projectName || 'coloring_book')
      .slice(0, 30)
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase();

    if (format === 'pdf') {
      if (finishedPages.length === 1) {
        // Single page PDF - download directly
        const { jsPDF } = await import('jspdf');
        const sizeConfig = PAGE_SIZES.find(s => s.id === project.pageSizeId) || PAGE_SIZES[1];
        const width = sizeConfig.width * 25.4;
        const height = sizeConfig.height * 25.4;
        const doc = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [width, height]
        });
        const margin = 6.35; // 0.25" for KDP
        doc.addImage(finishedPages[0].imageUrl!, 'PNG', margin, margin, width - margin * 2, height - margin * 2, undefined, 'NONE');
        doc.save(`${safeProjectName}.pdf`);
      } else {
        // Multiple pages PDF - ZIP them
        const { jsPDF } = await import('jspdf');
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const sizeConfig = PAGE_SIZES.find(s => s.id === project.pageSizeId) || PAGE_SIZES[1];
        const width = sizeConfig.width * 25.4;
        const height = sizeConfig.height * 25.4;
        const margin = 6.35;

        // Create individual PDFs for each page
        for (const page of finishedPages) {
          const doc = new jsPDF({
            orientation: width > height ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [width, height]
          });
          doc.addImage(page.imageUrl!, 'PNG', margin, margin, width - margin * 2, height - margin * 2, undefined, 'NONE');
          const pdfBlob = doc.output('blob');
          const fileName = page.isCover ? `00_cover.pdf` : `${String(page.pageIndex + 1).padStart(2, '0')}_page.pdf`;
          zip.file(fileName, pdfBlob);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeProjectName}_pdfs.zip`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } else {
      // PNG format
      if (finishedPages.length === 1) {
        // Single PNG - download directly
        const link = document.createElement('a');
        link.href = finishedPages[0].imageUrl!;
        link.download = `${safeProjectName}.png`;
        link.click();
      } else {
        // Multiple PNGs - ZIP them
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        finishedPages.forEach((page) => {
          if (page.imageUrl) {
            const data = page.imageUrl.split(',')[1];
            const fileName = page.isCover ? `00_cover.png` : `${String(page.pageIndex + 1).padStart(2, '0')}_page.png`;
            zip.file(fileName, data, { base64: true });
          }
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeProjectName}_images.zip`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    }

    setShowExportModal(false);
    showToast('success', `Exported ${finishedPages.length} page${finishedPages.length > 1 ? 's' : ''} as ${format.toUpperCase()}!`, '📥');
  }, [pages, project.projectName, project.pageSizeId, showToast]);

  // KDP Export Handler - Creates single combined PDF optimized for Amazon KDP
  const handleExportKDP = useCallback(async () => {
    const finishedPages = pages.filter(p => p.imageUrl && !p.isLoading);
    if (finishedPages.length === 0) return;

    const safeProjectName = (project.projectName || 'coloring_book')
      .slice(0, 30)
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase();

    const { jsPDF } = await import('jspdf');
    const sizeConfig = PAGE_SIZES.find(s => s.id === project.pageSizeId) || PAGE_SIZES[1];
    const width = sizeConfig.width * 25.4;  // inches to mm
    const height = sizeConfig.height * 25.4;

    // KDP-compliant margins: 0.25" = 6.35mm on all sides
    const margin = 6.35;

    const doc = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height]
    });

    // Add all pages - NO metadata/recipe page for KDP
    finishedPages.forEach((page, index) => {
      if (index > 0) {
        doc.addPage([width, height], width > height ? 'landscape' : 'portrait');
      }

      if (page.imageUrl) {
        // Content within safe margins (no bleed)
        doc.addImage(
          page.imageUrl,
          'PNG',
          margin,
          margin,
          width - margin * 2,
          height - margin * 2,
          undefined,
          'NONE'  // Lossless compression for print quality
        );
      }
    });

    // Set PDF metadata
    doc.setProperties({
      title: project.projectName || 'Coloring Book',
      creator: 'Operation Tinker',
    });

    doc.save(`${safeProjectName}_${finishedPages.length}pages.pdf`);
    setShowExportModal(false);
    showToast('success', `Exported ${finishedPages.length} pages for Amazon KDP!`, '📚');
  }, [pages, project.projectName, project.pageSizeId, showToast]);

  // Image Edit Chat
  const handleImageEdited = useCallback((pageIndex: number, newImageUrl: string, isNewVersion: boolean) => {
    if (isNewVersion) {
      const newPage: ColoringPage = {
        id: `edited-${Date.now()}`,
        imageUrl: newImageUrl,
        prompt: `Edited version of page ${pageIndex + 1}`,
        isLoading: false,
        pageIndex: pages.length,
        status: 'complete',
      };
      setPages(prev => [...prev, newPage]);
      toast.success('Edit complete! New version added.', '✨');
    } else {
      setPages(prev => prev.map(p =>
        p.pageIndex === pageIndex ? { ...p, imageUrl: newImageUrl } : p
      ));
    }
  }, [pages.length, toast]);

  const imageEditChat = useImageEditChat(handleImageEdited);

  const handleImageSelect = useCallback((imageUrl: string, pageIndex: number) => {
    imageEditChat.setSelectedImage(imageUrl, pageIndex);
    setShowEditChat(true);
  }, [imageEditChat]);

  const handleDeletePage = useCallback((targetPageIndex: number) => {
    setPages(currentPages => {
      const kept = currentPages.filter(p => p.pageIndex !== targetPageIndex);
      const reindexed = kept.map((p, i) => ({ ...p, pageIndex: i }));
      if (currentSheetIndex >= reindexed.length) {
        setCurrentSheetIndex(Math.max(0, reindexed.length - 1));
      }
      return reindexed;
    });
    toast.success('Page deleted', '🗑️');
  }, [currentSheetIndex, toast]);

  // Wrappers for UI interactions
  const onGenerateClick = async () => {
    const valid = await validateApiKey();
    if (!valid) return;

    if (settings.enableSummaryCard) {
      setShowSummaryCard(true);
    } else {
      handleStartGeneration();
    }
  };

  const handleStartGeneration = () => {
    generation.startGeneration({
      projectName: project.projectName,
      userPrompt: project.userPrompt,
      pageAmount: project.pageAmount,
      pageSizeId: project.pageSizeId,
      visualStyle: project.visualStyle,
      complexity: project.complexity,
      targetAudienceId: project.targetAudienceId,
      hasHeroRef: project.hasHeroRef,
      heroImage: project.heroImage,
      includeText: project.includeText,
      creativeVariation: project.creativeVariation
    });
  };

  const handleEnhance = () => {
    generation.handleEnhancePrompt(project.userPrompt, project.pageAmount);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (!settings.enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === 'Enter' && project.userPrompt && !generation.isGenerating) {
        e.preventDefault();
        onGenerateClick();
      }
      if (isMod && e.key === 'e' && project.userPrompt && !generation.isEnhancing) {
        e.preventDefault();
        handleEnhance();
      }
      if (isMod && e.key === 'n') {
        e.preventDefault();
        project.handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.enableKeyboardShortcuts, project.userPrompt, generation.isGenerating, generation.isEnhancing]);

  // Derived Progress Calculation
  const { completedPages, totalPages, derivedProgress } = useMemo(() => {
    const total = pages.length || project.pageAmount;
    const completed = pages.filter(p => !p.isLoading).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completedPages: completed, totalPages: total, derivedProgress: percent };
  }, [pages, project.pageAmount]);

  const displayProgress = generation.isGenerating ? Math.max(generation.progress, derivedProgress) : derivedProgress;

  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "never"}>
      <div className="h-screen w-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-[hsl(var(--primary))]/30 font-sans flex flex-col">
        <div className="aurora-veil opacity-50 dark:opacity-100 transition-opacity duration-500" />
        {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}

        <Navigation />

        <div className="flex flex-1 pt-16 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[400px] flex-shrink-0 flex flex-col bg-[hsl(var(--card))]/30 backdrop-blur-xl border-r border-[hsl(var(--border))] z-20 shadow-2xl overflow-hidden text-[hsl(var(--foreground))]">

            <div className="flex-1 overflow-y-auto no-scrollbar relative">
              <Setup
                projectName={project.projectName}
                setProjectName={project.setProjectName}
                pageAmount={project.pageAmount}
                setPageAmount={project.setPageAmount}
                pageSize={project.pageSizeId}
                setPageSize={project.setPageSizeId}
                visualStyle={project.visualStyle}
                setVisualStyle={project.setVisualStyle}
                complexity={project.complexity}
                setComplexity={project.setComplexity}
                targetAudience={project.targetAudienceId}
                setTargetAudience={project.setTargetAudienceId}
                userPrompt={project.userPrompt}
                setUserPrompt={project.setUserPrompt}
                hasHeroRef={project.hasHeroRef}
                setHasHeroRef={project.setHasHeroRef}
                heroImage={project.heroImage}
                setHeroImage={project.setHeroImage}
                isGenerating={generation.isGenerating}
                isEnhancing={generation.isEnhancing}
                onEnhancePrompt={handleEnhance}
                progress={generation.progress}
                onGenerate={onGenerateClick}
                onCancel={generation.handleCancel}

                onDownloadPDF={() => generation.downloadPDF(pages, {
                  projectName: project.projectName,
                  visualStyle: project.visualStyle,
                  complexity: project.complexity,
                  targetAudienceId: project.targetAudienceId,
                  pageSizeId: project.pageSizeId,
                  userPrompt: project.userPrompt
                })}
                onDownloadZIP={() => generation.downloadZIP(pages, project.projectName)}

                hasPages={pages.some(p => !p.isLoading)}
                isDarkMode={settings.theme === 'dark'}
                toggleDarkMode={toggleTheme}
                includeText={project.includeText}
                setIncludeText={project.setIncludeText}
                onSaveProject={project.handleSaveProject}
                onLoadProject={() => { }} // Vault handles this
                onClear={project.handleClear}
                showToast={showToast}
                embeddedMode={true}
                creativeVariation={project.creativeVariation}
                setCreativeVariation={project.setCreativeVariation}
                visibility={project.visibility}
                setVisibility={project.setVisibility}
              />
            </div>

            <div className="flex-shrink-0 p-6 border-t border-[hsl(var(--border))] bg-transparent z-10">
              <div className="flex flex-col gap-3">
                {(generation.isGenerating || (displayProgress > 0 && displayProgress < 100)) ? (
                  <button
                    onClick={generation.handleCancel}
                    className="w-full py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/40 font-medium transition-all"
                  >
                    Stop Creating
                  </button>
                ) : (
                  <button
                    id="generate-btn"
                    onClick={onGenerateClick}
                    disabled={!project.userPrompt}
                    className="w-full py-3 rounded-xl btn-primary text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 group"
                  >
                    {!project.userPrompt ? 'Describe your idea first...' : '✨ Create Coloring Book'}
                    {project.userPrompt && <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-hidden relative bg-[hsl(var(--background))]">
            <Book
              pages={pages}
              activePage={generation.activePageNumber}
              onSheetClick={setCurrentSheetIndex}
              onImageSelect={handleImageSelect}
              isGenerating={generation.isGenerating}
              currentSheetIndex={currentSheetIndex}
              setCurrentSheetIndex={setCurrentSheetIndex}
              onDeletePage={handleDeletePage}
            />

            {showSummaryCard && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <SummaryCard
                  settings={{
                    prompt: project.userPrompt,
                    styleId: project.visualStyle,
                    complexity: project.complexity,
                    audienceId: project.targetAudienceId,
                    pageAmount: project.pageAmount,
                    pageSizeId: project.pageSizeId
                  }}
                  onConfirm={() => {
                    setShowSummaryCard(false);
                    handleStartGeneration();
                  }}
                  onCancel={() => setShowSummaryCard(false)}
                />
              </div>
            )}
          </div>

          {/* Right Toolbar - Always Visible */}
          <div className="w-16 flex-shrink-0 flex flex-col items-center py-6 gap-4 bg-[hsl(var(--card))]/30 backdrop-blur-xl border-l border-[hsl(var(--border))]">
            {/* Magic Edit Button */}
            <button
              onClick={() => {
                if (pages.some(p => !p.isLoading)) {
                  const firstCompletePage = pages.find(p => !p.isLoading);
                  if (firstCompletePage) {
                    handleImageSelect(firstCompletePage.imageUrl, firstCompletePage.pageIndex);
                  }
                }
              }}
              disabled={!pages.some(p => !p.isLoading)}
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

            <div className="w-8 h-px bg-[hsl(var(--border))]"></div>

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              disabled={!pages.some(p => !p.isLoading)}
              className="w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] hover:bg-[hsl(var(--muted))]/20 disabled:opacity-40 disabled:cursor-not-allowed group"
              title="Export"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span className="text-[8px] font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]">Export</span>
            </button>
          </div>
        </div>

        <ToastContainer />

        {showEditChat && (
          <ImageEditChatPanel
            onClose={() => setShowEditChat(false)}
            imageEditChat={imageEditChat}
          />
        )}

        {/* Export Format Modal */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Export Your Work</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 rounded-lg hover:bg-[hsl(var(--muted))]/20 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                Choose your export format. {pages.filter(p => !p.isLoading && p.imageUrl).length > 1
                  ? 'Files will be zipped together.'
                  : 'Single file will download directly.'}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* PNG Option */}
                <button
                  onClick={() => handleExport('png')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 hover:bg-[hsl(var(--card))] hover:border-[hsl(var(--ring))] transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-[hsl(var(--foreground))]">PNG Images</div>
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))]">High quality images</div>
                  </div>
                </button>

                {/* PDF Option */}
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 hover:bg-[hsl(var(--card))] hover:border-[hsl(var(--ring))] transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-[hsl(var(--foreground))]">PDF Documents</div>
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Ready to print</div>
                  </div>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[hsl(var(--border))]"></div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-medium">Or publish to</span>
                <div className="flex-1 h-px bg-[hsl(var(--border))]"></div>
              </div>

              {/* KDP Export Button */}
              <button
                onClick={handleExportKDP}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-amber-500/5 hover:from-orange-500/10 hover:to-amber-500/10 hover:border-orange-500/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-500">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-[hsl(var(--foreground))]">Export for Amazon KDP</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Combined PDF • 0.25" margins • Print-ready</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[hsl(var(--muted-foreground))] group-hover:text-orange-500 group-hover:translate-x-1 transition-all ml-auto">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
};

export default App;