
import React, { useState, useEffect } from 'react';
import { PAGE_SIZES, VISUAL_STYLES, TARGET_AUDIENCES, COMPLEXITY_LEVELS, CREATIVE_VARIATION_OPTIONS, CINEMATIC_OPTIONS, VISIBILITY_OPTIONS, CreativeVariation, StyleReference, ALLOWED_REFERENCE_TYPES, MAX_STYLE_REFERENCES } from '../types';
import { QualityTier, QUALITY_TIERS } from '../server/ai/QualityTiers';
import joeMascot from '../assets/joe-mascot.png';
import magicWandIcon from '../assets/magic-wand.png';
import saveIcon from '../assets/save-icon.png';
import loadIcon from '../assets/load-icon.png';
import { useSettings } from '../context/settingsContext';
import { StyleSelector } from './StyleSelector';
import { PromptQuality } from './PromptQuality';

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
  autoConsistency: boolean;
  setAutoConsistency: (enabled: boolean) => void;
  heroPresence: number; // 0-100
  setHeroPresence: (v: number) => void;
  cinematics: string;
  setCinematics: (v: string) => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onClear?: () => void;
  embeddedMode?: boolean;
  showToast?: (type: 'success' | 'error' | 'warning' | 'info', message: string, emoji?: string) => void;
  creativeVariation: CreativeVariation;
  setCreativeVariation: (v: CreativeVariation) => void;
  visibility?: 'private' | 'unlisted' | 'public';
  setVisibility?: (v: 'private' | 'unlisted' | 'public') => void;
  styleReferences: StyleReference[];
  setStyleReferences: (v: StyleReference[]) => void;
  onPreviewPrompt?: () => void;
  qualityTier: QualityTier;
  setQualityTier: (v: QualityTier) => void;
  userEmail?: string;
}

export const Setup: React.FC<ToolbarProps> = (props) => {
  const { settings } = useSettings();
  const isPredefinedStyle = VISUAL_STYLES.some(s => s.id === props.visualStyle);
  const [showCostWarning, setShowCostWarning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);

  // Load recent prompts
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recent_prompts');
      if (saved) {
        setRecentPrompts(JSON.parse(saved));
      }
    } catch (e) { /* skip - non-critical localStorage read */ }
  }, []);
  useEffect(() => {
    if (!settings.enableSmartDefaults || !props.userPrompt) return;

    const lower = props.userPrompt.toLowerCase();

    // Auto-detect style
    if (lower.includes('mandala')) props.setVisualStyle('Mandala');
    else if (lower.includes('stained glass')) props.setVisualStyle('Gothic');
    else if (lower.includes('geometric') || lower.includes('low poly')) props.setVisualStyle('Geometric');
    else if (lower.includes('flower') || lower.includes('floral')) props.setVisualStyle('Floral');
    else if (lower.includes('cute') || lower.includes('kawaii')) props.setVisualStyle('Kawaii');

    // Auto-detect audience
    if (lower.includes('simple') || lower.includes('toddler')) props.setTargetAudience('toddlers');
    else if (lower.includes('complex') || lower.includes('adult')) props.setTargetAudience('adults');
  }, [props.userPrompt, settings.enableSmartDefaults]);

  // Handle generate click with cost warning for 4K resolution
  const handleGenerateClick = () => {
    // Save to history if enabled
    if (settings.enableRecentPrompts && props.userPrompt) {
      try {
        const unique = Array.from(new Set([props.userPrompt, ...recentPrompts])).slice(0, 10);
        setRecentPrompts(unique);
        localStorage.setItem('recent_prompts', JSON.stringify(unique));
      } catch (e) {
        /* skip - non-critical localStorage write */
      }
    }

    const highCostLevels = ['Intricate', 'Extreme Detail'];
    if (highCostLevels.includes(props.complexity)) {
      setShowCostWarning(true);
    } else {
      props.onGenerate();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        if (props.showToast) {
          props.showToast('error', 'Oops! Please pick an image file first.', '🖼️');
        }
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

  const labelClass = "block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2";

  return (
    <>
      {/* 4K Cost Warning Modal */}
      {showCostWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Just a Heads Up! 💰</h3>
                <p className="text-zinc-400 text-sm">Higher quality, higher cost</p>
              </div>
            </div>

            <p className="text-[hsl(var(--muted-foreground))] text-sm mb-6 leading-relaxed">
              Your <strong className="text-amber-400">{props.complexity}</strong> detail level creates super high-resolution images
              (4K quality). This uses <strong className="text-amber-400">4x more API credits</strong> than standard quality.
              <br /><br />
              Still want the best? Let's go!
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCostWarning(false)}
                className="flex-1 px-4 py-2.5 rounded-xl btn-secondary text-[hsl(var(--foreground))] font-medium transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setShowCostWarning(false);
                  props.onGenerate();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-medium transition-colors"
              >
                Yes, Create It!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex flex-col ${props.embeddedMode ? '' : 'h-full'}`}>
        {/* Header - Only shown if NOT embedded */}
        {!props.embeddedMode && (
          <div className="px-6 py-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={joeMascot} className="w-12 h-12 object-contain drop-shadow hover:rotate-6 transition-transform duration-300" alt="Joe" />
              <div>
                <h1 className="font-bold text-base text-[hsl(var(--foreground))] tracking-tight leading-none">Coloring Lab</h1>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium pt-0.5">Creative Studio</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={props.onSaveProject} className="p-2 hover:bg-[hsl(var(--muted))]/20 rounded-lg transition-colors group" title="Save your work">
                <img src={saveIcon} className="w-5 h-5 object-contain opacity-70 group-hover:opacity-100 transition-opacity" alt="Save" />
              </button>
              <button onClick={props.onLoadProject} className="p-2 hover:bg-[hsl(var(--muted))]/20 rounded-lg transition-colors group" title="Open a saved project">
                <img src={loadIcon} className="w-5 h-5 object-contain opacity-70 group-hover:opacity-100 transition-opacity" alt="Load" />
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
                  id="clear-btn"
                  onClick={props.onClear}
                  className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors flex items-center gap-1.5 mb-2 px-2 py-1 hover:bg-[hsl(var(--muted))]/20 rounded-lg border border-transparent hover:border-[hsl(var(--border))]"
                  title="Reset everything"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  Start Fresh
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {/* Visibility Selector */}
              {props.visibility && props.setVisibility && (
                <div className="w-1/3">
                  <select
                    value={props.visibility}
                    onChange={(e) => props.setVisibility?.(e.target.value as any)}
                    className="glass-select text-xs py-2 bg-[hsl(var(--card))]"
                    title="Project Visibility"
                  >
                    {VISIBILITY_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id} className="bg-[hsl(var(--card))]">
                        {opt.label === 'Private' ? '🔒' : opt.label === 'Unlisted' ? '🔗' : '🌍'} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <input
                type="text"
                value={props.projectName}
                onChange={(e) => props.setProjectName(e.target.value)}
                className="glass-input font-medium flex-1"
                placeholder="Project Name..."
              />
            </div>

            {/* Page Count - Moved here for logical flow */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className={labelClass + " mb-0"}>How Many Pages?</label>
                <span className="text-xs font-bold text-[hsl(var(--foreground))]">{props.pageAmount} page{props.pageAmount !== 1 ? 's' : ''}</span>
              </div>
              <input
                type="range" min={1} max={40} step={1}
                value={props.pageAmount}
                onChange={(e) => props.setPageAmount(parseInt(e.target.value))}
                className="glass-slider"
              />
            </div>

            {/* Quality Tier Toggle */}
            {(() => {
              const canUseSwift = props.userEmail?.toLowerCase() === 'jamie@myjoe.app';
              return (
                <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  props.qualityTier === 'swift'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-[hsl(var(--card))]/50 border-[hsl(var(--border))]'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium flex items-center gap-2">
                      {props.qualityTier === 'swift' ? '⚡ Swift Mode' : '🎯 Studio Mode'}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {props.qualityTier === 'swift' ? 'Fast generation' : 'Premium quality'}
                    </span>
                  </div>
                  <button
                    onClick={() => canUseSwift && props.setQualityTier(props.qualityTier === 'swift' ? 'studio' : 'swift')}
                    disabled={!canUseSwift}
                    title={!canUseSwift ? 'Swift mode coming soon' : undefined}
                    className={`relative w-11 h-6 transition-colors rounded-full ${
                      !canUseSwift
                        ? 'bg-[hsl(var(--muted))] opacity-50 cursor-not-allowed'
                        : props.qualityTier === 'swift'
                          ? 'bg-amber-500'
                          : 'bg-[hsl(var(--muted))]'
                    }`}
                  >
                    <span className={`absolute left-1 top-1 w-4 h-4 transition-transform rounded-full bg-white ${
                      props.qualityTier === 'swift' ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Section: Configuration (Moved FIRST for Wizard Flow) */}
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Who's This For?</label>
              <select value={props.targetAudience} onChange={(e) => props.setTargetAudience(e.target.value)} className="glass-select">
                {TARGET_AUDIENCES.map(a => <option key={a.id} value={a.id} className="bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">{a.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Visual Vibe</label>
                {settings.enableStylePreviews ? (
                  <StyleSelector
                    value={props.visualStyle}
                    onChange={props.setVisualStyle}
                    isOpen={showStyleSelector}
                    onToggle={() => setShowStyleSelector(!showStyleSelector)}
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={isPredefinedStyle ? props.visualStyle : 'CUSTOM_OPTION'}
                      onChange={(e) => e.target.value === 'CUSTOM_OPTION' ? props.setVisualStyle('') : props.setVisualStyle(e.target.value)}
                      className="glass-select"
                    >
                      {VISUAL_STYLES.map(s => <option key={s.id} value={s.id} className="bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">{s.label}</option>)}
                      <option value="CUSTOM_OPTION" className="bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">Custom...</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="relative group">
                <label className={labelClass}>Detail Level</label>
                <select value={props.complexity} onChange={(e) => props.setComplexity(e.target.value)} className="glass-select">
                  {COMPLEXITY_LEVELS.map(c => <option key={c.id} value={c.id} className="bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">{c.label}</option>)}
                </select>
                {/* Tooltip on hover */}
                <div className="absolute left-0 right-0 -bottom-1 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="bg-zinc-900 text-zinc-200 text-[10px] px-2 py-1.5 rounded-lg shadow-lg border border-zinc-700 mt-1">
                    {COMPLEXITY_LEVELS.find(c => c.id === props.complexity)?.tooltip}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[hsl(var(--border))] to-transparent"></div>

          {/* Section: Concept (Moved AFTER Configuration) */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className={labelClass}>What Should We Create?</label>
              <div className="flex gap-2">
                {settings.enableRecentPrompts && (
                  <div className="relative">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors flex items-center gap-1.5 mb-2 px-2 py-1 hover:bg-[hsl(var(--muted))]/20 rounded-lg border border-transparent hover:border-[hsl(var(--border))]"
                      title="Recent Prompts"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                      History
                    </button>

                    {showHistory && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowHistory(false)} />
                        <div className="absolute right-0 top-8 z-40 w-64 bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-200">
                          <div className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase px-2 py-1 mb-1">Recent Prompts</div>
                          {recentPrompts.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                              {recentPrompts.map((p, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    props.setUserPrompt(p);
                                    setShowHistory(false);
                                  }}
                                  className="w-full text-left text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/20 p-2 rounded-lg transition-colors truncate"
                                  title={p}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-[hsl(var(--muted-foreground))] p-2 italic">No history yet.</div>
                          )}
                          <div className="border-t border-[hsl(var(--border))] mt-2 pt-1">
                            <button
                              onClick={() => {
                                setRecentPrompts([]);
                                localStorage.removeItem('recent_prompts');
                              }}
                              className="w-full text-left text-[10px] text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              Clear History
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {props.onEnhancePrompt && (
                  <button
                    id="enhance-btn"
                    onClick={props.onEnhancePrompt}
                    disabled={props.isEnhancing || !props.userPrompt}
                    className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors disabled:opacity-50 flex items-center gap-1.5 mb-2 group"
                  >
                    <img src={magicWandIcon} className={`w-4 h-4 object-contain ${props.isEnhancing ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`} alt="Magic" />
                    {props.isEnhancing ? 'Enhancing...' : 'Make It Better'}
                  </button>
                )}
              </div>
            </div>
            <div className="relative group">
              <textarea
                value={props.userPrompt}
                onChange={(e) => props.setUserPrompt(e.target.value)}
                className="glass-textarea leading-relaxed"
                placeholder="A playful fox in a magical forest, or maybe a cozy coffee shop scene..."
              />
              <div className="absolute bottom-2 right-2">
                <button
                  onClick={() => props.setHasHeroRef(!props.hasHeroRef)}
                  className={`p-1.5 rounded-lg transition-all ${props.hasHeroRef ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg' : 'bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))]'}`}
                  title="Show/hide reference"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </button>
              </div>
            </div>

            {settings.enablePromptQuality && (
              <PromptQuality prompt={props.userPrompt} />
            )}

            {props.hasHeroRef && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block w-full cursor-pointer group">
                  <div className="w-full h-32 rounded-xl border border-dashed border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] bg-[hsl(var(--card))]/30 flex flex-col items-center justify-center transition-all relative overflow-hidden">
                    {props.heroImage ? (
                      <>
                        <img src={`data:${props.heroImage.mimeType};base64,${props.heroImage.base64}`} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="Hero Ref" />
                        {/* Hero Lab Badge */}
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/90 text-white text-[10px] font-medium backdrop-blur-sm">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                          Hero DNA
                        </div>
                        {/* Clear button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            props.setHeroImage(null);
                            props.setHasHeroRef(false);
                          }}
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove hero reference"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </>
                    ) : (
                      <div className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors flex flex-col items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <span className="text-xs font-medium">Add Inspiration Image</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[hsl(var(--border))] to-transparent"></div>

          {/* Section: Additional Settings */}
          <div className="space-y-5">
            {/* Text Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))]">
              <span className="text-sm font-medium">Add text to pages?</span>
              <button
                onClick={() => props.setIncludeText(!props.includeText)}
                className={`relative w-11 h-6 transition-colors rounded-full ${props.includeText ? 'bg-emerald-500' : 'bg-[hsl(var(--muted))]'}`}
              >
                <span className={`absolute left-1 top-1 w-4 h-4 transition-transform rounded-full bg-white ${props.includeText ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Consistency Toggle */}
            <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${props.hasHeroRef
              ? 'bg-[hsl(var(--muted))]/10 border-[hsl(var(--border))] opacity-50 cursor-not-allowed'
              : props.autoConsistency
                ? 'bg-purple-500/10 border-purple-500/30'
                : 'bg-[hsl(var(--card))]/50 border-[hsl(var(--border))]'
              }`}>
              <div className="flex flex-col">
                <span className="text-sm font-medium flex items-center gap-2">
                  Auto-Consistency
                  {props.autoConsistency && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">Beta</span>}
                </span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {props.hasHeroRef
                    ? 'Disabled: Hero Reference is active'
                    : 'Use Page 1 style for the whole batch'}
                </span>
              </div>
              <button
                onClick={() => !props.hasHeroRef && props.setAutoConsistency(!props.autoConsistency)}
                disabled={props.hasHeroRef}
                className={`relative w-11 h-6 transition-colors rounded-full ${props.hasHeroRef
                  ? 'bg-[hsl(var(--muted))]'
                  : props.autoConsistency
                    ? 'bg-purple-500'
                    : 'bg-[hsl(var(--muted))]'
                  }`}
              >
                <span className={`absolute left-1 top-1 w-4 h-4 transition-transform rounded-full bg-white ${!props.hasHeroRef && props.autoConsistency ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Hero Controls (Advanced) */}
            {props.hasHeroRef && (
              <div className="space-y-4 pt-2 border-t border-[hsl(var(--border))] animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-400 tracking-wider uppercase">Hero Controls</span>
                </div>

                {/* Presence Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[hsl(var(--muted-foreground))]">Hero Presence</span>
                    <span className="font-medium text-[hsl(var(--foreground))]">{props.heroPresence}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={props.heroPresence}
                    onChange={(e) => props.setHeroPresence(Number(e.target.value))}
                    className="w-full h-1.5 bg-[hsl(var(--muted))] rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
                    <span>Style Only</span>
                    <span>Cameo</span>
                    <span>Balanced</span>
                    <span>Star</span>
                  </div>
                </div>

                {/* Cinematics Dropdown */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Camera Framing</span>
                  </div>
                  <div className="relative">
                    <select
                      value={props.cinematics || 'dynamic'}
                      onChange={(e) => props.setCinematics(e.target.value)}
                      className="w-full p-2 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none"
                    >
                      {CINEMATIC_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--muted-foreground))]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                  </div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    {CINEMATIC_OPTIONS.find(o => o.id === props.cinematics)?.prompt || "AI adapts camera to the scene action."}
                  </p>
                </div>
              </div>
            )}

          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>


          {/* Section: Output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className={labelClass + " mb-0"}>Page Size</label>
              <div className="flex gap-2 flex-wrap">
                {PAGE_SIZES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => props.setPageSize(s.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${props.pageSize === s.id ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]' : 'bg-transparent text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--ring))]'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Advanced Options */}
          <div className="space-y-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              Advanced Options
              {(props.styleReferences.length > 0) && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">
                  {props.styleReferences.length} ref
                </span>
              )}
            </button>

            {showAdvanced && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-6 pl-4 border-l border-white/10">

                {/* Style Reference Upload */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className={labelClass + " mb-0"}>Style Reference</label>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {props.styleReferences.length}/{MAX_STYLE_REFERENCES} images
                    </span>
                  </div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] -mt-2">
                    Upload images to guide the AI's visual style.
                  </p>

                  {/* Upload Area */}
                  {props.styleReferences.length < MAX_STYLE_REFERENCES && (
                    <label className="block w-full cursor-pointer group">
                      <div className="w-full py-4 rounded-xl border border-dashed border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] bg-[hsl(var(--card))]/30 flex flex-col items-center justify-center transition-all gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]">
                          Add Style Reference
                        </span>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          PNG, JPG, or PDF only
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Validate file type
                          if (!ALLOWED_REFERENCE_TYPES.includes(file.type)) {
                            if (props.showToast) {
                              props.showToast('error', 'Only PNG, JPG, and PDF files are allowed.', '🚫');
                            }
                            return;
                          }

                          // Convert to base64
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const result = reader.result as string;
                            const match = result.match(/^data:(.+);base64,(.+)$/);
                            if (match) {
                              const newRef: StyleReference = {
                                base64: match[2],
                                mimeType: match[1],
                                fileName: file.name
                              };
                              props.setStyleReferences([...props.styleReferences, newRef]);
                              if (props.showToast) {
                                props.showToast('success', `Added: ${file.name}`, '🎨');
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                          e.target.value = ''; // Reset input
                        }}
                      />
                    </label>
                  )}

                  {/* Preview Grid */}
                  {props.styleReferences.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {props.styleReferences.map((ref, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                          {ref.mimeType === 'application/pdf' ? (
                            <div className="w-full h-full bg-red-500/20 flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                              </svg>
                            </div>
                          ) : (
                            <img
                              src={`data:${ref.mimeType};base64,${ref.base64}`}
                              className="w-full h-full object-cover"
                              alt={ref.fileName}
                            />
                          )}
                          <button
                            onClick={() => {
                              props.setStyleReferences(props.styleReferences.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                {/* Creative Variation Toggle */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className={labelClass + " mb-0"}>Creative Variation</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">AI Auto</span>
                      <button
                        onClick={() => props.setCreativeVariation(
                          props.creativeVariation === 'auto' ? 'balanced' : 'auto'
                        )}
                        className={`w-10 h-6 rounded-full transition-colors relative ${props.creativeVariation !== 'auto' ? 'bg-[hsl(var(--foreground))]' : 'bg-[hsl(var(--muted))]'
                          }`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-md transform transition-transform ${props.creativeVariation !== 'auto' ? 'translate-x-4 bg-[hsl(var(--background))]' : 'translate-x-0 bg-[hsl(var(--muted-foreground))]'
                          }`} />
                      </button>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Manual</span>
                    </div>
                  </div>

                  {/* Manual buttons - only visible when not auto */}
                  {props.creativeVariation !== 'auto' && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <div className="flex gap-2">
                        {(['precision', 'balanced', 'freedom'] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => props.setCreativeVariation(level)}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${props.creativeVariation === level
                              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]'
                              : 'bg-transparent text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--ring))]'
                              }`}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                        {props.creativeVariation === 'precision' && '🎯 Consistent, predictable outputs. Best for Mandala, Geometric.'}
                        {props.creativeVariation === 'balanced' && '⚖️ Good mix of consistency and variety. Works for most styles.'}
                        {props.creativeVariation === 'freedom' && '🎨 More creative, varied outputs. Best for Abstract, Fantasy.'}
                      </p>
                    </div>
                  )}

                  {props.creativeVariation === 'auto' && (
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                      🤖 AI will choose the best setting based on your style, detail level, and audience.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Only shown if NOT embedded */}
        {!props.embeddedMode && (
          <div className="p-6 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/30 backdrop-blur-md">
            {props.isGenerating ? (
              <button disabled className="btn-primary opacity-80 cursor-wait flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Creating {Math.round(props.progress)}%...</span>
              </button>
            ) : (
              <div className="flex gap-2">
                {props.onCancel && props.progress > 0 && props.progress < 100 ? (
                  <button onClick={props.onCancel} className="w-1/3 btn-secondary py-3.5 rounded-xl transition-colors">
                    Stop Creating
                  </button>
                ) : null}
                <button
                  onClick={handleGenerateClick}
                  disabled={!props.userPrompt}
                  className="btn-primary flex-1"
                >
                  ✨ Create My Book
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};