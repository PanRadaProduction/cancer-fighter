import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set. Run with: node --env-file=.env.local scripts/gen-hope-heavy.mjs");
  process.exit(1);
}

const REFERENCE_PATH = path.resolve("public/sprites/.tmp/hope-sheet-v2-raw.png");
const OUT_PATH = path.resolve("public/sprites/.tmp/hope-heavy-raw.png");

const prompt = `Generate ONE single pixel-art character frame matching the style of the reference sprite sheet (same blonde girl with blue eyes, orange tunic with white sash, dark blue leggings, "Hope/Nadzieja" young heroine).

Pose: HEAVY POWER STRIKE — character throws a powerful right punch forward to the right, body leaning forward with weight transferred, left arm pulled back for balance, right fist extended at chest height. Bright golden #FBBF24 / #FCD34D energy SHOCKWAVE radiating outward from the fist (clean ring or burst of light, NOT a blob). Determined, focused expression. Slight motion lines / impact frame energy.

Style: 16-bit SNES pixel art (Street Fighter II / Final Fight), sharp visible pixels, NO antialiasing, limited color palette, exact same character proportions as reference.

Output: SINGLE frame only, character centered, transparent OR solid dark background (rgb 24,24,24), NO multiple poses, NO frame grid. Just one clean character pose.`;

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
          aspectRatio: "2:3",
          imageSize: "1K",
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
