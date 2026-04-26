import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "GEMINI_API_KEY not set. Run with: node --env-file=.env.local scripts/gen-brave-idle-sheet.mjs",
  );
  process.exit(1);
}

const prompt = `Pixel art idle animation sprite-sheet for a 2D fighting charity game character "Odwaga" (Brave).

LAYOUT — strict requirement:
- A single image containing exactly 4 frames placed side by side, left to right, in equal columns
- Aspect ratio of the whole image: 4:1 (very wide horizontal strip)
- Each frame shows the SAME character, identical proportions, identical position, identical color palette
- The 4 frames differ ONLY in the subtle pose changes described below

BACKGROUND — strict requirement:
- SOLID FLAT MAGENTA color #ff00ff (pure RGB 255,0,255) as the background of every frame
- NO checkerboard, NO gradients, NO shadows on the ground, NO scenery
- The character itself MUST NOT contain any magenta (#ff00ff) pixels — avoid pink/magenta in hair, skin, clothing, eyes, accessories, aura
- Use crimson red, golden yellow, ivory white, dark navy — NEVER magenta or hot pink

CHARACTER — same in every frame:
- Heroic boy age 11-13, brave determined expression, strong jawline, short messy dark hair
- Crimson red tunic (#dc2626 family), golden round shield (#fde047) with bright cross emblem strapped to left arm, white sash, dark navy boots
- Subtle red battle aura around his body (warm crimson, NOT pink)
- 16-bit SNES era pixel art style (Street Fighter II / Final Fight Cody / Captain Tsubasa)
- Sharp visible pixels, NO antialiasing, limited color palette
- Full body, frontal view, character centered vertically in each frame
- Inspired by: Cody (Final Fight), Captain Tsubasa, Captain Falcon, Bahamut Lagoon knights

FRAMES — left to right:
- Frame 1 (leftmost): base idle stance, shield held at chest height, feet shoulder-width apart, eyes fully open, neutral confident face
- Frame 2: subtle inhale — chest expanded by ~2 pixels, shoulders raised slightly, shield steady, eyes fully open
- Frame 3: base stance again, eyes mid-blink (eyelids halfway closed), shield steady
- Frame 4 (rightmost): subtle exhale — chest compressed by ~2 pixels, shoulders lowered slightly, shield tilted down by ~1 pixel, eyes fully open

Charitable context: this character represents Bravery in a game supporting children fighting cancer. He must look protective, reliable, encouraging — never aggressive. Convey "I will stand by you" energy.

Output: pure pixel art sprite-sheet, single PNG, 4 frames horizontally aligned, magenta #ff00ff background, NO text, NO watermark, NO frame numbers, NO grid lines between frames.`;

const ai = new GoogleGenAI({ apiKey });

const candidates = [
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-image-preview",
];

const outDir = path.resolve("public/sprites/.tmp");
const outPath = path.join(outDir, "brave-idle-raw.png");

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
          aspectRatio: "4:1",
          imageSize: "2K",
        },
      },
    });
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outPath, buffer);
        console.log(
          `Saved: ${outPath} (${buffer.length} bytes, model: ${model})`,
        );
        console.log("Next: node scripts/process-brave-sheet.mjs");
        process.exit(0);
      }
    }
    console.error(
      `Model ${model} returned no image. Text parts:`,
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
