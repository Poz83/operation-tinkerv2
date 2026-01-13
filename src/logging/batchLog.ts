import { openDB, IDBPDatabase } from 'idb';
import {
  BATCH_LOG_SCHEMA_VERSION,
  GenerationBatch,
  GenerationPageLog,
  ImageRef,
  PageQa,
  QaTag,
} from './types';

const DB_NAME = 'myjoe-batch-log';
const DB_VERSION = 1;
const BATCH_STORE = 'batches';
const PAGE_STORE = 'pages';

type PageKey = string; // `${batchId}:${pageNumber}`

interface StoredPageRecord extends GenerationPageLog {
  key: PageKey;
  batchId: string;
  pageNumber: number;
  imageBlob?: Blob;
}

export interface BatchLogStore {
  createBatch(batch: Omit<GenerationBatch, 'createdAt' | 'schemaVersion'>): Promise<string>;
  savePlan(batchId: string, planItems: Array<Pick<GenerationPageLog, 'pageNumber' | 'planPrompt' | 'requiresText'>>): Promise<void>;
  recordPageStart(batchId: string, pageNumber: number, meta: Partial<GenerationPageLog>): Promise<void>;
  recordPageResult(
    batchId: string,
    pageNumber: number,
    result: Partial<GenerationPageLog> & { imageBlob?: Blob; imageRef?: ImageRef }
  ): Promise<void>;
  updatePageQa(batchId: string, pageNumber: number, qa: PageQa): Promise<void>;
  listBatches(): Promise<GenerationBatch[]>;
  getBatch(batchId: string): Promise<GenerationBatch | undefined>;
  getBatchPages(batchId: string): Promise<GenerationPageLog[]>;
  getBatchPagesFull(batchId: string): Promise<Array<GenerationPageLog & { imageBlob?: Blob }>>;
  deleteBatch(batchId: string): Promise<void>;
  pruneOldBatches(options: { maxAgeDays: number }): Promise<void>;
}

const toPageKey = (batchId: string, pageNumber: number): PageKey => `${batchId}:${pageNumber}`;

const initDb = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(BATCH_STORE)) {
        const batches = db.createObjectStore(BATCH_STORE, { keyPath: 'id' });
        batches.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(PAGE_STORE)) {
        const pages = db.createObjectStore(PAGE_STORE, { keyPath: 'key' });
        pages.createIndex('batchId', 'batchId');
      }
    },
  });
};

const ensurePage = async (
  db: IDBPDatabase,
  batchId: string,
  pageNumber: number
): Promise<StoredPageRecord> => {
  const key = toPageKey(batchId, pageNumber);
  const existing = await db.get(PAGE_STORE, key);
  if (existing) return existing as StoredPageRecord;

  const blank: StoredPageRecord = {
    key,
    batchId,
    pageNumber,
    planPrompt: '',
    requiresText: false,
    fullPrompt: '',
    fullNegativePrompt: '',
    resolution: '1K',
    width: 0,
    height: 0,
    aspectRatio: '1:1',
  };
  await db.put(PAGE_STORE, blank);
  return blank;
};

const store: BatchLogStore = {
  async createBatch(batch) {
    const db = await initDb();
    const id = crypto.randomUUID();
    const record: GenerationBatch = {
      ...batch,
      id,
      createdAt: new Date().toISOString(),
      schemaVersion: BATCH_LOG_SCHEMA_VERSION,
    };
    await db.put(BATCH_STORE, record);
    return id;
  },

  async savePlan(batchId, planItems) {
    const db = await initDb();
    const tx = db.transaction(PAGE_STORE, 'readwrite');
    for (const item of planItems) {
      const key = toPageKey(batchId, item.pageNumber);
      const base: StoredPageRecord = {
        key,
        batchId,
        pageNumber: item.pageNumber,
        planPrompt: item.planPrompt,
        requiresText: item.requiresText,
        fullPrompt: '',
        fullNegativePrompt: '',
        resolution: '1K',
        width: 0,
        height: 0,
        aspectRatio: '1:1',
      };
      await tx.store.put(base);
    }
    await tx.done;
  },

  async recordPageStart(batchId, pageNumber, meta) {
    const db = await initDb();
    const page = await ensurePage(db, batchId, pageNumber);
    const next: StoredPageRecord = {
      ...page,
      ...meta,
      startedAt: meta.startedAt ?? new Date().toISOString(),
    };
    await db.put(PAGE_STORE, next);
  },

  async recordPageResult(batchId, pageNumber, result) {
    const db = await initDb();
    const page = await ensurePage(db, batchId, pageNumber);
    const key = toPageKey(batchId, pageNumber);
    const next: StoredPageRecord = {
      ...page,
      ...result,
      imageRef: result.imageRef ?? (result.imageBlob ? ({ provider: 'idb', key } satisfies ImageRef) : page.imageRef),
      imageBlob: result.imageBlob ?? page.imageBlob,
      finishedAt: result.finishedAt ?? new Date().toISOString(),
    };
    await db.put(PAGE_STORE, next);
  },

  async updatePageQa(batchId, pageNumber, qa) {
    const db = await initDb();
    const page = await ensurePage(db, batchId, pageNumber);
    const next: StoredPageRecord = { ...page, qa };
    await db.put(PAGE_STORE, next);
  },

  async listBatches() {
    const db = await initDb();
    const batches = await db.getAll(BATCH_STORE);
    return (batches as GenerationBatch[]).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async getBatch(batchId) {
    const db = await initDb();
    return (await db.get(BATCH_STORE, batchId)) as GenerationBatch | undefined;
  },

  async getBatchPages(batchId) {
    const db = await initDb();
    const index = db.transaction(PAGE_STORE, 'readonly').store.index('batchId');
    const pages = await index.getAll(batchId);
    return pages as GenerationPageLog[];
  },

  async getBatchPagesFull(batchId) {
    const db = await initDb();
    const index = db.transaction(PAGE_STORE, 'readonly').store.index('batchId');
    const pages = await index.getAll(batchId);
    return pages as Array<GenerationPageLog & { imageBlob?: Blob }>;
  },

  async deleteBatch(batchId) {
    const db = await initDb();
    const tx = db.transaction([BATCH_STORE, PAGE_STORE], 'readwrite');
    await tx.objectStore(BATCH_STORE).delete(batchId);
    const pageIndex = tx.objectStore(PAGE_STORE).index('batchId');
    const pages = await pageIndex.getAll(batchId);
    for (const page of pages) {
      await tx.objectStore(PAGE_STORE).delete((page as StoredPageRecord).key);
    }
    await tx.done;
  },

  async pruneOldBatches({ maxAgeDays }) {
    const db = await initDb();
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    const batches = await db.getAll(BATCH_STORE);
    for (const batch of batches as GenerationBatch[]) {
      if (new Date(batch.createdAt).getTime() < cutoff) {
        await this.deleteBatch(batch.id);
      }
    }
  },
};

export const batchLogStore: BatchLogStore = store;

export const isBatchLoggingEnabled = (): boolean => {
  return Boolean(import.meta.env.DEV && import.meta.env.VITE_ENABLE_BATCH_LOGS === 'true');
};

// Convenience helpers for UI or callers
export const QA_TAGS: QaTag[] = [
  'cropped',
  'touches_border',
  'open_paths',
  'too_noisy',
  'too_detailed',
  'too_simple',
  'missing_subject',
  'wrong_style',
  'text_present_unwanted',
  'distorted_anatomy',
  'background_wrong',
  'low_contrast_lines',
];
