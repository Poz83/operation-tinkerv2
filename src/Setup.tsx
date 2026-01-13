/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { PAGE_SIZES, VISUAL_STYLES, TARGET_AUDIENCES, COMPLEXITY_LEVELS } from './types';

interface ToolbarProps {
  projectName: string;
  setProjectName: (v: string) => void;
  pageAmount: number;
  setPageAmount: (v: number) => void;
  pageSize: string;
  setPageSize: (v: string) => void;
  visualStyle: string;
  setVisualStyle: (v: string) => void;
  complexity: string;
  setComplexity: (v: string) => void;
  targetAudience: string;
  setTargetAudience: (v: string) => void;
  userPrompt: string;
  setUserPrompt: (v: string) => void;
  hasHeroRef: boolean;
  setHasHeroRef: (v: boolean) => void;
  heroImage: { base64: string; mimeType: string } | null;
  setHeroImage: (v: { base64: string; mimeType: string } | null) => void;
  isGenerating: boolean;
  isEnhancing?: boolean;
  onEnhancePrompt?: () => void;
  progress: number;
  onGenerate: () => void;
  onCancel?: () => void;
  onDownloadPDF: () => void;
  onDownloadZIP: () => void;
  hasPages: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  includeText: boolean;
  setIncludeText: (v: boolean) => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onClear?: () => void;
  embeddedMode?: boolean;
}

export const Setup: React.FC<ToolbarProps> = (props) => {
  const isPredefinedStyle = VISUAL_STYLES.some(s => s.id === props.visualStyle);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const match = result.match(/^data:(.+);base64,(.+)$/);
        if (match) props.setHeroImage({ mimeType: match[1], base64: match[2] });
      };
      reader.readAsDataURL(file);
    }
  };

  const labelClass = "block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2";

  return (
    <div className={`flex flex-col ${props.embeddedMode ? '' : 'h-full'}`}>
      {/* Header - Only shown if NOT embedded */}
      {!props.embeddedMode && (
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-100 rounded-lg shadow-lg grid place-items-center text-xs font-bold text-black border border-white">
                  AI
              </div>
              <div>
                  <h1 className="font-bold text-base text-white tracking-tight leading-none">Studio</h1>
                  <p className="text-[10px] text-zinc-500 font-medium pt-0.5">ColorCraft AI</p>
              </div>
          </div>
          
          <div className="flex gap-1">
              <button onClick={props.onSaveProject} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Save Project">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              </button>
              <button onClick={props.onLoadProject} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Load Project">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 px-6 py-6 space-y-8 ${props.embeddedMode ? '' : 'overflow-y-auto no-scrollbar'}`}>
        
        {/* Section: Project */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className={labelClass}>Project Name</label>
            {props.onClear && (
              <button 
                onClick={props.onClear}
                className="text-[10px] font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 mb-2 px-2 py-1 hover:bg-white/5 rounded-lg"
                title="Clear all fields and start fresh"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Clear
              </button>
            )}
          </div>
          <div>
            <input 
              type="text" 
              value={props.projectName}
              onChange={(e) => props.setProjectName(e.target.value)}
              className="glass-input font-medium"
              placeholder="Untitled Project"
            />
          </div>
        </div>

        {/* Section: Concept */}
        <div className="space-y-4">
           <div className="flex justify-between items-end">
             <label className={labelClass}>Prompt</label>
             {props.onEnhancePrompt && (
                <button 
                  onClick={props.onEnhancePrompt}
                  disabled={props.isEnhancing || !props.userPrompt}
                  className="text-[10px] font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1 mb-2"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  {props.isEnhancing ? 'Optimizing...' : 'AI Enhance'}
                </button>
             )}
           </div>
           <div className="relative group">
                <textarea
                    value={props.userPrompt}
                    onChange={(e) => props.setUserPrompt(e.target.value)}
                    className="glass-textarea leading-relaxed"
                    placeholder="Describe your coloring page idea in detail..."
                />
                <div className="absolute bottom-2 right-2">
                    <button 
                        onClick={() => props.setHasHeroRef(!props.hasHeroRef)}
                        className={`p-1.5 rounded-lg transition-all ${props.hasHeroRef ? 'bg-zinc-100 text-black shadow-lg' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                        title="Toggle Reference Image"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </button>
                </div>
           </div>
           
           {props.hasHeroRef && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block w-full cursor-pointer group">
                      <div className="w-full h-32 rounded-xl border border-dashed border-white/10 hover:border-white/30 bg-white/5 flex flex-col items-center justify-center transition-all relative overflow-hidden">
                          {props.heroImage ? (
                              <img src={`data:${props.heroImage.mimeType};base64,${props.heroImage.base64}`} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="Hero Ref"/>
                          ) : (
                              <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors flex flex-col items-center gap-2">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                  <span className="text-xs font-medium">Upload Reference</span>
                              </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </div>
                  </label>
              </div>
           )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        {/* Section: Configuration */}
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Style</label>
                  <div className="relative">
                    <select 
                      value={isPredefinedStyle ? props.visualStyle : 'CUSTOM_OPTION'} 
                      onChange={(e) => e.target.value === 'CUSTOM_OPTION' ? props.setVisualStyle('') : props.setVisualStyle(e.target.value)}
                      className="glass-select"
                    >
                      {VISUAL_STYLES.map(s => <option key={s.id} value={s.id} className="bg-zinc-900">{s.label}</option>)}
                      <option value="CUSTOM_OPTION" className="bg-zinc-900">Custom...</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Complexity</label>
                  <select value={props.complexity} onChange={(e) => props.setComplexity(e.target.value)} className="glass-select">
                      {COMPLEXITY_LEVELS.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                  </select>
                </div>
            </div>

            <div>
              <label className={labelClass}>Audience</label>
              <select value={props.targetAudience} onChange={(e) => props.setTargetAudience(e.target.value)} className="glass-select">
                  {TARGET_AUDIENCES.map(a => <option key={a.id} value={a.id} className="bg-zinc-900">{a.label}</option>)}
              </select>
            </div>

            {/* Custom Toggles */}
            <div className="flex items-center justify-between py-1">
                <span className="text-xs font-medium text-zinc-400">Include Text / Labels</span>
                <button 
                  onClick={() => props.setIncludeText(!props.includeText)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${props.includeText ? 'bg-white' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-md transform transition-transform ${props.includeText ? 'translate-x-4 bg-black' : 'translate-x-0 bg-zinc-500'}`} />
                </button>
            </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        {/* Section: Output */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className={labelClass + " mb-0"}>Format</label>
                <div className="flex gap-2 flex-wrap">
                    {PAGE_SIZES.map(s => (
                        <button
                            key={s.id}
                            onClick={() => props.setPageSize(s.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${props.pageSize === s.id ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/20'}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                  <label className={labelClass + " mb-0"}>Page Count</label>
                  <span className="text-xs font-bold text-white">{props.pageAmount} Pages</span>
              </div>
              <input 
                type="range" min={1} max={40} step={1}
                value={props.pageAmount}
                onChange={(e) => props.setPageAmount(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white"
              />
            </div>
        </div>
      </div>

      {/* Footer - Only shown if NOT embedded */}
      {!props.embeddedMode && (
        <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md">
            {props.isGenerating ? (
                <button disabled className="btn-primary opacity-80 cursor-wait flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Creating {Math.round(props.progress)}%</span>
                </button>
            ) : (
              <div className="flex gap-2">
                  {props.onCancel && props.progress > 0 && props.progress < 100 ? (
                      <button onClick={props.onCancel} className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3.5 rounded-xl transition-colors border border-white/5">
                          Cancel
                      </button>
                  ) : null}
                  <button 
                      onClick={props.onGenerate}
                      disabled={!props.userPrompt}
                      className="btn-primary flex-1"
                  >
                      Generate Book
                  </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
};