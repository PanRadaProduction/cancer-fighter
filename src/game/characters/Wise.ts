import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import { SPRITES } from "../scenes/BootScene";
import { PlayerCharacter, type PlayerConfig } from "./PlayerCharacter";

export const WISE_CONFIG: PlayerConfig = {
  textureKey: SPRITES.wise,
  speed: 220,
  jumpVelocity: -540,
  maxHp: 90,
  lightDamage: 5,
  heavyDamage: 12,
  lightCooldownMs: 220,
  heavyCooldownMs: 560,
  attackRange: 130,
  attackHeight: 168,
  bodyWidth: 98,
  bodyHeight: 196,
  bodyOffsetX: 18,
  bodyOffsetY: 6,
  displayWidth: 134,
  displayHeight: 202,
  idleAnimKey: "wise-idle",
  lightAnimKey: "wise-light",
  heavyAnimKey: "wise-heavy",
};

export class Wise extends PlayerCharacter {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const config = scene.textures.exists(SPRITES.wise)
      ? WISE_CONFIG
      : {
          ...WISE_CONFIG,
          textureKey: TEXTURES.wise,
          idleAnimKey: undefined,
        };
    super(scene, x, y, config);
  }

  get displayName(): string {
    return "Mędrzec";
  }
}
