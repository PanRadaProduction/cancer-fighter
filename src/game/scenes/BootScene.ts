import * as Phaser from "phaser";
import { createPlaceholderTextures } from "../assets/placeholders";

export const SPRITES = {
  hope: "hope-sprite",
  brave: "brave-sprite",
  wise: "wise-sprite",
  stress: "stress-sprite",
  darkness: "darkness-sprite",
} as const;

const HERO_FRAME = { width: 96, height: 144 } as const;
const BOSS_FRAME = { width: 192, height: 288 } as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    createPlaceholderTextures(this);
    this.load.spritesheet(SPRITES.hope, "/sprites/hope-idle.png", {
      frameWidth: HERO_FRAME.width,
      frameHeight: HERO_FRAME.height,
      endFrame: 4,
    });
    this.load.spritesheet(SPRITES.brave, "/sprites/brave-idle.png", {
      frameWidth: HERO_FRAME.width,
      frameHeight: HERO_FRAME.height,
      endFrame: 3,
    });
    this.load.spritesheet(SPRITES.wise, "/sprites/wise-idle.png", {
      frameWidth: HERO_FRAME.width,
      frameHeight: HERO_FRAME.height,
      endFrame: 3,
    });
    this.load.spritesheet(SPRITES.stress, "/sprites/stress-idle.png", {
      frameWidth: BOSS_FRAME.width,
      frameHeight: BOSS_FRAME.height,
      endFrame: 3,
    });
    this.load.spritesheet(SPRITES.darkness, "/sprites/darkness-idle.png", {
      frameWidth: BOSS_FRAME.width,
      frameHeight: BOSS_FRAME.height,
      endFrame: 3,
    });
  }

  create(): void {
    if (this.textures.exists(SPRITES.hope)) {
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
      this.anims.create({
        key: "hope-light",
        frames: [{ key: SPRITES.hope, frame: 1 }],
        frameRate: 5,
        repeat: 0,
      });
      this.anims.create({
        key: "hope-heavy",
        frames: [{ key: SPRITES.hope, frame: 4 }],
        frameRate: 4,
        repeat: 0,
      });
    }

    this.registerIdle("brave-idle", SPRITES.brave);
    this.registerIdle("wise-idle", SPRITES.wise);
    this.registerIdle("stress-idle", SPRITES.stress);
    this.registerIdle("darkness-idle", SPRITES.darkness);

    const mode = this.registry.get("launchMode") as
      | "story"
      | "coop"
      | undefined;
    if (mode === "coop") {
      this.scene.start("StorySelectScene", { mode: "coop", phase: "p1" });
    } else if (mode === "story") {
      this.scene.start("StorySelectScene", { mode: "story" });
    } else {
      this.scene.start("MainMenuScene");
    }
  }

  private registerIdle(animKey: string, textureKey: string): void {
    if (!this.textures.exists(textureKey)) return;
    this.anims.create({
      key: animKey,
      frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });
  }
}
