import * as Phaser from "phaser";
import { DONATION } from "@/lib/donation";
import { bgm } from "../audio/bgm";
import { sfx } from "../audio/sfx";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainMenuScene" });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.input.once("pointerdown", () => {
      sfx.unlock();
      bgm.play("menu");
    });
    // Po powrocie z innej sceny AudioContext jest już odblokowany — wznowi
    // BGM od razu. Przy pierwszym wejściu poczeka na pointerdown wyżej.
    bgm.play("menu");

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1e1b4b, 0x1e1b4b, 0x0f0a1f, 0x0f0a1f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add
      .text(cx, cy - 220, "HEROES OF HOPE", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#fcd34d",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 150, "CANCER FIGHTER", {
        fontFamily: "monospace",
        fontSize: "84px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 70, "charytatywna gra retro pixel art", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);

    const buttonY = cy + 30;
    const buttonGap = 70;

    this.makeButton(cx, buttonY, "▶  PLAY", () => {
      this.cameras.main.fade(250, 15, 10, 31);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("StorySelectScene");
      });
    });
    this.makeButton(cx, buttonY + buttonGap, "   TRAINING (wkrótce)", () => {
      this.cameras.main.flash(150, 167, 139, 250);
    });
    this.makeButton(cx, buttonY + 2 * buttonGap, "♥  WESPRZYJ AKCJĘ", () => {
      window.open(DONATION.url, "_blank", "noopener,noreferrer");
    });

    this.add
      .text(cx, GAME_HEIGHT - 30, "Pre-produkcja • v0.1.0", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#64748b",
      })
      .setOrigin(0.5);
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): void {
    const text = this.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#312e81",
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    text.on("pointerover", () =>
      text.setStyle({ backgroundColor: "#4338ca" }),
    );
    text.on("pointerout", () =>
      text.setStyle({ backgroundColor: "#312e81" }),
    );
    text.on("pointerdown", onClick);
  }
}
