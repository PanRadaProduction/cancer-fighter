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

const inputPath = path.resolve(
  "/Users/panrada/Library/Application Support/Dropshare 5/pixel-art-girl-orange-dress-animation-frames-MOBQ.png",
);
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
let keyR = 0, keyG = 0, keyB = 0;
if (opaqueCorners.length >= 2) {
  keyR = Math.round(opaqueCorners.reduce((s, c) => s + c.r, 0) / opaqueCorners.length);
  keyG = Math.round(opaqueCorners.reduce((s, c) => s + c.g, 0) / opaqueCorners.length);
  keyB = Math.round(opaqueCorners.reduce((s, c) => s + c.b, 0) / opaqueCorners.length);
  const thresholdSq = COLOR_KEY_THRESHOLD * COLOR_KEY_THRESHOLD;
  let keyed = 0;
  for (let i = 0; i < fullData.length; i += 4) {
    const dr = fullData[i] - keyR;
    const dg = fullData[i + 1] - keyG;
    const db = fullData[i + 2] - keyB;
    if (dr * dr + dg * dg + db * db <= thresholdSq) {
      fullData[i + 3] = 0;
      keyed++;
    }
  }
  console.log(`Global color-key rgb(${keyR},${keyG},${keyB}) → ${keyed} pixels alpha-zeroed`);
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
