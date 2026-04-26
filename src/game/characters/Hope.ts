import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import { PlayerCharacter, type PlayerConfig } from "./PlayerCharacter";

export const HOPE_CONFIG: PlayerConfig = {
  textureKey: TEXTURES.hope,
  speed: 240,
  jumpVelocity: -560,
  maxHp: 100,
  lightDamage: 6,
  heavyDamage: 14,
  lightCooldownMs: 240,
  heavyCooldownMs: 520,
  attackRange: 110,
  attackHeight: 120,
  bodyWidth: 70,
  bodyHeight: 140,
  bodyOffsetX: 13,
  bodyOffsetY: 4,
};

export class Hope extends PlayerCharacter {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, HOPE_CONFIG);
  }

  get displayName(): string {
    return "Nadzieja";
  }
}
