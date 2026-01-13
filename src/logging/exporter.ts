import JSZip from 'jszip';
import { batchLogStore } from './batchLog';
import { dataUrlToBlob } from './utils';
import { GenerationPageLog } from './types';

const mimeToExtension = (mime?: string) => {
  if (!mime) return 'png';
  if (mime.includes('jpeg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  return 'png';
};

export const exportBatchZip = async (batchId: string): Promise<{ blob: Blob; filename: string }> => {
  const batch = await batchLogStore.getBatch(batchId);
  if (!batch) {
    throw new Error('Batch not found');
  }
  const { heroImageDataUrl, ...batchMeta } = batch;

  const pages = await batchLogStore.getBatchPagesFull(batchId);

  const zip = new JSZip();

  const metaPages = pages.map<GenerationPageLog>((page) => {
    const { imageBlob, imageDataUrl, ...rest } = page;
    return rest;
  });

  const metadata = { batch: batchMeta, pages: metaPages };

  zip.file('batch.json', JSON.stringify(metadata, null, 2));

  for (const page of pages) {
    let blob = page.imageBlob;
    if (!blob && page.imageDataUrl) {
      blob = await dataUrlToBlob(page.imageDataUrl);
    }
    if (blob) {
      const fileName = `${String(page.pageNumber).padStart(2, '0')}_page.${mimeToExtension(blob.type || 'image/png')}`;
      zip.file(`images/${fileName}`, blob, { binary: true });
    }
  }

  if (heroImageDataUrl) {
    const heroBlob = await dataUrlToBlob(heroImageDataUrl);
    const ext = mimeToExtension(heroBlob.type || 'image/png');
    zip.file(`reference/hero.${ext}`, heroBlob, { binary: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const safeTitle = batch.projectName
    .slice(0, 30)
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase() || 'batch';

  const filename = `${safeTitle}_${batch.id}.zip`;
  return { blob, filename };
};
