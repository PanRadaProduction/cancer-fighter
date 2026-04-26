import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { bgm } from "../audio/bgm";
import type { CharacterKey } from "./StorySelectScene";

type CoopCharacter = Exclude<CharacterKey, "wise">;

type GameOverMode = "story" | "coop";
type Outcome = "victory" | "defeat";

export type GameOverData = {
  outcome: Outcome;
  mode: GameOverMode;
  character?: CharacterKey;
  p1Character?: CoopCharacter;
  p2Character?: CoopCharacter;
};

const ARCADE_FONT = '"Press Start 2P", "Courier New", monospace';
const CRT_FONT = '"VT323", "Courier New", monospace';

const ACCENTS = {
  amber: { hex: 0xffd34d, cssHex: "#ffd34d", glowSoft: "#ffb300" },
  magenta: { hex: 0xff2bd6, cssHex: "#ff2bd6", glowSoft: "#ff63e0" },
  cyan: { hex: 0x6df6ff, cssHex: "#6df6ff", glowSoft: "#3ad4ff" },
} as const;

const CHARACTER_NAMES: Record<CharacterKey, string> = {
  hope: "NADZIEJA",
  brave: "ODWAGA",
  wise: "DR. MĘDRZEC",
};

export class GameOverScene extends Phaser.Scene {
  private outcome: Outcome = "defeat";
  private mode: GameOverMode = "story";
  private character: CharacterKey = "hope";
  private p1Character: CoopCharacter = "hope";
  private p2Character: CoopCharacter = "brave";

  constructor() {
    super({ key: "GameOverScene" });
  }

  init(data: GameOverData): void {
    this.outcome = data.outcome ?? "defeat";
    this.mode = data.mode ?? "story";
    this.character = data.character ?? "hope";
    this.p1Character = data.p1Character ?? "hope";
    this.p2Character = data.p2Character ?? "brave";
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    this.drawBackdrop();
    bgm.play("menu");

    const isVictory = this.outcome === "victory";
    const accent = isVictory ? ACCENTS.amber : ACCENTS.magenta;

    const tag = isVictory ? "★ ZWYCIĘSTWO ★" : "★ GAME OVER ★";
    this.add
      .text(cx, 140, tag, {
        fontFamily: ARCADE_FONT,
        fontSize: "12px",
        color: accent.cssHex,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, accent.glowSoft, 14, true, true);

    const title = isVictory ? "KAMPANIA UKOŃCZONA" : "POTRZEBNA REGENERACJA";
    const titleText = this.add
      .text(cx, 220, title, {
        fontFamily: ARCADE_FONT,
        fontSize: "44px",
        color: "#fff7d6",
        align: "center",
      })
      .setOrigin(0.5);
    titleText.setStroke(accent.cssHex, 5);
    titleText.setShadow(0, 0, ACCENTS.cyan.cssHex, 20, true, true);

    const subtitle = isVictory
      ? "Pani Ciemność rozpłynęła się w świetle.\nDziękujemy za walkę obok dzieci."
      : "Złap oddech, zbierz nadzieję\ni wróć silniejszy.";
    this.add
      .text(cx, 320, subtitle, {
        fontFamily: CRT_FONT,
        fontSize: "24px",
        color: "#cbd5e1",
        align: "center",
      })
      .setOrigin(0.5);

    const stats = this.buildStatsLine();
    this.add
      .text(cx, 410, stats, {
        fontFamily: ARCADE_FONT,
        fontSize: "11px",
        color: ACCENTS.cyan.cssHex,
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, ACCENTS.cyan.cssHex, 10, true, true);

    this.makeButton(cx, 500, "▶ ZAGRAJ PONOWNIE", ACCENTS.amber, () => {
      this.cameras.main.fade(280, 4, 2, 14);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.replay();
      });
    });

    this.makeButton(cx, 580, "◀ MENU GŁÓWNE", ACCENTS.cyan, () => {
      this.cameras.main.fade(280, 4, 2, 14);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        bgm.stop();
        if (typeof window !== "undefined") {
          window.location.assign("/");
        }
      });
    });

    this.add
      .text(cx, GAME_HEIGHT - 40, "★ HEROES OF HOPE ★ CHARYTATYWNA AKCJA ★", {
        fontFamily: ARCADE_FONT,
        fontSize: "9px",
        color: "#6b7e9c",
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0.7);
  }

  private drawBackdrop(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x04020e, 0x04020e, 0x0d0524, 0x140a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const sun = this.add.graphics();
    const sunColor =
      this.outcome === "victory" ? ACCENTS.amber.hex : ACCENTS.magenta.hex;
    sun.fillStyle(sunColor, 0.16);
    sun.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 360);
    sun.fillStyle(0x6d28d9, 0.18);
    sun.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 220);

    const grid = this.add.graphics();
    grid.lineStyle(1, ACCENTS.cyan.hex, 0.08);
    for (let x = 0; x <= GAME_WIDTH; x += 48) {
      grid.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    grid.lineStyle(1, ACCENTS.magenta.hex, 0.07);
    for (let y = 0; y <= GAME_HEIGHT; y += 48) {
      grid.lineBetween(0, y, GAME_WIDTH, y);
    }

    const scan = this.add.graphics();
    scan.fillStyle(0x000000, 0.18);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      scan.fillRect(0, y, GAME_WIDTH, 2);
    }
    scan.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  private buildStatsLine(): string {
    if (this.mode === "coop") {
      return `CO-OP · ${CHARACTER_NAMES[this.p1Character]} + ${CHARACTER_NAMES[this.p2Character]}`;
    }
    return `STORY · ${CHARACTER_NAMES[this.character]}`;
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    accent: (typeof ACCENTS)[keyof typeof ACCENTS],
    onClick: () => void,
  ): void {
    const btn = this.add
      .text(x, y, label, {
        fontFamily: ARCADE_FONT,
        fontSize: "16px",
        color: accent.cssHex,
        backgroundColor: "#04020e",
        padding: { x: 22, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.setStroke(accent.cssHex, 2);
    btn.setShadow(0, 0, accent.cssHex, 14, true, true);

    btn.on("pointerover", () => {
      btn.setColor("#fff7d6");
      btn.setScale(1.05);
    });
    btn.on("pointerout", () => {
      btn.setColor(accent.cssHex);
      btn.setScale(1);
    });
    btn.on("pointerdown", onClick);
  }

  private replay(): void {
    if (this.mode === "coop") {
      this.scene.start("CoopScene", {
        p1Character: this.p1Character,
        p2Character: this.p2Character,
      });
      return;
    }
    this.scene.start("StageScene", {
      stage: 1,
      character: this.character,
    });
  }
}
