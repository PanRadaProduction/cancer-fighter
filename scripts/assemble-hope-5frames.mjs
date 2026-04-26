import sharp from "sharp";
import * as fs from "node:fs";
import * as path from "node:path";

const FRAME_W = 96;
const FRAME_H = 144;
const FRAME_COUNT = 5;
const SHEET_W = FRAME_W * FRAME_COUNT;
const SHEET_H = FRAME_H;

const ALPHA_OPAQUE_MIN = 200;
const COLOR_KEY_THRESHOLD = 30;

const fourFramePath = path.resolve("public/sprites/hope-idle.png");
const heavyRawPath = path.resolve("public/sprites/.tmp/hope-heavy-raw.png");
const outputPath = path.resolve("public/sprites/hope-idle.png");

if (!fs.existsSync(fourFramePath) || !fs.existsSync(heavyRawPath)) {
  console.error(`Missing input(s):\n  ${fourFramePath}\n  ${heavyRawPath}`);
  process.exit(1);
}

const fourMeta = await sharp(fourFramePath).metadata();
if (fourMeta.width !== 384 || fourMeta.height !== 144) {
  console.error(`Expected 384x144 four-frame sheet, got ${fourMeta.width}x${fourMeta.height}`);
  process.exit(1);
}

// Process heavy raw: detect bg, color-key, trim, resize
const heavyRaw = await sharp(heavyRawPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data: hData, info: hInfo } = heavyRaw;
const W = hInfo.width;
const H = hInfo.height;
console.log(`Heavy raw: ${W}x${H}`);

const cornerSamples = [
  [0, 0],
  [W - 1, 0],
  [0, H - 1],
  [W - 1, H - 1],
].map(([x, y]) => {
  const i = (y * W + x) * 4;
  return { r: hData[i], g: hData[i + 1], b: hData[i + 2], a: hData[i + 3] };
});
const opaqueCorners = cornerSamples.filter((c) => c.a >= ALPHA_OPAQUE_MIN);

if (opaqueCorners.length >= 2) {
  const keyR = Math.round(opaqueCorners.reduce((s, c) => s + c.r, 0) / opaqueCorners.length);
  const keyG = Math.round(opaqueCorners.reduce((s, c) => s + c.g, 0) / opaqueCorners.length);
  const keyB = Math.round(opaqueCorners.reduce((s, c) => s + c.b, 0) / opaqueCorners.length);
  const thresholdSq = COLOR_KEY_THRESHOLD * COLOR_KEY_THRESHOLD;
  let keyed = 0;
  for (let i = 0; i < hData.length; i += 4) {
    const dr = hData[i] - keyR;
    const dg = hData[i + 1] - keyG;
    const db = hData[i + 2] - keyB;
    if (dr * dr + dg * dg + db * db <= thresholdSq) {
      hData[i + 3] = 0;
      keyed++;
    }
  }
  console.log(`Heavy primary color-key rgb(${keyR},${keyG},${keyB}) → ${keyed} pixels alpha-zeroed`);

  // Gray-checkerboard catch-all (in case of Gemini's transparent rendering)
  let grayKeyed = 0;
  for (let i = 0; i < hData.length; i += 4) {
    if (hData[i + 3] === 0) continue;
    const r = hData[i], g = hData[i + 1], b = hData[i + 2];
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (maxDiff <= 8 && r >= 60 && r <= 160) {
      hData[i + 3] = 0;
      grayKeyed++;
    }
  }
  console.log(`Heavy gray-checkerboard key: ${grayKeyed} pixels alpha-zeroed`);
}

const heavyKeyed = await sharp(hData, {
  raw: { width: W, height: H, channels: 4 },
}).png().toBuffer();

const heavyTrimmed = await sharp(heavyKeyed)
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 0 })
  .toBuffer();
const heavyTrimmedMeta = await sharp(heavyTrimmed).metadata();
console.log(`Heavy trimmed: ${heavyTrimmedMeta.width}x${heavyTrimmedMeta.height}`);

const heavyResized = await sharp(heavyTrimmed)
  .resize(FRAME_W, FRAME_H, {
    kernel: sharp.kernel.nearest,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

// Compose 5-frame sheet: existing 4 frames + heavy
await sharp({
  create: {
    width: SHEET_W,
    height: SHEET_H,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: fourFramePath, top: 0, left: 0 },
    { input: heavyResized, top: 0, left: 4 * FRAME_W },
  ])
  .png()
  .toFile(outputPath);

const finalMeta = await sharp(outputPath).metadata();
console.log(`Wrote ${outputPath}: ${finalMeta.width}x${finalMeta.height}, hasAlpha=${finalMeta.hasAlpha}`);

if (finalMeta.width !== SHEET_W || finalMeta.height !== SHEET_H) {
  console.error(`Unexpected dimensions, expected ${SHEET_W}x${SHEET_H}`);
  process.exit(1);
}

console.log("OK — 5-frame sprite sheet ready (idle, kick, blink, idle-alt, heavy)");
