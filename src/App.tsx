/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { PAGE_SIZES, VISUAL_STYLES, TARGET_AUDIENCES, COMPLEXITY_LEVELS, ColoringPage } from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { processGeneration } from './server/jobs/process-generation';
import { brainstormPrompt } from './services/geminiService';
import { generateColoringBookPDF } from './utils/pdf-generator';

const App: React.FC = () => {
  const { validateApiKey, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  // Toolbar State
  const [projectName, setProjectName] = useState("My Coloring Book");
  const [pageAmount, setPageAmount] = useState(5);
  const [pageSizeId, setPageSizeId] = useState(PAGE_SIZES[0].id);
  const [visualStyle, setVisualStyle] = useState(VISUAL_STYLES[0].id);
  const [complexity, setComplexity] = useState(COMPLEXITY_LEVELS[1]); // Default to 'Simple'
  const [targetAudienceId, setTargetAudienceId] = useState(TARGET_AUDIENCES[0].id);
  const [userPrompt, setUserPrompt] = useState("");
  const [hasHeroRef, setHasHeroRef] = useState(false);
  const [heroImage, setHeroImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [includeText, setIncludeText] = useState(false);
  
  // App State
  const [pages, setPages] = useState<ColoringPage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

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

      await processGeneration(
        {
          userIdea: userPrompt,
          pageCount: pageAmount,
          audience: TARGET_AUDIENCES.find(a => a.id === targetAudienceId)?.label || "General",
          style: visualStyle,
          complexity: complexity,
          hasHeroRef: hasHeroRef,
          heroImage: (hasHeroRef && heroImage) ? heroImage : undefined,
          aspectRatio: aspectRatio,
          includeText: includeText,
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
              pageIndex: item.pageNumber 
            });
          });

          setPages(newPages);
          totalTasks = newPages.length;
        },
        // 2. On Page Complete
        (pageNumber, imageUrl) => {
          setPages(prev => prev.map(p => p.pageIndex === pageNumber ? { ...p, imageUrl, isLoading: false } : p));
          updateProgress();
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

  const downloadPDF = () => {
    // Resolve human-readable labels for the receipt
    const styleLabel = VISUAL_STYLES.find(s => s.id === visualStyle)?.label || visualStyle;
    const audienceLabel = TARGET_AUDIENCES.find(a => a.id === targetAudienceId)?.label || targetAudienceId;

    // Sanitize the project name to make a safe filename
    const safeTitle = projectName
        .slice(0, 30)                // Limit length
        .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric with _
        .replace(/_+/g, '_')         // Remove duplicate _
        .toLowerCase() || 'coloring_book';

    const filename = `${safeTitle}_${Date.now()}.pdf`;

    generateColoringBookPDF(
        pages, 
        projectName, 
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
    const zip = new JSZip();
    const finishedPages = pages.filter(p => p.imageUrl);
    
    finishedPages.forEach((page) => {
       if (page.imageUrl) {
           const data = page.imageUrl.split(',')[1];
           const fileName = page.isCover 
              ? `00_cover.png` 
              : `${String(page.pageIndex).padStart(2, '0')}_page.png`;
           
           zip.file(fileName, data, {base64: true});
       }
    });
    
    const content = await zip.generateAsync({type:"blob"});
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '-')}_images.zip`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveProject = () => {
    const projectConfig = {
      projectName,
      pageAmount,
      pageSizeId,
      visualStyle,
      complexity,
      targetAudienceId,
      userPrompt,
      hasHeroRef,
      heroImage, // This might be large
      includeText
    };
    try {
      const serialized = JSON.stringify(projectConfig);
      // Check for rough size limit (5MB safety margin)
      if (serialized.length > 4500000) { 
          // Try saving without image
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { heroImage, ...rest } = projectConfig;
          localStorage.setItem('coloring_book_config', JSON.stringify(rest));
          alert("Project saved, but the reference image was too large to store.");
      } else {
          localStorage.setItem('coloring_book_config', serialized);
          alert("Project configuration saved to browser storage.");
      }
    } catch (e) {
      console.error(e);
      alert("Could not save project. Storage quota exceeded.");
    }
  };

  const handleLoadProject = () => {
    try {
      const saved = localStorage.getItem('coloring_book_config');
      if (!saved) {
        alert("No saved project found.");
        return;
      }
      const config = JSON.parse(saved);
      
      if (config.projectName) setProjectName(config.projectName);
      if (config.pageAmount) setPageAmount(config.pageAmount);
      if (config.pageSizeId) setPageSizeId(config.pageSizeId);
      if (config.visualStyle) setVisualStyle(config.visualStyle);
      if (config.complexity) setComplexity(config.complexity);
      if (config.targetAudienceId) setTargetAudienceId(config.targetAudienceId);
      if (config.userPrompt) setUserPrompt(config.userPrompt);
      if (config.hasHeroRef !== undefined) setHasHeroRef(config.hasHeroRef);
      if (config.heroImage) setHeroImage(config.heroImage);
      if (config.includeText !== undefined) setIncludeText(config.includeText);
      
      alert("Project loaded successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to load project configuration.");
    }
  };

  return (
    <div className="dark h-screen w-screen overflow-hidden bg-[#05060a] text-white selection:bg-indigo-500/30 font-sans relative">
      <div className="aurora-veil" />
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}

      {/* Floating top nav */}
      <header className="glass-navbar">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-900/40 grid place-items-center text-sm font-bold">
              AI
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.18em] text-zinc-400">Studio</div>
              <div className="text-base font-semibold">Coloring Book Lab</div>
            </div>
          </div>
          <div className="nav-links">
            <span className="glass-pill">
              <span className="dot" />
              {isGenerating ? 'Generating' : 'Idle'}
            </span>
            <button
              className="btn-ghost"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? 'Lights On' : 'Lights Off'}
            </button>
          </div>
        </div>
      </header>

      <main className="relative h-[calc(100vh-72px)] px-6 py-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-25 pointer-events-none" />

        <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-6">
          
          {/* Floating control panel */}
          <div className="glass-card h-[calc(100vh-120px)] overflow-hidden flex flex-col border border-white/10">
            <div className="card-header">
              <div className="card-title">Project Controls</div>
              <div className="glass-chip is-success">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                Synced
              </div>
            </div>
            <div className="card-body flex-1 overflow-y-auto no-scrollbar pr-1">
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
                onLoadProject={handleLoadProject}
              />
            </div>
            <hr className="glass-divider" />
            <div className="card-footer justify-between">
              <div className="glass-stat">
                <span className="label">Pages ready</span>
                <span className="value">{pages.filter(p => !p.isLoading).length}/{pageAmount}</span>
                <span className={`trend ${progress < 100 ? '' : 'is-down'}`}>
                  {progress}% complete
                </span>
              </div>
              <div className="glass-chip is-danger cursor-pointer" onClick={handleCancel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                Cancel
              </div>
            </div>
          </div>

          {/* Floating workspace panel */}
          <div className="glass-card relative h-[calc(100vh-120px)] overflow-hidden flex flex-col border border-white/10">
            <div className="card-header justify-between">
              <div>
                <div className="glass-pill mb-2">
                  <span className="dot" />
                  Workspace
                </div>
                <div className="card-title">Preview & Exports</div>
                <div className="card-subtitle">Your book pages float above the aurora grid.</div>
              </div>
              {pages.some(p => !p.isLoading) && (
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="btn-primary w-auto px-4 py-2 text-sm"
                >
                  Export
                </button>
              )}
            </div>

            <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/30 border border-white/5">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

              {pages.length === 0 ? (
                <div className="text-center text-zinc-500 transition-colors p-8 animate-in fade-in duration-700 flex flex-col items-center">
                  <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </div>
                  <h2 className="text-xl font-medium text-zinc-200 mb-2">Floating workspace ready</h2>
                  <p className="text-sm text-zinc-500 max-w-md">Configure your book settings on the left and click Generate to see pages materialize here.</p>
                </div>
              ) : (
                <Book 
                    pages={pages}
                    currentSheetIndex={currentSheetIndex}
                    onSheetClick={(idx) => setCurrentSheetIndex(idx)}
                    pageSizeId={pageSizeId}
                />
              )}

              {/* Export menu */}
              {pages.some(p => !p.isLoading) && showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute top-6 right-6 z-50 w-60 bg-[#0f1016]/95 border border-white/10 rounded-2xl shadow-2xl p-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    <button onClick={() => {downloadPDF(); setShowExportMenu(false);}} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm text-zinc-200 flex items-center gap-3 transition-colors">
                        <span className="glass-chip is-danger"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>PDF</span>
                        PDF Document
                    </button>
                    <button onClick={() => {downloadZIP(); setShowExportMenu(false);}} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm text-zinc-200 flex items-center gap-3 transition-colors">
                        <span className="glass-chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>ZIP</span>
                        Image ZIP
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default App;