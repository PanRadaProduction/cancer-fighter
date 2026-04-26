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
    this.load.image(SPRITES.hope, "/sprites/hope-idle.png");
  }

  create(): void {
    this.scene.start("MainMenuScene");
  }
}
