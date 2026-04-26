import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set. Run with: node --env-file=.env.local scripts/gen-hope-sheet-fixed.mjs");
  process.exit(1);
}

const REFERENCE_PATH = "/Users/panrada/Library/Application Support/Dropshare 5/pixel-art-girl-sprite-four-frames-GpHK.png";
const OUT_PATH = path.resolve("public/sprites/.tmp/hope-sheet-v2-raw.png");

const prompt = `Fix this 4-frame pixel-art sprite sheet of a blonde girl in an orange tunic with white sash (Hope/Nadzieja, young heroine).

The SECOND frame currently shows a malformed orange-pink BLOB next to her arm — that is an artifact, NOT a real animation pose. Replace ONLY the second frame with a clean KICK / FORWARD STRIKE action pose:

- Same character (same blonde hair, blue eyes, orange tunic, white sash, dark blue leggings)
- Right leg extended forward in a dynamic kick pose, knee bent, foot pointed
- Slight forward lean of body, arm raised for balance
- Determined expression, eyes open
- Optional: small golden #FBBF24 energy spark trailing the foot (small, clean, NOT a blob)
- NO mess, NO smear, NO floating pink/orange artifacts
- Transparent or solid dark background, same as other frames

Frames 1, 3, 4 must stay EXACTLY the same as in the reference (idle, blink, idle-alt). Only fix frame 2.

Layout: 4 frames horizontal, equal spacing, transparent background between frames. Same overall canvas size as input. Style: 16-bit SNES pixel art (Street Fighter II / Final Fight), sharp visible pixels, NO antialiasing.`;

const referenceBuffer = fs.readFileSync(REFERENCE_PATH);
const referenceBase64 = referenceBuffer.toString("base64");

const ai = new GoogleGenAI({ apiKey });
const candidates = [
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
];

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

let lastError;
for (const model of candidates) {
  try {
    console.log(`Trying model: ${model}`);
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/png", data: referenceBase64 } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "21:9",
          imageSize: "2K",
        },
      },
    });
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(OUT_PATH, buffer);
        console.log(`Saved: ${OUT_PATH} (${buffer.length} bytes, model: ${model})`);
        process.exit(0);
      }
    }
    console.error(`Model ${model} returned no image. Text:`,
      parts.filter((p) => p.text).map((p) => p.text?.slice(0, 200)));
  } catch (err) {
    lastError = err;
    console.error(`Model ${model} failed: ${err.message ?? err}`);
  }
}
console.error("All candidate models failed.");
if (lastError) throw lastError;
process.exit(1);
