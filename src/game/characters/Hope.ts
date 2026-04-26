import * as Phaser from "phaser";
import { SPRITES } from "../scenes/BootScene";
import { PlayerCharacter, type PlayerConfig } from "./PlayerCharacter";

export const HOPE_CONFIG: PlayerConfig = {
  textureKey: SPRITES.hope,
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
  displayWidth: 96,
  displayHeight: 144,
  idleAnimKey: "hope-idle",
};

export class Hope extends PlayerCharacter {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, HOPE_CONFIG);
  }

  get displayName(): string {
    return "Nadzieja";
  }
}
