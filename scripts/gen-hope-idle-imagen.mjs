import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set");
  process.exit(1);
}

const prompt = `Pixel art sprite, 16-bit SNES era retro game character: a young heroine "Hope" age 10-12. Sharp pixels, no antialiasing, limited color palette. Frontal idle pose, full body. Golden amber hair, warm yellow-orange tunic with white sash, sky blue eyes, gentle confident smile, soft golden glow aura. Style of Mega Man / Ness from EarthBound / classic SNES JRPG hero. Transparent background, character centered. Kind, warm, encouraging expression. NO text, NO watermark.`;

const ai = new GoogleGenAI({ apiKey });

const candidates = [
  "imagen-4.0-fast-generate-001",
  "imagen-4.0-generate-001",
  "imagen-4.0-ultra-generate-001",
];

for (const model of candidates) {
  try {
    console.log(`Trying model: ${model}`);
    const response = await ai.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "3:4",
      },
    });
    const generated = response.generatedImages?.[0];
    const data = generated?.image?.imageBytes;
    if (data) {
      const buffer = Buffer.from(data, "base64");
      const outPath = path.resolve("public/sprites/hope-idle.png");
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved: ${outPath} (${buffer.length} bytes, model: ${model})`);
      process.exit(0);
    }
    console.error(`Model ${model} returned no image bytes`, JSON.stringify(response).slice(0, 300));
  } catch (err) {
    console.error(`Model ${model} failed: ${err.message ?? err}`);
  }
}
console.error("All Imagen candidates failed.");
process.exit(1);
