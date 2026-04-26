import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set. Run with: node --env-file=.env.local scripts/gen-hero-page-sf2.mjs");
  process.exit(1);
}

const REFERENCE_PATH = "/Users/panrada/Library/Application Support/Dropshare 5/cancer-fighter-hero-page-rWCl.png";
const OUT_PATH = path.resolve("assets/landing/cancer-fighter-hero-sf2.png");

const prompt = `Restyle this charity-game landing page as a Capcom Street Fighter II 1991 arcade attract screen, 16-bit pixel-art aesthetic. Keep the overall page layout (hero center, CTA below, support card with QR, footer), but completely transform the visual treatment.

PRESERVE EXACTLY (text rendering must be 1:1, including Polish diacritics):
- "HEROES OF HOPE" (eyebrow, gold)
- "Cancer Fighter" (main title)
- "Charytatywna gra retro pixel art wspierająca walkę z rakiem dziecięcym. Każda rozegrana minuta to symboliczny krok obok dzieci, które walczą naprawdę."
- "▶ Zagraj teraz" (CTA button)
- "Wesprzyj akcję teraz" (card title)
- The QR code MUST stay clean, white, sharp and SCANNABLE — do not stylize the QR pattern itself
- "Zeskanuj telefonem i wesprzyj walkę z rakiem dziecięcym"
- "Płatność przez Tipply"
- "Projekt w fazie pre-produkcji. Status zbiórki będzie publiczny."

ARCADE/SF2 ELEMENTS TO ADD:
1. Pixel-art title logo "HEROES OF HOPE / CANCER FIGHTER" — thick chrome-gold bevel with black outline, slight perspective tilt, drop shadow, like the Street Fighter II title screen.
2. Character roster row beneath the title: 3 chunky pixel-art portraits in beveled arcade frames with monospace name tags:
   - NADZIEJA (HOPE) — golden #FBBF24 hooded young heroine with light beams, fighting stance
   - ODWAGA (BRAVE) — red #DC2626 warrior with yellow #FDE047 shield emblem, ready pose
   - DR MĘDRZEC (WISE DOC) — blue #60A5FA medic with healing aura, calm stance
3. Boss silhouettes looming faintly in the background (semi-transparent, behind heroes):
   - LEFT: LORD STRES — purple #6D28D9 hulking figure, red #F87171 glowing eyes
   - RIGHT: PANI CIEMNOŚĆ — black cloak #1F2937, violet #C4B5FD glowing eyes, teleport sparkles
4. Arcade HUD frame around the page: thick dithered pixel border, "PRESS START" microtext top-left, "INSERT COIN" top-right, faint CRT scanlines overlay (~8% opacity, do not obscure text).
5. CTA "▶ Zagraj teraz" — chunky pixel-art button, gold #FCD34D fill, black bevel/shadow, monospace bold.
6. Support card "Wesprzyj akcję teraz" — framed in a pixel-art arcade window (beveled border, marquee-style title bar), QR remains pristine inside.
7. Background — gradient indigo #1E1B4B → deep purple #0F0A1F, subtle pixel-grid floor, faint Hospital Playroom silhouette (Stage 1) far back.
8. Typography — monospace bold for title and CTA, classic SF2 outlined letters; body copy stays legible.

STYLE: 16-bit pixel art, sharp clean pixels, NO antialias blur, NO photorealism, arcade neon glow, cinematic 16:9 web hero composition. Polish diacritics (ą ę ć ś ź ż ł ó ń) must render correctly.`;

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
          aspectRatio: "16:9",
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
