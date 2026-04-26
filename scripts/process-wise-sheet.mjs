import sharp from "sharp";
import * as fs from "node:fs";
import * as path from "node:path";

const FRAME_W = 96;
const FRAME_H = 144;
const FRAME_COUNT = 4;
const SHEET_W = FRAME_W * FRAME_COUNT;
const SHEET_H = FRAME_H;

const KEY_R = 255;
const KEY_G = 0;
const KEY_B = 255;
const COLOR_DISTANCE_THRESHOLD = 60;

const inputPath = path.resolve("public/sprites/.tmp/wise-idle-raw.png");
const outputPath = path.resolve("public/sprites/wise-idle.png");

if (!fs.existsSync(inputPath)) {
  console.error(`Missing ${inputPath}. Run: node --env-file=.env.local scripts/gen-wise-idle-sheet.mjs`);
  process.exit(1);
}

const raw = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data, info } = raw;
console.log(`Loaded raw: ${info.width}x${info.height}, channels=${info.channels}`);

const thresholdSq = COLOR_DISTANCE_THRESHOLD * COLOR_DISTANCE_THRESHOLD;
let keyedPixels = 0;
for (let i = 0; i < data.length; i += 4) {
  const dr = data[i] - KEY_R;
  const dg = data[i + 1] - KEY_G;
  const db = data[i + 2] - KEY_B;
  if (dr * dr + dg * dg + db * db <= thresholdSq) {
    data[i + 3] = 0;
    keyedPixels++;
  }
}
console.log(`Keyed ${keyedPixels} magenta pixels to alpha (${((keyedPixels / (info.width * info.height)) * 100).toFixed(1)}%)`);

const keyed = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toBuffer();

const trimmed = await sharp(keyed).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
const trimmedMeta = await sharp(trimmed).metadata();
console.log(`Trimmed: ${trimmedMeta.width}x${trimmedMeta.height}`);

const trimmedW = trimmedMeta.width ?? info.width;
const trimmedH = trimmedMeta.height ?? info.height;
const sliceW = Math.floor(trimmedW / FRAME_COUNT);

const composites = [];
for (let i = 0; i < FRAME_COUNT; i++) {
  const left = i * sliceW;
  const frame = await sharp(trimmed)
    .extract({ left, top: 0, width: sliceW, height: trimmedH })
    .resize(FRAME_W, FRAME_H, {
      kernel: sharp.kernel.nearest,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  composites.push({ input: frame, top: 0, left: i * FRAME_W });
}

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
console.log(`Wrote ${outputPath}: ${finalMeta.width}x${finalMeta.height}, channels=${finalMeta.channels}, hasAlpha=${finalMeta.hasAlpha}`);

if (finalMeta.width !== SHEET_W || finalMeta.height !== SHEET_H) {
  console.error(`Unexpected dimensions, expected ${SHEET_W}x${SHEET_H}`);
  process.exit(1);
}
if (!finalMeta.hasAlpha) {
  console.error("Final PNG has no alpha channel");
  process.exit(1);
}

const finalRaw = await sharp(outputPath).raw().toBuffer({ resolveWithObject: true });
for (let frame = 0; frame < FRAME_COUNT; frame++) {
  let magentaCount = 0;
  let opaqueCount = 0;
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      const idx = ((y * SHEET_W) + (frame * FRAME_W + x)) * 4;
      const r = finalRaw.data[idx];
      const g = finalRaw.data[idx + 1];
      const b = finalRaw.data[idx + 2];
      const a = finalRaw.data[idx + 3];
      if (a > 200) {
        opaqueCount++;
        const dr = r - KEY_R;
        const dg = g - KEY_G;
        const db = b - KEY_B;
        if (dr * dr + dg * dg + db * db <= thresholdSq) magentaCount++;
      }
    }
  }
  const ratio = opaqueCount > 0 ? (magentaCount / opaqueCount) * 100 : 0;
  console.log(`Frame ${frame}: opaque=${opaqueCount}, residualMagenta=${magentaCount} (${ratio.toFixed(2)}%)`);
  if (ratio > 5) {
    console.error(`Frame ${frame} has >5% residual magenta — likely background bleeding into character`);
    process.exit(1);
  }
}

console.log("OK — wise sprite-sheet ready");
