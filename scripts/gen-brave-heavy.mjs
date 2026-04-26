import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "GEMINI_API_KEY not set. Run with: node --env-file=.env.local scripts/gen-brave-heavy.mjs",
  );
  process.exit(1);
}

const REFERENCE_PATH = path.resolve("public/sprites/.tmp/brave-idle-raw.png");
const OUT_PATH = path.resolve("public/sprites/.tmp/brave-heavy-raw.png");

const prompt = `Generate ONE single pixel-art character frame matching the style of the reference sprite sheet (same brave young boy "Odwaga / Brave", crimson red tunic with white sash, dark navy boots, golden round shield with cross emblem on left arm, dark messy hair).

Pose: HEAVY SHIELD BASH — character lunges forward to the right and SLAMS the golden round shield outward as a powerful weapon, shield arm fully extended forward at chest height, right arm pulled back for balance, body weight low and forward, knees deeply bent. Bright golden #fde047 IMPACT BURST radiating outward from the front face of the shield (clean ring or burst of light, NOT a blob). Fierce determined warrior expression.

Style: 16-bit SNES pixel art (Street Fighter II / Final Fight Cody / Captain Tsubasa), sharp visible pixels, NO antialiasing, limited color palette, EXACT same character proportions, palette and outfit as the reference.

Background — strict requirement: SOLID FLAT MAGENTA color #ff00ff (pure RGB 255,0,255). No gradients, no shadows, no scenery, no frame separators, no grid lines. Character must NOT contain any magenta pixels.

Edge quality — strict: HARD 1-pixel boundary between character and magenta background. NO red/crimson halo, NO outer glow outside the body silhouette except the golden shield burst (which must be solid yellow pixels, not transparent). NO anti-aliasing. Every pixel either fully opaque character color or pure magenta #ff00ff.

Output: SINGLE frame only, character centered, full body, magenta #ff00ff background, NO text, NO multiple poses, NO frame grid.`;

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
    console.error(
      `Model ${model} returned no image. Text:`,
      parts.filter((p) => p.text).map((p) => p.text?.slice(0, 200)),
    );
  } catch (err) {
    lastError = err;
    console.error(`Model ${model} failed: ${err.message ?? err}`);
  }
}
console.error("All candidate models failed.");
if (lastError) throw lastError;
process.exit(1);
