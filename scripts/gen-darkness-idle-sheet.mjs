import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "GEMINI_API_KEY not set. Run with: node --env-file=.env.local scripts/gen-darkness-idle-sheet.mjs",
  );
  process.exit(1);
}

const prompt = `Pixel art idle animation sprite-sheet for a 2D fighting charity game BOSS character "Pani Ciemność" (Lady Darkness).

LAYOUT — strict requirement:
- A single image containing exactly 4 frames placed side by side, left to right, in equal columns
- Aspect ratio of the whole image: 4:1 (very wide horizontal strip)
- Each frame shows the SAME boss, identical proportions, identical position, identical color palette
- The 4 frames differ ONLY in the subtle pose changes described below
- Boss is roughly TWICE the height of a normal hero — tall slender silhouette filling the vertical extent of each frame

BACKGROUND — strict requirement:
- SOLID FLAT MAGENTA color #ff00ff (pure RGB 255,0,255) as the background of every frame
- NO checkerboard, NO gradients, NO shadows on the ground, NO scenery
- The boss itself MUST NOT contain any magenta (#ff00ff) pixels — avoid pink/magenta in clothing, eyes, aura, hair
- Use deep charcoal, jet black, lavender violet, pale icy white — NEVER magenta or hot pink

BOSS CHARACTER — same in every frame:
- Tall slender ghostly female sorceress, ethereal posture, floating slightly above ground
- Long flowing jet-black gown with charcoal mist trailing from the hem (#1f2937 / #000000), pale lavender gloves
- Long flowing pale white-violet hair drifting upward as if underwater, hidden face except for two glowing pale violet eyes (#c4b5fd) burning beneath a dark hood
- Floating wisps of dark violet shadow magic orbiting her hands (NOT pink), small specks of pale violet starlight in her aura
- 16-bit SNES era pixel art style (Final Fantasy VI / Lufia II / Castlevania Symphony)
- Sharp visible pixels, NO antialiasing, limited color palette
- Full body, frontal view, boss centered horizontally and vertically in each frame
- Inspired by: Veran (Zelda Oracle of Ages), Lady Dimitrescu (stylized), Maleficent, Kefka's silhouette, Sailor Saturn

FRAMES — left to right:
- Frame 1 (leftmost): base hovering stance, hands open with violet wisps orbiting palms, gown trailing still, eyes glowing pale violet
- Frame 2: subtle hover up — entire body floats up by ~3 pixels, gown billows out, hair drifts higher, wisps expand outward
- Frame 3: base stance again, eyes narrow slightly, wisps contract
- Frame 4 (rightmost): subtle hover down — body floats down by ~3 pixels, gown collapses inward, hair settles, wisps swirl tighter

Antagonistic context: this boss represents oppressive Darkness / fear of the unknown during illness. She must look HAUNTING, ETHEREAL, intimidating but stylized cartoonish (this is a charity game for kids fighting cancer — eerie but not horror-graphic, no gore, no blood, no realistic violence).

Output: pure pixel art sprite-sheet, single PNG, 4 frames horizontally aligned, magenta #ff00ff background, NO text, NO watermark, NO frame numbers, NO grid lines between frames.`;

const ai = new GoogleGenAI({ apiKey });

const candidates = [
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-image-preview",
];

const outDir = path.resolve("public/sprites/.tmp");
const outPath = path.join(outDir, "darkness-idle-raw.png");

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
        console.log("Next: node scripts/process-darkness-sheet.mjs");
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
