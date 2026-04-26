import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import { PlayerCharacter, type PlayerConfig } from "./PlayerCharacter";

export const BRAVE_CONFIG: PlayerConfig = {
  textureKey: TEXTURES.brave,
  speed: 210,
  jumpVelocity: -520,
  maxHp: 130,
  lightDamage: 9,
  heavyDamage: 18,
  lightCooldownMs: 280,
  heavyCooldownMs: 600,
  attackRange: 100,
  attackHeight: 130,
  bodyWidth: 76,
  bodyHeight: 140,
  bodyOffsetX: 10,
  bodyOffsetY: 4,
  displayWidth: 96,
  displayHeight: 144,
};

export class Brave extends PlayerCharacter {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, BRAVE_CONFIG);
  }

  get displayName(): string {
    return "Odwaga";
  }
}
