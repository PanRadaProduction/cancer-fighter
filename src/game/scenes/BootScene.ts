import * as Phaser from "phaser";
import { createPlaceholderTextures } from "../assets/placeholders";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    createPlaceholderTextures(this);
  }

  create(): void {
    this.scene.start("MainMenuScene");
  }
}
