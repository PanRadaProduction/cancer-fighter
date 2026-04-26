import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { SPRITES } from "./BootScene";

export type CharacterKey = "hope" | "brave" | "wise";

type AccentName = "amber" | "magenta" | "cyan";

type AccentPalette = {
  hex: number;
  cssHex: string;
  glowSoft: string;
};

const ACCENTS: Record<AccentName, AccentPalette> = {
  amber: { hex: 0xffd34d, cssHex: "#ffd34d", glowSoft: "#ffb300" },
  magenta: { hex: 0xff2bd6, cssHex: "#ff2bd6", glowSoft: "#ff63e0" },
  cyan: { hex: 0x6df6ff, cssHex: "#6df6ff", glowSoft: "#3ad4ff" },
};

const ARCADE_FONT = '"Press Start 2P", "Courier New", monospace';
const CRT_FONT = '"VT323", "Courier New", monospace';

type CharacterCard = {
  key: CharacterKey;
  name: string;
  role: string;
  unlocked: boolean;
  accent: AccentName;
  description: string;
  lockedLabel?: string;
};

type SelectMode = "story" | "coop";
type SelectPhase = "p1" | "p2";

export type SelectData = {
  mode?: SelectMode;
  phase?: SelectPhase;
  p1Character?: CharacterKey;
};

const ROSTER: CharacterCard[] = [
  {
    key: "hope",
    name: "NADZIEJA",
    role: "HERO · 01",
    unlocked: true,
    accent: "amber",
    description: "Promienie energii. Buduje pasek Combo Hope.",
  },
  {
    key: "brave",
    name: "ODWAGA",
    role: "HERO · 02",
    unlocked: false,
    accent: "magenta",
    description: "Szarża z tarczą. (wkrótce)",
  },
  {
    key: "wise",
    name: "DR. MEDRZEC",
    role: "HERO · 03",
    unlocked: false,
    accent: "cyan",
    description: "Leczące fale. (wkrótce)",
  },
];

export class StorySelectScene extends Phaser.Scene {
  private mode: SelectMode = "story";
  private phase: SelectPhase = "p1";
  private p1Character?: CharacterKey;

  constructor() {
    super({ key: "StorySelectScene" });
  }

  init(data: SelectData): void {
    this.mode = data.mode ?? "story";
    this.phase = data.phase ?? "p1";
    this.p1Character = data.p1Character;
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    this.drawBackdrop();

    const top = 64;
    this.drawHeader(cx, top);

    const viewRoster = this.buildViewRoster();
    const cardWidth = 290;
    const cardHeight = 420;
    const cardGap = 36;
    const totalWidth =
      viewRoster.length * cardWidth + (viewRoster.length - 1) * cardGap;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const cardsTop = 200;

    viewRoster.forEach((card, i) => {
      const x = startX + i * (cardWidth + cardGap);
      this.makeCard(x, cardsTop, cardWidth, cardHeight, card);
    });

    if (this.mode === "coop" && this.phase === "p2") {
      this.makeBackButton(GAME_WIDTH - 24, 36);
    }
    this.makeFooter(cx, GAME_HEIGHT - 28);
  }

  private drawBackdrop(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x04020e, 0x04020e, 0x0d0524, 0x140a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const sun = this.add.graphics();
    sun.fillStyle(0xff2bd6, 0.16);
    sun.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 360);
    sun.fillStyle(0x6d28d9, 0.18);
    sun.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 220);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x6df6ff, 0.08);
    for (let x = 0; x <= GAME_WIDTH; x += 48) {
      grid.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    grid.lineStyle(1, 0xff2bd6, 0.07);
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

  private drawHeader(cx: number, top: number): void {
    const isCoop = this.mode === "coop";
    const tag = isCoop
      ? this.phase === "p1"
        ? "★ CO-OP · P1 ★"
        : "★ CO-OP · P2 ★"
      : "★ STORY MODE ★";

    this.add
      .text(cx, top, tag, {
        fontFamily: ARCADE_FONT,
        fontSize: "10px",
        color: ACCENTS.magenta.cssHex,
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, ACCENTS.magenta.cssHex, 12, true, true);

    const title = isCoop
      ? this.phase === "p1"
        ? "WYBIERZ BOHATERA"
        : "WYBIERZ POSTAC P2"
      : "WYBIERZ BOHATERA";

    const titleText = this.add
      .text(cx, top + 44, title, {
        fontFamily: ARCADE_FONT,
        fontSize: "30px",
        color: "#fff7d6",
      })
      .setOrigin(0.5);
    titleText.setStroke(ACCENTS.magenta.cssHex, 4);
    titleText.setShadow(0, 0, ACCENTS.cyan.cssHex, 18, true, true);

    const subtitle = isCoop
      ? this.phase === "p1"
        ? "Wybierz pierwszą postać. P2 wskaże swoją po Tobie."
        : "Wybierz drugą postać — będzie walczyć ramię w ramię."
      : "Każda postać reprezentuje cechę w walce z chorobą.";

    this.add
      .text(cx, top + 88, subtitle, {
        fontFamily: CRT_FONT,
        fontSize: "20px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);
  }

  private buildViewRoster(): CharacterCard[] {
    return ROSTER.map((card) => {
      let unlocked = card.unlocked;
      let description = card.description;
      let lockedLabel = card.lockedLabel;
      if (this.mode === "coop" && card.key === "brave") {
        unlocked = true;
        description = "Szarża z tarczą. Mocniejszy cios.";
      }
      if (this.mode === "coop" && card.key === "wise") {
        unlocked = true;
        description = "Leczące fale. Cyan różdżka uzdrawiająca.";
      }
      if (
        this.mode === "coop" &&
        this.phase === "p2" &&
        this.p1Character &&
        card.key === this.p1Character
      ) {
        unlocked = false;
        description = "Wybrana przez P1.";
      }
      return { ...card, unlocked, description, lockedLabel };
    });
  }

  private makeCard(
    x: number,
    y: number,
    w: number,
    h: number,
    card: CharacterCard,
  ): void {
    const accent = ACCENTS[card.accent];
    const cx = x + w / 2;
    const cy = y + h / 2;
    const container = this.add.container(cx, cy);

    const inset = 8;
    const outerColor = card.unlocked ? accent.hex : 0x4b3c6b;
    const fillAlpha = card.unlocked ? 0.85 : 0.55;

    const outer = this.add
      .rectangle(0, 0, w, h, 0x04020e, fillAlpha)
      .setStrokeStyle(3, outerColor, card.unlocked ? 1 : 0.55);

    const innerFrame = this.add
      .rectangle(0, 0, w - inset * 2, h - inset * 2, 0x0d0524, 0.7)
      .setStrokeStyle(1, outerColor, card.unlocked ? 0.6 : 0.35);

    const portraitH = 200;
    const portraitY = -h / 2 + portraitH / 2 + 26;

    const portraitFrame = this.add.graphics();
    portraitFrame.lineStyle(2, outerColor, card.unlocked ? 0.85 : 0.4);
    portraitFrame.strokeRect(
      -(w - 60) / 2,
      portraitY - portraitH / 2,
      w - 60,
      portraitH,
    );

    const portraitBg = this.add.graphics();
    portraitBg.fillStyle(accent.hex, card.unlocked ? 0.12 : 0.05);
    portraitBg.fillRect(
      -(w - 60) / 2,
      portraitY - portraitH / 2,
      w - 60,
      portraitH,
    );

    container.add([outer, innerFrame, portraitFrame, portraitBg]);

    const portraitNode = this.makePortrait(card, portraitY, accent);
    container.add(portraitNode);

    const roleTag = this.add
      .text(0, -h / 2 + 14, card.role, {
        fontFamily: ARCADE_FONT,
        fontSize: "9px",
        color: accent.cssHex,
      })
      .setOrigin(0.5);
    roleTag.setShadow(0, 0, accent.glowSoft, 10, true, true);
    container.add(roleTag);

    const name = this.add
      .text(0, h / 2 - 130, card.name, {
        fontFamily: ARCADE_FONT,
        fontSize: "16px",
        color: card.unlocked ? "#fff7d6" : "#94a3b8",
      })
      .setOrigin(0.5);
    if (card.unlocked) {
      name.setShadow(0, 0, accent.cssHex, 14, true, true);
    }

    const desc = this.add
      .text(0, h / 2 - 86, card.description, {
        fontFamily: CRT_FONT,
        fontSize: "18px",
        color: card.unlocked ? "#cbd5e1" : "#64748b",
        wordWrap: { width: w - 60 },
        align: "center",
      })
      .setOrigin(0.5, 0);

    const action = this.makeActionButton(card, accent, h);

    container.add([name, desc, action.root]);

    if (card.unlocked) {
      const hit = this.add
        .rectangle(0, 0, w, h, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true });
      container.add(hit);

      hit.on("pointerover", () => {
        container.setScale(1.04);
        outer.setStrokeStyle(3, accent.hex, 1);
        action.bg.setFillStyle(accent.hex, 1);
      });
      hit.on("pointerout", () => {
        container.setScale(1);
        outer.setStrokeStyle(3, accent.hex, 1);
        action.bg.setFillStyle(accent.hex, 0.85);
      });
      hit.on("pointerdown", () => {
        this.cameras.main.fade(280, 4, 2, 14);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.handleSelection(card.key);
        });
      });
    } else {
      const lock = this.add
        .text(0, portraitY, "🔒", {
          fontFamily: CRT_FONT,
          fontSize: "48px",
          color: "#94a3b8",
        })
        .setOrigin(0.5)
        .setAlpha(0.65);
      container.add(lock);
    }
  }

  private makePortrait(
    card: CharacterCard,
    portraitY: number,
    accent: AccentPalette,
  ): Phaser.GameObjects.GameObject {
    const heroSprites: Partial<
      Record<CharacterKey, { texture: string; anim: string }>
    > = {
      hope: { texture: SPRITES.hope, anim: "hope-idle" },
      brave: { texture: SPRITES.brave, anim: "brave-idle" },
      wise: { texture: SPRITES.wise, anim: "wise-idle" },
    };
    const PORTRAIT_SCALE: Record<CharacterKey, number> = {
      hope: 1.1,
      brave: 1.55,
      wise: 1.55,
    };
    const heroSprite = heroSprites[card.key];
    if (heroSprite && this.textures.exists(heroSprite.texture)) {
      const sprite = this.add.sprite(0, portraitY + 8, heroSprite.texture, 0);
      sprite.setOrigin(0.5);
      sprite.setScale(PORTRAIT_SCALE[card.key]);
      if (this.anims.exists(heroSprite.anim)) {
        sprite.play(heroSprite.anim);
      }
      return sprite;
    }

    const placeholder = this.add.container(0, portraitY);
    const bodyW = 96;
    const bodyH = 144;
    const grid = this.add.graphics();
    grid.fillStyle(accent.hex, card.unlocked ? 0.22 : 0.1);
    for (let py = -bodyH / 2; py < bodyH / 2; py += 8) {
      for (let px = -bodyW / 2; px < bodyW / 2; px += 8) {
        if ((px / 8 + py / 8) % 2 === 0) {
          grid.fillRect(px, py, 8, 8);
        }
      }
    }
    const border = this.add.graphics();
    border.lineStyle(2, accent.hex, card.unlocked ? 0.9 : 0.45);
    border.strokeRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

    const mark = this.add
      .text(0, 0, "?", {
        fontFamily: ARCADE_FONT,
        fontSize: "48px",
        color: accent.cssHex,
      })
      .setOrigin(0.5);
    if (card.unlocked) {
      mark.setShadow(0, 0, accent.cssHex, 16, true, true);
    } else {
      mark.setAlpha(0.5);
    }

    placeholder.add([grid, border, mark]);
    return placeholder;
  }

  private makeActionButton(
    card: CharacterCard,
    accent: AccentPalette,
    h: number,
  ): {
    root: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Rectangle;
  } {
    const btn = this.add.container(0, h / 2 - 36);
    const w = 180;
    const bh = 32;

    const bg = this.add
      .rectangle(0, 0, w, bh, accent.hex, card.unlocked ? 0.85 : 0.18)
      .setStrokeStyle(2, accent.hex, card.unlocked ? 1 : 0.45);

    const label = card.unlocked
      ? "▶ ZAGRAJ"
      : (card.lockedLabel ?? "✕ WKROTCE");
    const text = this.add
      .text(0, 0, label, {
        fontFamily: ARCADE_FONT,
        fontSize: "11px",
        color: card.unlocked ? "#04020e" : "#94a3b8",
      })
      .setOrigin(0.5);
    btn.add([bg, text]);
    return { root: btn, bg };
  }

  private handleSelection(character: CharacterKey): void {
    if (this.mode === "story") {
      this.scene.start("StageScene", { stage: 1, character });
      return;
    }
    if (this.phase === "p1") {
      this.scene.start("StorySelectScene", {
        mode: "coop",
        phase: "p2",
        p1Character: character,
      });
      return;
    }
    this.scene.start("CoopScene", {
      p1Character: this.p1Character ?? "hope",
      p2Character: character,
    });
  }

  private makeBackButton(x: number, y: number): void {
    const isP2 = this.mode === "coop" && this.phase === "p2";
    const label = isP2 ? "◀ COFNIJ DO P1" : "◀ MENU";
    const btn = this.add
      .text(x, y, label, {
        fontFamily: ARCADE_FONT,
        fontSize: "10px",
        color: ACCENTS.cyan.cssHex,
        backgroundColor: "#04020e",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    btn.setStroke(ACCENTS.cyan.cssHex, 2);
    btn.setShadow(0, 0, ACCENTS.cyan.cssHex, 10, true, true);

    btn.on("pointerover", () => btn.setColor("#fff7d6"));
    btn.on("pointerout", () => btn.setColor(ACCENTS.cyan.cssHex));
    btn.on("pointerdown", () => {
      if (isP2) {
        this.scene.start("StorySelectScene", { mode: "coop", phase: "p1" });
      } else {
        this.scene.start("MainMenuScene");
      }
    });
  }

  private makeFooter(cx: number, y: number): void {
    this.add
      .text(cx, y, "CLICK · TAP · ZAGRAJ", {
        fontFamily: ARCADE_FONT,
        fontSize: "9px",
        color: "#6b7e9c",
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0.6);
  }
}
