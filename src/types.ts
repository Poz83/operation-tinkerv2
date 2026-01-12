/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const PAGE_SIZES = [
  { id: 'square', label: '8.5" x 8.5"', ratio: '1:1', cssRatio: 1, width: 8.5, height: 8.5 },
  { id: 'portrait', label: '8.5" x 11"', ratio: '3:4', cssRatio: 0.77, width: 8.5, height: 11 }
];

export const VISUAL_STYLES = [
  { id: 'Bold & Easy', label: 'Bold & Easy (Toddler/Senior)' },
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
  { id: 'Abstract', label: 'Abstract (Flow)' }
];

export const COMPLEXITY_LEVELS = [
  'Very Simple',
  'Simple',
  'Moderate',
  'Intricate',
  'Extreme Detail'
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

export interface ColoringPage {
  id: string;
  imageUrl?: string;
  prompt: string;
  isLoading: boolean;
  pageIndex: number;
  isCover?: boolean;
}