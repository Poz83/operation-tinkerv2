/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const PAGE_SIZES = [
  { id: 'square', label: '8.5" x 8.5"', ratio: '1:1', cssRatio: 1, width: 8.5, height: 8.5 },
  { id: 'portrait', label: '8.5" x 11"', ratio: '3:4', cssRatio: 0.77, width: 8.5, height: 11 }
];

export const VISUAL_STYLES = [
  { id: 'Bold & Easy', label: 'Bold & Easy' },
  { id: 'Kawaii', label: 'Kawaii (Cute Mascot)' },
  { id: 'Whimsical', label: 'Whimsical (Storybook)' },
  { id: 'Cartoon', label: 'Cartoon (Action)' },
  { id: 'Botanical', label: 'Botanical (Scientific)' },
  { id: 'Mandala', label: 'Mandala (Geometric)' },
  { id: 'Fantasy', label: 'Fantasy (RPG/Epic)' },
  { id: 'Gothic', label: 'Gothic (Stained Glass)' },
  { id: 'Cozy', label: 'Cozy (Hygge)' },
  { id: 'Geometric', label: 'Geometric (Low Poly)' },
  { id: 'Wildlife', label: 'Wildlife (Realistic)' },
  { id: 'Floral', label: 'Floral (Pattern)' },
  { id: 'Abstract', label: 'Abstract (Flow)' },
  { id: 'Realistic', label: 'Realistic (Fine Art)' }
];

export const COMPLEXITY_LEVELS = [
  'Very Simple',
  'Simple',
  'Moderate',
  'Intricate',
  'Extreme Detail'
];

// Creative Variation controls the AI's temperature setting
// 'auto' = AI picks based on style/complexity/audience
// manual options override the AI's choice
export type CreativeVariation = 'auto' | 'precision' | 'balanced' | 'freedom';

export const CREATIVE_VARIATION_OPTIONS = [
  { id: 'precision' as const, label: 'Precision', temp: 0.7, description: 'Consistent, predictable outputs' },
  { id: 'balanced' as const, label: 'Balanced', temp: 0.9, description: 'Good mix of consistency and variety' },
  { id: 'freedom' as const, label: 'Freedom', temp: 1.2, description: 'More creative, varied outputs' },
];

export const TARGET_AUDIENCES = [
  {
    id: 'toddlers',
    label: 'Toddlers (1-3)',
    prompt: 'Ultra simple, massive shapes, extra thick lines, no background details, single central subject'
  },
  {
    id: 'preschool',
    label: 'Preschool (3-5)',
    prompt: 'Simple scenes, thick lines, large clearly defined areas, cheerful characters'
  },
  {
    id: 'kids',
    label: 'Kids (6-10)',
    prompt: 'Standard complexity, fun detailed scenes, medium line weight, storytelling elements'
  },
  {
    id: 'teens',
    label: 'Teens',
    prompt: 'Moderate complexity, stylish, dynamic poses, standard line weight'
  },
  {
    id: 'adults',
    label: 'Adults',
    prompt: 'Intricate, fine lines, high detail, complex patterns, mindfulness style'
  },
  {
    id: 'seniors',
    label: 'Seniors (Large Format)',
    prompt: 'High visibility, thick clean lines, distinct sections, avoid tiny details, clear subject matter'
  },
  {
    id: 'sen',
    label: 'S.E.N. (Sensory Friendly)',
    prompt: 'Calming composition, clear uncluttered lines, predictable shapes, avoid visual noise'
  }
];

export type PageStatus =
  | 'queued'         // In queue, not started
  | 'planning'       // Being included in generation plan
  | 'cooldown'       // Waiting for cooldown before generation
  | 'generating'     // API call in progress
  | 'qa_checking'    // Running QA evaluation
  | 'retrying'       // Failed QA, retrying
  | 'complete'       // Successfully generated
  | 'error';         // Failed

export interface ColoringPage {
  id: string;
  imageUrl?: string;
  prompt: string;
  isLoading: boolean;
  pageIndex: number;
  isCover?: boolean;
  status?: PageStatus;
  statusMessage?: string;
  cooldownRemaining?: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SavedProject {
  id: string;
  projectName: string;
  pageAmount: number;
  pageSizeId: string;
  visualStyle: string;
  complexity: string;
  targetAudienceId: string;
  userPrompt: string;
  hasHeroRef: boolean;
  heroImage: { base64: string; mimeType: string } | null;
  includeText: boolean;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // Optional thumbnail data URL
  pages?: ColoringPage[];
  visibility?: 'private' | 'unlisted' | 'public'; // Gallery visibility
}

export const VISIBILITY_OPTIONS = [
  { id: 'private' as const, label: 'Private', description: 'Only you can see this project' },
  { id: 'unlisted' as const, label: 'Unlisted', description: 'Anyone with the link can view' },
  { id: 'public' as const, label: 'Public', description: 'Visible in the community gallery' },
];

// ============================================================================
// Style DNA - Forensic Analysis Results for Reference Images
// ============================================================================

export type LineWeight = 'hairline' | 'fine' | 'medium' | 'bold' | 'ultra-bold';
export type LineConsistency = 'uniform' | 'variable' | 'tapered';
export type LineStyle = 'smooth-vector' | 'hand-drawn' | 'scratchy' | 'brush-like';
export type ShadingTechnique = 'none' | 'stippling' | 'hatching' | 'cross-hatch' | 'solid-fills';
export type DensityLevel = 'sparse' | 'moderate' | 'dense' | 'horror-vacui';
export type BorderStyle = 'thick-rounded' | 'thin-rectangular' | 'decorative' | 'none';

export interface StyleDNA {
  // Line Analysis
  lineWeight: LineWeight;
  lineWeightMm: string;  // e.g., "0.3mm-0.5mm" or "1.5mm-2mm"
  lineConsistency: LineConsistency;
  lineStyle: LineStyle;

  // Shading Analysis
  shadingTechnique: ShadingTechnique;

  // Composition Analysis
  density: DensityLevel;
  whiteSpaceRatio: string;  // e.g., "30-40%"

  // Border/Frame
  hasBorder: boolean;
  borderStyle: BorderStyle;

  // Overall Vibe
  styleFamily: string;  // Closest match to existing styles
  temperature: number;  // Recommended 0.7-1.2

  // Raw description for prompt injection
  promptFragment: string;  // Concise descriptive text for injection
}