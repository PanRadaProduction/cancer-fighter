import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set. Run with: node --env-file=.env.local scripts/gen-hope-idle.mjs");
  process.exit(1);
}

const prompt = `Pixel art sprite of a young heroine character "Nadzieja" (Hope) for a 2D fighting charity game.

Visual requirements:
- 16-bit SNES era pixel art (like Street Fighter II / Final Fight)
- Sharp visible pixels, NO antialiasing, limited color palette
- Single static idle pose, full body, frontal view
- Heroine girl age 10-12, gentle confident smile, large eyes, kind expression
- Color palette: golden amber hair (#fbbf24 family), warm yellow-orange tunic, white sash/shirt, sky blue eyes, soft golden glow aura around her body
- Aspect ratio 2:3 (portrait)
- COMPLETELY TRANSPARENT background — only the character and her aura visible, no scenery, no floor, no shadow on ground
- Character centered in frame
- Inspired by: Mega Man, Ness from EarthBound, Lucca from Chrono Trigger — child-friendly retro hero aesthetic

Charitable context: this character represents Hope in a game supporting children fighting cancer. She must look kind, warm, encouraging — never aggressive. Convey "you're not alone" energy.

Output: pure pixel art sprite, transparent PNG, character centered, NO text or watermark in image.`;

const ai = new GoogleGenAI({ apiKey });

const candidates = [
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-image-preview",
];

let lastError;
for (const model of candidates) {
  try {
    console.log(`Trying model: ${model}`);
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
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
        const outPath = path.resolve("public/sprites/hope-idle.png");
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, buffer);
        console.log(`Saved: ${outPath} (${buffer.length} bytes, model: ${model})`);
        process.exit(0);
      }
    }
    console.error(`Model ${model} returned no image. Text parts:`,
      parts.filter((p) => p.text).map((p) => p.text?.slice(0, 200)));
  } catch (err) {
    lastError = err;
    console.error(`Model ${model} failed: ${err.message ?? err}`);
  }
}
console.error("All candidate models failed.");
if (lastError) throw lastError;
process.exit(1);
