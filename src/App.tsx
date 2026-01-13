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

  const handleClear = () => {
    // Cancel any ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Reset all form fields to defaults
    setProjectName("My Coloring Book");
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

  return (
    <div className="dark h-screen w-screen overflow-hidden bg-[hsl(var(--background))] text-white selection:bg-white/30 font-sans flex">
      <div className="aurora-veil" />
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}

      {/* Sidebar - Fixed Left Panel */}
      <div className="w-[400px] flex-shrink-0 h-full flex flex-col border-r border-white/5 bg-[hsl(var(--secondary))]/90 backdrop-blur-xl z-20 shadow-2xl">
        
        {/* Sidebar Header */}
        <div className="h-18 px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 shadow-lg grid place-items-center text-xs font-bold text-black border border-white/10">
              AI
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Studio</div>
              <div className="text-sm font-semibold text-zinc-100">Coloring Book Lab</div>
            </div>
          </div>
          <button
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Lights On' : 'Lights Off'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </button>
        </div>

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
                onLoadProject={handleLoadProject}
                onClear={handleClear}
                // Hide header/footer in Setup component since we handle it here
                embeddedMode={true}
              />
        </div>

        {/* Sidebar Footer - Stats & Actions */}
        <div className="p-6 border-t border-white/5 bg-[hsl(var(--background))]/40 backdrop-blur-md">
            <div className="glass-stat mb-4 border border-white/5 bg-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="label">Pages ready</span>
                <span className={`trend ${progress < 100 && progress > 0 ? '' : 'text-zinc-500'}`}>
                  {progress}% complete
                </span>
              </div>
              <div className="flex items-end justify-between">
                 <span className="value text-2xl text-white">{pages.filter(p => !p.isLoading).length}<span className="text-zinc-600 text-lg">/{pageAmount}</span></span>
                 {isGenerating && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mb-1" />}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              {(isGenerating || (progress > 0 && progress < 100)) ? (
                <button 
                  onClick={handleCancel} 
                  className="w-full py-3 rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/10 font-medium transition-all"
                >
                  Cancel Generation
                </button>
              ) : (
                <button 
                  onClick={handleGenerate}
                  disabled={!userPrompt}
                  className="btn-primary w-full py-3 text-base shadow-lg"
                >
                  Generate Book
                </button>
              )}
            </div>
        </div>
      </div>

      {/* Main Workspace - Flexible Area */}
      <main className="flex-1 h-full relative flex flex-col bg-transparent overflow-hidden">
        
        {/* Workspace Top Bar */}
        <div className="absolute top-6 right-6 z-50 flex gap-4 pointer-events-none">
           <div className="pointer-events-auto flex gap-3">
              <div className="glass-pill border-white/10 bg-[hsl(var(--card))]/80">
                  <span className={`dot ${isGenerating ? 'bg-white animate-pulse' : 'bg-zinc-500'}`} />
                  {isGenerating ? 'Generating...' : 'Ready'}
              </div>
              
              {pages.some(p => !p.isLoading) && (
                <div className="relative">
                   <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="btn-primary w-auto px-5 py-2 text-sm shadow-none border-white/10 bg-white/10 hover:bg-white/20 text-white"
                  >
                    Export
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1"><path d="M6 9l6 6 6-6"/></svg>
                  </button>

                  {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                      <div className="absolute top-full right-0 mt-2 z-50 w-56 bg-[hsl(var(--popover))] border border-white/10 rounded-xl shadow-2xl p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                        <button onClick={() => {downloadPDF(); setShowExportMenu(false);}} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm text-zinc-200 flex items-center gap-3 transition-colors">
                            <span className="w-8 h-8 rounded-md bg-white/10 text-white grid place-items-center border border-white/20"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></span>
                            <div>
                              <div className="font-medium">PDF Document</div>
                              <div className="text-[10px] text-zinc-500">Printable format</div>
                            </div>
                        </button>
                        <button onClick={() => {downloadZIP(); setShowExportMenu(false);}} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm text-zinc-200 flex items-center gap-3 transition-colors">
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
            <div className="text-center text-zinc-500 transition-colors p-8 animate-in fade-in duration-700 flex flex-col items-center max-w-md">
              <div className="w-32 h-32 bg-gradient-to-tr from-white/5 to-transparent rounded-full flex items-center justify-center mb-8 ring-1 ring-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 blur-xl"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/20 relative z-10"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3 tracking-tight">Your Canvas is Empty</h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                Configure your coloring book settings in the sidebar panel. 
                <br />
                When you're ready, click <span className="text-white font-medium">Generate Book</span> to create your masterpiece.
              </p>
            </div>
          ) : (
            <Book 
                pages={pages}
                currentSheetIndex={currentSheetIndex}
                onSheetClick={(idx) => setCurrentSheetIndex(idx)}
                pageSizeId={pageSizeId}
            />
          )}
        </div>
      </main>
    </div>
  );
};
export default App;