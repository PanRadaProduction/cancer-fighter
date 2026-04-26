import sharp from "sharp";
import * as fs from "node:fs";
import * as path from "node:path";

const FRAME_W = 96;
const FRAME_H = 144;
const FRAME_COUNT = 4;
const SHEET_W = FRAME_W * FRAME_COUNT;
const SHEET_H = FRAME_H;

const COLOR_KEY_THRESHOLD = 30;
const ALPHA_OPAQUE_MIN = 200;
const CHECKER_SECONDARY_THRESHOLD = 30;

const inputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve("public/sprites/.tmp/hope-sheet-v2-raw.png");
const outputPath = path.resolve("public/sprites/hope-idle.png");

if (!fs.existsSync(inputPath)) {
  console.error(`Missing input: ${inputPath}`);
  process.exit(1);
}

const fullRaw = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data: fullData, info: fullInfo } = fullRaw;
const W = fullInfo.width;
const H = fullInfo.height;
console.log(`Input: ${W}x${H}`);

const cornerIdx = (x, y) => (y * W + x) * 4;
const cornerSamples = [
  [0, 0],
  [W - 1, 0],
  [0, H - 1],
  [W - 1, H - 1],
].map(([x, y]) => {
  const i = cornerIdx(x, y);
  return { r: fullData[i], g: fullData[i + 1], b: fullData[i + 2], a: fullData[i + 3] };
});
const opaqueCorners = cornerSamples.filter((c) => c.a >= ALPHA_OPAQUE_MIN);
function applyKey(targetR, targetG, targetB, threshold, label) {
  const thresholdSq = threshold * threshold;
  let keyed = 0;
  for (let i = 0; i < fullData.length; i += 4) {
    if (fullData[i + 3] === 0) continue;
    const dr = fullData[i] - targetR;
    const dg = fullData[i + 1] - targetG;
    const db = fullData[i + 2] - targetB;
    if (dr * dr + dg * dg + db * db <= thresholdSq) {
      fullData[i + 3] = 0;
      keyed++;
    }
  }
  console.log(`${label} color-key rgb(${targetR},${targetG},${targetB}) → ${keyed} pixels alpha-zeroed`);
}

if (opaqueCorners.length >= 2) {
  const keyR = Math.round(opaqueCorners.reduce((s, c) => s + c.r, 0) / opaqueCorners.length);
  const keyG = Math.round(opaqueCorners.reduce((s, c) => s + c.g, 0) / opaqueCorners.length);
  const keyB = Math.round(opaqueCorners.reduce((s, c) => s + c.b, 0) / opaqueCorners.length);
  applyKey(keyR, keyG, keyB, COLOR_KEY_THRESHOLD, "Primary");

  // Detect checkerboard secondary color: sample multiple corner-area pixels
  const cornerPositions = [
    [4, 4], [W - 5, 4], [4, H - 5], [W - 5, H - 5],
    [12, 12], [W - 13, 12], [12, H - 13], [W - 13, H - 13],
  ];
  const cornerColors = cornerPositions
    .map(([x, y]) => {
      const i = (y * W + x) * 4;
      return { r: fullData[i], g: fullData[i + 1], b: fullData[i + 2], a: fullData[i + 3] };
    })
    .filter((c) => c.a >= ALPHA_OPAQUE_MIN);
  if (cornerColors.length > 0) {
    const sR = Math.round(cornerColors.reduce((s, c) => s + c.r, 0) / cornerColors.length);
    const sG = Math.round(cornerColors.reduce((s, c) => s + c.g, 0) / cornerColors.length);
    const sB = Math.round(cornerColors.reduce((s, c) => s + c.b, 0) / cornerColors.length);
    applyKey(sR, sG, sB, CHECKER_SECONDARY_THRESHOLD, "Secondary");
  }

  // Catch-all for checkerboard "transparency" patterns rendered as 2 grayscale tones
  let grayKeyed = 0;
  for (let i = 0; i < fullData.length; i += 4) {
    if (fullData[i + 3] === 0) continue;
    const r = fullData[i], g = fullData[i + 1], b = fullData[i + 2];
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (maxDiff <= 8 && r >= 60 && r <= 160) {
      fullData[i + 3] = 0;
      grayKeyed++;
    }
  }
  console.log(`Gray-checkerboard key: ${grayKeyed} pixels alpha-zeroed`);
} else {
  console.log("Corners already transparent, skipping color-key");
}

const colHasOpaque = new Array(W).fill(false);
for (let x = 0; x < W; x++) {
  for (let y = 0; y < H; y++) {
    if (fullData[(y * W + x) * 4 + 3] >= ALPHA_OPAQUE_MIN) {
      colHasOpaque[x] = true;
      break;
    }
  }
}

const runs = [];
let runStart = -1;
for (let x = 0; x < W; x++) {
  if (colHasOpaque[x] && runStart === -1) runStart = x;
  else if (!colHasOpaque[x] && runStart !== -1) {
    runs.push({ start: runStart, end: x - 1, len: x - runStart });
    runStart = -1;
  }
}
if (runStart !== -1) runs.push({ start: runStart, end: W - 1, len: W - runStart });
console.log(`Detected ${runs.length} content runs:`, runs.map((r) => `${r.start}-${r.end} (${r.len}px)`).join(", "));

const frameRuns = [...runs].sort((a, b) => b.len - a.len).slice(0, FRAME_COUNT).sort((a, b) => a.start - b.start);
if (frameRuns.length !== FRAME_COUNT) {
  console.error(`Expected ${FRAME_COUNT} content runs, got ${frameRuns.length}`);
  process.exit(1);
}
console.log(`Selected frame runs:`, frameRuns.map((r) => `[${r.start}..${r.end}]`).join(" "));

const keyedPng = await sharp(fullData, {
  raw: { width: W, height: H, channels: 4 },
}).png().toBuffer();

const frameBuffers = [];

for (let f = 0; f < FRAME_COUNT; f++) {
  const run = frameRuns[f];
  const sliceW = run.end - run.start + 1;

  const slice = await sharp(keyedPng)
    .extract({ left: run.start, top: 0, width: sliceW, height: H })
    .toBuffer();

  const trimmed = await sharp(slice)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 0 })
    .toBuffer();
  const trimmedMeta = await sharp(trimmed).metadata();
  console.log(`Frame ${f}: slice ${sliceW}x${H} → trimmed ${trimmedMeta.width}x${trimmedMeta.height}`);

  const fitted = await sharp(trimmed)
    .resize(FRAME_W, FRAME_H, {
      kernel: sharp.kernel.nearest,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  frameBuffers.push(fitted);
}

const composites = frameBuffers.map((buf, i) => ({ input: buf, top: 0, left: i * FRAME_W }));

await sharp({
  create: {
    width: SHEET_W,
    height: SHEET_H,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composites)
  .png()
  .toFile(outputPath);

const finalMeta = await sharp(outputPath).metadata();
console.log(`Wrote ${outputPath}: ${finalMeta.width}x${finalMeta.height}, hasAlpha=${finalMeta.hasAlpha}`);

if (finalMeta.width !== SHEET_W || finalMeta.height !== SHEET_H) {
  console.error(`Unexpected dimensions, expected ${SHEET_W}x${SHEET_H}`);
  process.exit(1);
}

console.log("OK — Hope sprite-sheet replaced");
