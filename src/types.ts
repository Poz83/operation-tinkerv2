/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { PageQa, QaTag } from './logging/types';

// ============================================================================
// Style Reference Upload Types
// ============================================================================

export interface StyleReference {
  base64: string;
  mimeType: string;
  fileName: string;
}

export const ALLOWED_REFERENCE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
export const MAX_STYLE_REFERENCES = 5;

export const PAGE_SIZES = [
  { id: 'square', label: '8.5" x 8.5"', ratio: '1:1', cssRatio: 1, width: 8.5, height: 8.5 },
  { id: 'portrait', label: '8.5" x 11"', ratio: '3:4', cssRatio: 0.77, width: 8.5, height: 11 }
];

export const VISUAL_STYLES = [

  { id: 'Cozy', label: 'Cozy (Hygge) ☕' },
  { id: 'HandDrawn', label: 'Hand-Drawn (Lifestyle) ✏️' },
  { id: 'Intricate', label: 'Intricate (Secret Garden) 🌿' },
  { id: 'Kawaii', label: 'Kawaii (Cute Mascot)' },
  { id: 'Whimsical', label: 'Whimsical (Storybook)' },
  { id: 'Cartoon', label: 'Cartoon (Action)' },
  { id: 'Botanical', label: 'Botanical (Scientific)' },
  { id: 'Mandala', label: 'Mandala (Geometric)' },
  { id: 'Zentangle', label: 'Zentangle (Meditative)' },
  { id: 'Fantasy', label: 'Fantasy (RPG/Epic)' },
  { id: 'Gothic', label: 'Gothic (Woodcut)' },
  { id: 'StainedGlass', label: 'Stained Glass (Mosaic)' },
  { id: 'Geometric', label: 'Geometric (Low Poly)' },
  { id: 'Realistic', label: 'Realistic (Fine Art Engraving)' }
];

export const COMPLEXITY_LEVELS = [
  { 
    id: 'Very Simple', 
    label: 'Very Simple',
    tooltip: 'Ages 1-3. Bold thick outlines, 5-10 large shapes, perfect for toddlers learning to color.' 
  },
  { 
    id: 'Simple', 
    label: 'Simple',
    tooltip: 'Ages 3-6. Clear outlines, 15-25 easy-to-color regions. Great for preschoolers.' 
  },
  { 
    id: 'Moderate', 
    label: 'Moderate',
    tooltip: 'Ages 6-12. Balanced detail with medium complexity. Ideal for most coloring projects.' 
  },
  { 
    id: 'Intricate', 
    label: 'Intricate',
    tooltip: 'Teens & Adults. Detailed pencil sketch style with 80-100 small sections. 4K resolution.' 
  },
  { 
    id: 'Extreme Detail', 
    label: 'Extreme Detail',
    tooltip: 'Expert level. Ultra-fine linework, 120+ tiny details. For dedicated colorists. 4K resolution.' 
  }
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
  qa?: PageQa;
}

export interface SavedProject {
  id: string;
  toolType?: 'coloring_studio' | 'hero_lab';
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
  characterDNA?: CharacterDNA; // Hero character DNA for consistency across pages
  heroPresence?: number; // 0-100 percentage of hero appearance
  cinematics?: CinematicOption; // Camera framing preference
  styleReferences?: StyleReference[]; // Up to 5 style reference images for AI
}

export const VISIBILITY_OPTIONS = [
  { id: 'private' as const, label: 'Private', description: 'Only you can see this project' },
  { id: 'unlisted' as const, label: 'Unlisted', description: 'Anyone with the link can view' },
  { id: 'public' as const, label: 'Public', description: 'Visible in the community gallery' },
];

export const CINEMATIC_OPTIONS = [
  { id: 'dynamic' as const, label: 'Dynamic (AI Choice)', prompt: '' },
  { id: 'close_up' as const, label: 'Close-Up (Portrait)', prompt: 'Close-up portrait shot, detailed facial features, shallow depth of field.' },
  { id: 'mid_shot' as const, label: 'Mid Shot (Action)', prompt: 'Mid-shot framing, waist-up view, capturing gesture and movement.' },
  { id: 'wide_shot' as const, label: 'Wide Shot (Scenery)', prompt: 'Wide establishing shot, full body visible, environmental context.' },
  { id: 'pov' as const, label: 'POV (Immersive)', prompt: 'First-person POV perspective, immersive angle, looking at the scene.' },
  { id: 'low_angle' as const, label: 'Low Angle (Heroic)', prompt: 'Low angle shot looking up, heroic perspective, imposing statur.' },
];
export type CinematicOption = typeof CINEMATIC_OPTIONS[number]['id'];

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

// ============================================================================
// Hero Lab - Character DNA
// ============================================================================

export interface CharacterDNA {
  name: string;
  role: string;
  age: string;
  face: string;      // jawline, nose, cheekbones, lips
  eyes: string;      // shape, size, color, unique marks
  hair: string;      // length, color, texture, parting
  skin: string;      // tone description
  body: string;      // build, proportions
  signatureFeatures: string; // scars, marks, accessories
  outfitCanon: string;       // default clothing and details
  styleLock: string;         // overall art style to enforce
}

// Reference mode for uploaded hero images
export type HeroReferenceMode = 'replicate' | 'inspiration';

export interface HeroProject extends SavedProject {
  toolType: 'hero_lab';
  dna: CharacterDNA;
  // Reference image (uploaded by user)
  referenceImageUrl?: string;
  referenceMode?: HeroReferenceMode;
  // Generated outputs
  baseImageUrl?: string;       // Quick single-pose preview (legacy/optional)
  profileSheetUrl?: string;    // 5-angle turnaround (primary output)
  seed?: number;
}

export type { PageQa, QaTag };