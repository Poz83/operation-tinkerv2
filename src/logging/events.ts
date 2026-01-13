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
    } & Pick<GenerationPageLog, 'batchId' | 'startedAt' | 'finishedAt' | 'latencyMs'>);
