import * as Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Assety dojdą w kolejnych fazach (sprite'y postaci, tła, audio).
  }

  create(): void {
    this.scene.start("MainMenuScene");
  }
}
