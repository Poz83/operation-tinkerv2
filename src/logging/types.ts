/**
 * Logging domain types (kept in a single folder so the feature
 * can be removed cleanly in the future).
 */

export type QaTag =
  | 'cropped'
  | 'touches_border'
  | 'open_paths'
  | 'too_noisy'
  | 'too_detailed'
  | 'too_simple'
  | 'missing_subject'
  | 'wrong_style'
  | 'text_present_unwanted'
  | 'distorted_anatomy'
  | 'background_wrong'
  | 'low_contrast_lines';

export interface PageQa {
  tags: QaTag[];
  notes?: string;
  score?: number;                    // 0-100 quality score
  hardFail?: boolean;                 // true if any hard fail criteria triggered
  reasons?: string[];                 // Human-readable failure reasons
  rubricBreakdown?: {                 // Weighted scores per category
    printCleanliness: number;         // 0-30
    colorability: number;             // 0-20
    composition: number;              // 0-20
    audienceAlignment: number;        // 0-15
    consistency: number;              // 0-15
  };
}

export interface ImageRef {
  provider: 'idb' | 'r2' | 'other';
  key: string;
  url?: string;
  etag?: string;
}

export interface GenerationBatch {
  id: string;
  createdAt: string;
  schemaVersion: string;
  projectName: string;
  userIdea: string;
  pageCount: number;
  audience: string;
  style: string;
  complexity: string;
  aspectRatio: string;
  includeText: boolean;
  hasHeroRef: boolean;
  heroImageMeta?: {
    mimeType: string;
    size?: number;
    name?: string;
  };
  heroImageDataUrl?: string;
}

export interface GenerationPageLog {
  batchId: string;
  pageNumber: number;
  planPrompt: string;
  requiresText: boolean;
  fullPrompt: string;
  fullNegativePrompt: string;
  resolution: '1K' | '2K' | string;
  width: number;
  height: number;
  aspectRatio: string;
  startedAt?: string;
  finishedAt?: string;
  latencyMs?: number;
  imageRef?: ImageRef;
  imageDataUrl?: string;
  error?: string;
  qa?: PageQa;
}

export interface StoredPageBlob {
  blob: Blob;
  mimeType: string;
}

export const BATCH_LOG_SCHEMA_VERSION = '1.0.0';
