import * as Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { StageScene } from "./scenes/StageScene";
import { StorySelectScene } from "./scenes/StorySelectScene";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export function createGameConfig(
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: "#0f0a1f",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 1100 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MainMenuScene, StorySelectScene, StageScene],
  };
}
