import * as Phaser from "phaser";
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
  attackHeight: 120,
  bodyWidth: 70,
  bodyHeight: 140,
  bodyOffsetX: 13,
  bodyOffsetY: 4,
  displayWidth: 96,
  displayHeight: 144,
  idleAnimKey: "wise-idle",
};

export class Wise extends PlayerCharacter {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, WISE_CONFIG);
  }

  get displayName(): string {
    return "Mędrzec";
  }
}
