import * as Phaser from "phaser";
import { createPlaceholderTextures } from "../assets/placeholders";

export const SPRITES = {
  hope: "hope-sprite",
} as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    createPlaceholderTextures(this);
    this.load.spritesheet(SPRITES.hope, "/sprites/hope-idle.png", {
      frameWidth: 96,
      frameHeight: 144,
    });
  }

  create(): void {
    this.anims.create({
      key: "hope-idle",
      frames: [
        { key: SPRITES.hope, frame: 0 },
        { key: SPRITES.hope, frame: 2 },
        { key: SPRITES.hope, frame: 3 },
      ],
      frameRate: 4,
      repeat: -1,
    });
    this.scene.start("MainMenuScene");
  }
}
