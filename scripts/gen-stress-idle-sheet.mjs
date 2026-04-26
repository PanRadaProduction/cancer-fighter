import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "GEMINI_API_KEY not set. Run with: node --env-file=.env.local scripts/gen-stress-idle-sheet.mjs",
  );
  process.exit(1);
}

const prompt = `Pixel art idle animation sprite-sheet for a 2D fighting charity game BOSS character "Lord Stres" (Lord Stress).

LAYOUT — strict requirement:
- A single image containing exactly 4 frames placed side by side, left to right, in equal columns
- Aspect ratio of the whole image: 4:1 (very wide horizontal strip)
- Each frame shows the SAME boss, identical proportions, identical position, identical color palette
- The 4 frames differ ONLY in the subtle pose changes described below
- Boss is roughly TWICE the height of a normal hero — large imposing silhouette filling the vertical extent of each frame

BACKGROUND — strict requirement:
- SOLID FLAT MAGENTA color #ff00ff (pure RGB 255,0,255) as the background of every frame
- NO checkerboard, NO gradients, NO shadows on the ground, NO scenery
- The boss itself MUST NOT contain any magenta (#ff00ff) pixels — avoid pink/magenta in clothing, eyes, aura, weapons
- Use deep purple, blood red, charcoal black, off-white — NEVER magenta or hot pink

EDGE QUALITY — strict requirement (CRITICAL):
- HARD 1-pixel boundary between boss pixels and magenta background
- NO anti-aliasing, NO soft edges, NO semi-transparent pixels at the silhouette
- NO pink/rose/light-magenta halo around the boss — clean sharp outline only
- Every pixel is EITHER fully opaque boss color OR exact pure magenta #ff00ff (255,0,255)
- All flame aura / red glow effects are stylized as solid pixel blocks INSIDE or directly adjacent to the silhouette — they must NOT bleed into the magenta background as gradients
- Purple robe must be DEEP purple (#6d28d9), red eyes must be saturated blood red (#ff5555) — keep all reds far from magenta hue
- ABSOLUTELY NO frame separator lines, NO vertical dividers, NO column borders, NO grid lines, NO gutters between the 4 frames — every column of pixels is either fully magenta background OR fully part of one of the 4 boss sprites. The 4 frames are placed flush against each other with NO visible boundary.

BOSS CHARACTER — same in every frame:
- Towering humanoid tyrant figure, broad shoulders, hunched menacing posture
- Deep royal purple robe (#6d28d9 family) with black charcoal armored shoulder pauldrons studded with sharp red spikes (#ff5555)
- Glowing blood-red eyes burning under a dark hood, no visible mouth (or fanged grin half hidden)
- Large clawed hands, dark gauntlets, swirling deep red flame aura licking off his shoulders (NOT pink)
- LEGS — strict requirement: the purple robe ends ABOVE the ankles, exposing dark armored greaves and heavy black metal boots clearly visible beneath the robe hem. Two visible legs standing apart in a stable wide stance. NO floating/levitation, NO body just dissolving into mist at the bottom — the boss is firmly grounded on TWO armored boots in EVERY frame.
- 16-bit SNES era pixel art style (Final Fight bosses / Castlevania / Demon's Crest)
- Sharp visible pixels, NO antialiasing, limited color palette
- Full body, frontal view, boss centered horizontally and vertically in each frame
- Inspired by: M.Bison (Street Fighter II), Sigma (Mega Man X), Ganon (Zelda), Belmont's Dracula

FRAMES — left to right:
- Frame 1 (leftmost): base menacing stance, arms hanging clawed at sides, robe still, eyes glowing red
- Frame 2: subtle aura inhale — flame aura on shoulders pulses larger by ~3 pixels outward, robe edge billows up slightly, eyes glow brighter
- Frame 3: base stance again, eyes narrow slightly (intimidating), aura returns to normal size
- Frame 4 (rightmost): subtle exhale — robe edge billows down by ~3 pixels, shoulders lowered, aura compressed inward, claws flex by ~1 pixel

Antagonistic context: this boss represents the looming dread of Stress / overwhelming illness. He must look IMPOSING, OPPRESSIVE, intimidating but stylized cartoonish (this is a charity game for kids fighting cancer — scary but not horror-graphic, no gore, no blood, no realistic violence).

Output: pure pixel art sprite-sheet, single PNG, 4 frames horizontally aligned, magenta #ff00ff background, NO text, NO watermark, NO frame numbers, NO grid lines between frames.`;

const ai = new GoogleGenAI({ apiKey });

const candidates = [
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-image-preview",
];

const outDir = path.resolve("public/sprites/.tmp");
const outPath = path.join(outDir, "stress-idle-raw.png");

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
        console.log("Next: node scripts/process-stress-sheet.mjs");
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
