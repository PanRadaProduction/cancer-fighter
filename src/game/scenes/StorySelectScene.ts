import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

type CharacterCard = {
  key: "hope" | "brave" | "wise";
  name: string;
  unlocked: boolean;
  color: number;
  description: string;
};

const ROSTER: CharacterCard[] = [
  {
    key: "hope",
    name: "Nadzieja",
    unlocked: true,
    color: 0xfbbf24,
    description: "Promienie energii. Buduje pasek Combo Hope.",
  },
  {
    key: "brave",
    name: "Odwaga",
    unlocked: false,
    color: 0xf87171,
    description: "Szarża z tarczą. (wkrótce)",
  },
  {
    key: "wise",
    name: "Doktor Mędrzec",
    unlocked: false,
    color: 0x60a5fa,
    description: "Leczące fale. (wkrótce)",
  },
];

export class StorySelectScene extends Phaser.Scene {
  constructor() {
    super({ key: "StorySelectScene" });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x312e81, 0x312e81, 0x0f0a1f, 0x0f0a1f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add
      .text(cx, 80, "WYBIERZ BOHATERA", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 130, "Każda postać reprezentuje cechę w walce z chorobą.", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);

    const cardWidth = 280;
    const cardGap = 40;
    const totalWidth = ROSTER.length * cardWidth + (ROSTER.length - 1) * cardGap;
    const startX = (GAME_WIDTH - totalWidth) / 2;

    ROSTER.forEach((card, i) => {
      const x = startX + i * (cardWidth + cardGap);
      this.makeCard(x, 200, cardWidth, 380, card);
    });

    this.makeBackButton(60, GAME_HEIGHT - 50);
  }

  private makeCard(
    x: number,
    y: number,
    w: number,
    h: number,
    card: CharacterCard,
  ): void {
    const container = this.add.container(x + w / 2, y + h / 2);
    const bgRect = this.add
      .rectangle(0, 0, w, h, card.unlocked ? 0x1e1b4b : 0x1f2937, 0.9)
      .setStrokeStyle(3, card.unlocked ? card.color : 0x475569);

    const portrait = this.add.rectangle(0, -h / 4, w - 80, 160, card.color);
    const initial = this.add
      .text(0, -h / 4, card.name.charAt(0), {
        fontFamily: "monospace",
        fontSize: "96px",
        color: "#1e1b4b",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const name = this.add
      .text(0, h / 4 - 60, card.name, {
        fontFamily: "monospace",
        fontSize: "24px",
        color: card.unlocked ? "#ffffff" : "#94a3b8",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const desc = this.add
      .text(0, h / 4 - 20, card.description, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: card.unlocked ? "#cbd5e1" : "#64748b",
        wordWrap: { width: w - 40 },
        align: "center",
      })
      .setOrigin(0.5);

    const action = this.add
      .text(
        0,
        h / 4 + 40,
        card.unlocked ? "▶ ZAGRAJ" : "🔒 WKRÓTCE",
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: card.unlocked ? "#1e1b4b" : "#64748b",
          backgroundColor: card.unlocked ? "#fbbf24" : "#1f2937",
          padding: { x: 16, y: 8 },
        },
      )
      .setOrigin(0.5);

    container.add([bgRect, portrait, initial, name, desc, action]);

    if (card.unlocked) {
      bgRect.setInteractive({ useHandCursor: true });
      bgRect.on("pointerover", () => {
        container.setScale(1.03);
      });
      bgRect.on("pointerout", () => {
        container.setScale(1);
      });
      bgRect.on("pointerdown", () => {
        this.cameras.main.fade(300, 15, 10, 31);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("StageScene", { character: card.key });
        });
      });
    }
  }

  private makeBackButton(x: number, y: number): void {
    const btn = this.add
      .text(x, y, "← MENU", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#1e1b4b",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => this.scene.start("MainMenuScene"));
  }
}
