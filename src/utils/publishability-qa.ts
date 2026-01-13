/**
 * Lightweight, browser-safe QA evaluator for publishable coloring pages.
 * Uses Canvas/ImageData heuristics to detect hard fails (eligible for retry)
 * and compute a rubric-aligned score.
 */

export type QaHardFailReason =
  | 'margin'
  | 'midtones'
  | 'speckles'
  | 'micro_clutter';

export type QaSoftWarning =
  | 'low_rest_areas'
  | 'line_weight_risk'
  | 'complexity_mismatch';

export interface QaRubricBreakdown {
  printCleanliness: number;
  colorability: number;
  composition: number;
  audienceAlignment: number;
  consistency: number;
}

export interface PublishabilityQaResult {
  score0to100: number;
  rubric: QaRubricBreakdown;
  hardFail: boolean;
  hardFailReasons: QaHardFailReason[];
  softWarnings: QaSoftWarning[];
  tags: string[]; // map to QaTag upstream
  reasons: string[];
  metrics: Record<string, number>;
}

export interface EvaluateOptions {
  dataUrl: string;
  complexity: string; // e.g., 'Very Simple' | 'Simple' | 'Moderate' | 'Intricate' | 'Extreme Detail'
  aspectRatio: string; // e.g., '1:1' or '3:4'
  maxAnalysisSize?: number; // default 512
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const complexityBands: Record<string, { maxTransitions: number; minRestTiles: number }> = {
  'Very Simple': { maxTransitions: 35, minRestTiles: 10 },
  'Simple': { maxTransitions: 60, minRestTiles: 8 },
  'Moderate': { maxTransitions: 90, minRestTiles: 6 },
  'Intricate': { maxTransitions: 130, minRestTiles: 4 },
  'Extreme Detail': { maxTransitions: 170, minRestTiles: 2 },
};

/**
 * Downsample an image to a max dimension for quick analysis.
 */
const loadAndDownsample = async (dataUrl: string, maxSize: number) => {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  return { data, width: w, height: h };
};

const isWhite = (r: number, g: number, b: number, tol = 10) =>
  r >= 255 - tol && g >= 255 - tol && b >= 255 - tol;
const isBlack = (r: number, g: number, b: number, tol = 10) =>
  r <= tol && g <= tol && b <= tol;

/**
 * Count mid-tone pixels (not near white, not near black).
 */
const countMidtones = (img: ImageData, tol = 12) => {
  const { data } = img;
  let mid = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (!isWhite(r, g, b, tol) && !isBlack(r, g, b, tol)) mid++;
  }
  return mid;
};

/**
 * Compute border contamination (margin violation) by scanning an outer band.
 */
const borderContaminationRatio = (img: ImageData, marginRatio = 0.1) => {
  const { width, height, data } = img;
  const mx = Math.max(1, Math.round(width * marginRatio));
  const my = Math.max(1, Math.round(height * marginRatio));
  let contaminated = 0;
  let total = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2];
      const inBand = x < mx || x >= width - mx || y < my || y >= height - my;
      if (inBand) {
        total++;
        if (!isWhite(r, g, b, 6)) contaminated++;
      }
    }
  }
  return total === 0 ? 0 : contaminated / total;
};

/**
 * Transition density: count black↔white transitions per row and column.
 */
const transitionDensity = (img: ImageData) => {
  const { width, height, data } = img;
  let transitions = 0;
  // rows
  for (let y = 0; y < height; y++) {
    let prevBlack = undefined as undefined | boolean;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2];
      const black = isBlack(r, g, b, 10);
      if (prevBlack !== undefined && prevBlack !== black) transitions++;
      prevBlack = black;
    }
  }
  // cols
  for (let x = 0; x < width; x++) {
    let prevBlack = undefined as undefined | boolean;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2];
      const black = isBlack(r, g, b, 10);
      if (prevBlack !== undefined && prevBlack !== black) transitions++;
      prevBlack = black;
    }
  }
  const norm = (width * height * 2) || 1;
  return transitions / norm;
};

/**
 * Rest area heuristic: tile into an N x N grid and check low-density tiles.
 */
const restAreaTiles = (img: ImageData, grid = 8) => {
  const { width, height, data } = img;
  const tileW = Math.max(1, Math.floor(width / grid));
  const tileH = Math.max(1, Math.floor(height / grid));
  let lowDensity = 0;
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      let blacks = 0;
      let pixels = 0;
      for (let y = gy * tileH; y < Math.min(height, (gy + 1) * tileH); y++) {
        for (let x = gx * tileW; x < Math.min(width, (gx + 1) * tileW); x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx],
            g = data[idx + 1],
            b = data[idx + 2];
          if (isBlack(r, g, b, 10)) blacks++;
          pixels++;
        }
      }
      const density = pixels === 0 ? 0 : blacks / pixels;
      if (density < 0.02) lowDensity++;
    }
  }
  return lowDensity;
};

/**
 * Speckle heuristic: count small black blobs via simple neighborhood check.
 * Lightweight approximation (not full connected-components to stay fast).
 */
const speckleRatio = (img: ImageData) => {
  const { width, height, data } = img;
  let isolated = 0;
  let blackCount = 0;
  const isBlk = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    return isBlack(data[idx], data[idx + 1], data[idx + 2], 10);
  };
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!isBlk(x, y)) continue;
      blackCount++;
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (isBlk(x + dx, y + dy)) neighbors++;
        }
      }
      if (neighbors <= 1) isolated++;
    }
  }
  return blackCount === 0 ? 0 : isolated / blackCount;
};

/**
 * Line weight risk: detect prevalence of single-pixel black runs after downsample.
 */
const lineWeightRisk = (img: ImageData) => {
  const { width, height, data } = img;
  let singleRuns = 0;
  let totalRuns = 0;
  for (let y = 0; y < height; y++) {
    let run = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const black = isBlack(data[idx], data[idx + 1], data[idx + 2], 10);
      if (black) {
        run++;
      } else if (run > 0) {
        totalRuns++;
        if (run === 1) singleRuns++;
        run = 0;
      }
    }
    if (run > 0) {
      totalRuns++;
      if (run === 1) singleRuns++;
    }
  }
  return totalRuns === 0 ? 0 : singleRuns / totalRuns;
};

export const evaluatePublishability = async (opts: EvaluateOptions): Promise<PublishabilityQaResult> => {
  const maxSize = opts.maxAnalysisSize ?? 512;
  const { data, width, height } = await loadAndDownsample(opts.dataUrl, maxSize);
  const img = data;

  const band = borderContaminationRatio(img, 0.1);
  const mid = countMidtones(img, 12);
  const transitions = transitionDensity(img);
  const restTiles = restAreaTiles(img, 8);
  const speckles = speckleRatio(img);
  const lineRisk = lineWeightRisk(img);

  const blackPixels = (() => {
    let n = 0;
    for (let i = 0; i < img.data.length; i += 4) {
      if (isBlack(img.data[i], img.data[i + 1], img.data[i + 2], 10)) n++;
    }
    return n / (img.data.length / 4);
  })();

  const bandFail = band > 0.01; // >1% of margin band dirty
  const midFail = mid > (width * height * 0.01); // >1% midtones
  const speckleFail = speckles > 0.08; // 8% isolated blacks

  const banding = complexityBands[opts.complexity] || complexityBands['Moderate'];
  const transFail = transitions > banding.maxTransitions / (width * height * 0.001); // normalized heuristic
  const restWarn = restTiles < banding.minRestTiles;

  const hardFailReasons: QaHardFailReason[] = [];
  if (bandFail) hardFailReasons.push('margin');
  if (midFail) hardFailReasons.push('midtones');
  if (speckleFail) hardFailReasons.push('speckles');
  if (transFail) hardFailReasons.push('micro_clutter');

  const softWarnings: QaSoftWarning[] = [];
  if (restWarn) softWarnings.push('low_rest_areas');
  if (lineRisk > 0.35) softWarnings.push('line_weight_risk');

  // Scoring (rubric weights)
  const cleanliness = clamp(
    30 *
      (1 -
        clamp(
          (band ? band * 8 : 0) +
            (mid / (width * height) * 5) +
            speckles * 3,
          0,
          1.2
        )),
    0,
    30
  );

  const colorability = clamp(
    20 *
      (1 -
        clamp(
          (transitions / (banding.maxTransitions / (width * height * 0.001 + 1e-6))) * 0.7 +
            (lineRisk * 0.6),
          0,
          1.2
        )),
    0,
    20
  );

  const composition = clamp(
    20 *
      (1 -
        clamp(
          restWarn ? 0.4 : 0,
          0,
          1
        )),
    0,
    20
  );

  const audienceAlignment = clamp(
    15 *
      (1 -
        clamp(
          Math.abs(
            transitions - banding.maxTransitions / (width * height * 0.001 + 1e-6)
          ),
          0,
          1.5
        )),
    0,
    15
  );

  const consistency = 15; // placeholder; batch-level outlier detection can adjust later

  const rubric: QaRubricBreakdown = {
    printCleanliness: cleanliness,
    colorability,
    composition,
    audienceAlignment,
    consistency,
  };

  const score0to100 = clamp(
    cleanliness + colorability + composition + audienceAlignment + consistency,
    0,
    100
  );

  const tags = [
    ...(bandFail ? ['touches_border'] : []),
    ...(midFail ? ['background_wrong', 'too_noisy'] : []),
    ...(speckleFail ? ['too_noisy'] : []),
    ...(transFail ? ['too_detailed'] : []),
    ...(restWarn ? ['too_detailed'] : []),
    ...(lineRisk > 0.35 ? ['low_contrast_lines'] : []),
  ];

  const reasons: string[] = [];
  if (bandFail) reasons.push('Margin contamination');
  if (midFail) reasons.push('Midtones/noise detected');
  if (speckleFail) reasons.push('Speckle/stray marks detected');
  if (transFail) reasons.push('Excessive micro detail (transition density)');
  if (restWarn) reasons.push('Too few rest areas');
  if (lineRisk > 0.35) reasons.push('Thin line risk after downsample');

  return {
    score0to100,
    rubric,
    hardFail: hardFailReasons.length > 0,
    hardFailReasons,
    softWarnings,
    tags,
    reasons,
    metrics: {
      band,
      midtones: mid,
      transitions,
      restTiles,
      speckles,
      lineRisk,
      blackPixels,
      width,
      height,
    },
  };
};
