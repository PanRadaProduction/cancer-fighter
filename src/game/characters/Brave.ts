import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import { SPRITES } from "../scenes/BootScene";
import { PlayerCharacter, type PlayerConfig } from "./PlayerCharacter";

export const BRAVE_CONFIG: PlayerConfig = {
  textureKey: SPRITES.brave,
  speed: 210,
  jumpVelocity: -520,
  maxHp: 130,
  lightDamage: 9,
  heavyDamage: 18,
  lightCooldownMs: 280,
  heavyCooldownMs: 600,
  attackRange: 100,
  attackHeight: 182,
  bodyWidth: 106,
  bodyHeight: 196,
  bodyOffsetX: 14,
  bodyOffsetY: 6,
  displayWidth: 134,
  displayHeight: 202,
  idleAnimKey: "brave-idle",
  lightAnimKey: "brave-light",
  heavyAnimKey: "brave-heavy",
};

export class Brave extends PlayerCharacter {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const config = scene.textures.exists(SPRITES.brave)
      ? BRAVE_CONFIG
      : {
          ...BRAVE_CONFIG,
          textureKey: TEXTURES.brave,
          idleAnimKey: undefined,
        };
    super(scene, x, y, config);
  }

  get displayName(): string {
    return "Odwaga";
  }
}
