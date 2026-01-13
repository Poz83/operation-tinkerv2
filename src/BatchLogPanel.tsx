import React, { useEffect, useMemo, useState } from 'react';
import { batchLogStore, QA_TAGS } from './logging/batchLog';
import { exportBatchZip } from './logging/exporter';
import { GenerationBatch, GenerationPageLog, PageQa, QaTag } from './logging/types';

interface BatchLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type PageWithBlob = GenerationPageLog & { imageBlob?: Blob };

export const BatchLogPanel: React.FC<BatchLogPanelProps> = ({ isOpen, onClose }) => {
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>();
  const [pages, setPages] = useState<PageWithBlob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      const data = await batchLogStore.listBatches();
      setBatches(data);
      if (data.length && !selectedBatchId) {
        setSelectedBatchId(data[0].id);
      }
    };
    load().catch((err) => console.error('Failed to load batches', err));
  }, [isOpen, selectedBatchId]);

  useEffect(() => {
    if (!isOpen || !selectedBatchId) {
      setPages([]);
      return;
    }
    const loadPages = async () => {
      const data = await batchLogStore.getBatchPagesFull(selectedBatchId);
      setPages(data as PageWithBlob[]);
    };
    loadPages().catch((err) => console.error('Failed to load pages', err));
  }, [isOpen, selectedBatchId]);

  const previewUrls = useMemo(() => {
    const map: Record<number, string> = {};
    const revoke: string[] = [];
    pages.forEach((p) => {
      if (p.imageDataUrl) {
        map[p.pageNumber] = p.imageDataUrl;
      } else if (p.imageBlob) {
        const url = URL.createObjectURL(p.imageBlob);
        map[p.pageNumber] = url;
        revoke.push(url);
      }
    });
    return { map, revoke };
  }, [pages]);

  useEffect(() => {
    return () => {
      previewUrls.revoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const currentBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId),
    [batches, selectedBatchId]
  );

  const updateQa = async (pageNumber: number, qa: PageQa) => {
    if (!selectedBatchId) return;
    setPages((prev) =>
      prev.map((p) => (p.pageNumber === pageNumber ? { ...p, qa } : p))
    );
    await batchLogStore.updatePageQa(selectedBatchId, pageNumber, qa);
  };

  const toggleTag = (pageNumber: number, tag: QaTag, checked: boolean) => {
    const page = pages.find((p) => p.pageNumber === pageNumber);
    const existing = page?.qa?.tags ?? [];
    const nextTags = checked
      ? Array.from(new Set([...existing, tag]))
      : existing.filter((t) => t !== tag);
    updateQa(pageNumber, { tags: nextTags, notes: page?.qa?.notes }).catch((err) =>
      console.error('QA update failed', err)
    );
  };

  const updateNotes = (pageNumber: number, notes: string) => {
    const page = pages.find((p) => p.pageNumber === pageNumber);
    const tags = page?.qa?.tags ?? [];
    updateQa(pageNumber, { tags, notes }).catch((err) =>
      console.error('QA update failed', err)
    );
  };

  const handleExport = async () => {
    if (!selectedBatchId) return;
    setIsExporting(true);
    try {
      const { blob, filename } = await exportBatchZip(selectedBatchId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBatchId) return;
    setIsDeleting(true);
    try {
      await batchLogStore.deleteBatch(selectedBatchId);
      const data = await batchLogStore.listBatches();
      setBatches(data);
      setSelectedBatchId(data[0]?.id);
      setPages([]);
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
      <div className="m-auto w-[1100px] max-w-[96vw] h-[80vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[hsl(var(--background))]/90 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">Batch Logs</div>
            <div className="text-lg font-semibold text-white">
              {currentBatch ? currentBatch.projectName : 'No batches yet'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={!selectedBatchId || isExporting}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm hover:bg-white/20 disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export ZIP'}
            </button>
            <button
              onClick={handleDelete}
              disabled={!selectedBatchId || isDeleting}
              className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-100 text-sm hover:bg-red-500/30 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete batch'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-white/10 overflow-y-auto bg-white/5">
            {batches.length === 0 ? (
              <div className="p-4 text-sm text-white/60">No batches yet.</div>
            ) : (
              batches.map((batch) => (
                <button
                  key={batch.id}
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors ${
                    batch.id === selectedBatchId ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <div className="text-sm font-semibold truncate">{batch.projectName}</div>
                  <div className="text-[11px] text-white/50 truncate">{batch.userIdea}</div>
                  <div className="text-[10px] text-white/40">
                    {batch.pageCount} pages • {new Date(batch.createdAt).toLocaleString()}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!currentBatch ? (
              <div className="text-white/60 text-sm">Select a batch to review.</div>
            ) : (
              <>
                <div className="text-white/70 text-sm mb-2">
                  {currentBatch.style} • {currentBatch.complexity} • {currentBatch.aspectRatio}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pages.map((page) => {
                    const qaTags = page.qa?.tags ?? [];
                    const imageUrl = previewUrls.map[page.pageNumber];
                    return (
                      <div key={page.pageNumber} className="border border-white/10 rounded-xl p-3 bg-white/5 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-white/70 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Page {page.pageNumber}</div>
                            {page.qa?.score !== undefined && (
                              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                page.qa.score >= 90 ? 'bg-green-500/20 text-green-300 border border-green-500/40' :
                                page.qa.score >= 75 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                                page.qa.score >= 60 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
                                'bg-red-500/20 text-red-300 border border-red-500/40'
                              }`}>
                                {page.qa.score}/100
                              </span>
                            )}
                            {page.qa?.hardFail && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/20 text-red-300 border border-red-500/40">
                                ⚠ Hard Fail
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/50">{page.aspectRatio}</div>
                        </div>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Page ${page.pageNumber}`}
                            className="w-full rounded-lg border border-white/10 bg-black/20"
                          />
                        ) : (
                          <div className="w-full h-48 rounded-lg border border-dashed border-white/20 grid place-items-center text-white/40 text-sm">
                            No image
                          </div>
                        )}
                        <div className="text-[11px] text-white/50 line-clamp-2">
                          {page.planPrompt}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {QA_TAGS.map((tag) => {
                            const active = qaTags.includes(tag);
                            return (
                              <label
                                key={tag}
                                className={`px-2 py-1 rounded-full border text-[11px] cursor-pointer ${
                                  active
                                    ? 'bg-white/20 border-white/40 text-white'
                                    : 'bg-white/5 border-white/15 text-white/60'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={active}
                                  onChange={(e) => toggleTag(page.pageNumber, tag, e.target.checked)}
                                />
                                {tag.replace(/_/g, ' ')}
                              </label>
                            );
                          })}
                        </div>
                        <textarea
                          placeholder="Notes..."
                          defaultValue={page.qa?.notes}
                          onBlur={(e) => updateNotes(page.pageNumber, e.target.value)}
                          className="w-full rounded-lg border border-white/15 bg-white/5 text-white text-sm p-2 min-h-[60px] placeholder:text-white/40"
                        />

                        {page.qa?.rubricBreakdown && (
                          <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/10">
                            <h4 className="text-[11px] font-semibold text-white/70 mb-2">Quality Rubric</h4>
                            <div className="space-y-1 text-[11px] text-white/60">
                              <div className="flex justify-between">
                                <span>Print Cleanliness:</span>
                                <span className="font-medium text-white/80">{page.qa.rubricBreakdown.printCleanliness.toFixed(1)}/30</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Colorability:</span>
                                <span className="font-medium text-white/80">{page.qa.rubricBreakdown.colorability.toFixed(1)}/20</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Composition:</span>
                                <span className="font-medium text-white/80">{page.qa.rubricBreakdown.composition.toFixed(1)}/20</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Audience Alignment:</span>
                                <span className="font-medium text-white/80">{page.qa.rubricBreakdown.audienceAlignment.toFixed(1)}/15</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Consistency:</span>
                                <span className="font-medium text-white/80">{page.qa.rubricBreakdown.consistency.toFixed(1)}/15</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {page.qa?.reasons && page.qa.reasons.length > 0 && (
                          <div className="mt-1 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <h4 className="text-[11px] font-semibold text-yellow-300 mb-1">Issues Detected</h4>
                            <ul className="text-[11px] text-yellow-200/80 list-disc list-inside space-y-0.5">
                              {page.qa.reasons.map((reason, i) => (
                                <li key={i}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
