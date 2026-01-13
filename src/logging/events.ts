import { GenerationPageLog } from './types';

export type PageGenerationEvent =
  | ({
      type: 'start';
      pageNumber: number;
    } & Pick<
      GenerationPageLog,
      'batchId' | 'aspectRatio' | 'resolution' | 'width' | 'height' | 'fullPrompt' | 'fullNegativePrompt'
    >)
  | ({
      type: 'success';
      pageNumber: number;
      imageUrl: string;
    } & Pick<
      GenerationPageLog,
      | 'batchId'
      | 'aspectRatio'
      | 'resolution'
      | 'width'
      | 'height'
      | 'fullPrompt'
      | 'fullNegativePrompt'
      | 'latencyMs'
      | 'startedAt'
      | 'finishedAt'
      | 'qa'
    >)
  | ({
      type: 'error';
      pageNumber: number;
      error: string;
    } & Pick<GenerationPageLog, 'batchId' | 'startedAt' | 'finishedAt' | 'latencyMs'>)
  | {
      type: 'cooldown_start';
      pageNumber: number;
      cooldownMs: number;
      batchId: string;
    }
  | {
      type: 'cooldown_progress';
      pageNumber: number;
      remainingMs: number;
      batchId: string;
    }
  | {
      type: 'cooldown_end';
      pageNumber: number;
      batchId: string;
    }
  | {
      type: 'qa_start';
      pageNumber: number;
      batchId: string;
    }
  | {
      type: 'qa_complete';
      pageNumber: number;
      score: number;
      hardFail: boolean;
      batchId: string;
    }
  | {
      type: 'retry_start';
      pageNumber: number;
      reason: string;
      batchId: string;
    }
  | {
      type: 'retry_complete';
      pageNumber: number;
      newScore: number;
      batchId: string;
    };
