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
      frames: this.anims.generateFrameNumbers(SPRITES.hope, { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });
    this.scene.start("MainMenuScene");
  }
}
