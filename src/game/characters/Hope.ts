import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import { sfx } from "../audio/sfx";

export const HOPE_CONFIG = {
  speed: 240,
  jumpVelocity: -560,
  maxHp: 100,
  lightDamage: 6,
  heavyDamage: 14,
  lightCooldownMs: 240,
  heavyCooldownMs: 520,
  attackRange: 110,
  attackHeight: 120,
} as const;

export class Hope extends Phaser.Physics.Arcade.Sprite {
  hp: number = HOPE_CONFIG.maxHp;
  facing: 1 | -1 = 1;
  private lastLightAt = 0;
  private lastHeavyAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURES.hope);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setBounce(0.05);
    this.setOrigin(0.5, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(70, 140);
    body.setOffset(13, 4);
  }

  moveLeft(): void {
    this.setVelocityX(-HOPE_CONFIG.speed);
    this.setFlipX(true);
    this.facing = -1;
  }

  moveRight(): void {
    this.setVelocityX(HOPE_CONFIG.speed);
    this.setFlipX(false);
    this.facing = 1;
  }

  stopHorizontal(): void {
    this.setVelocityX(0);
  }

  jump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) {
      this.setVelocityY(HOPE_CONFIG.jumpVelocity);
      sfx.playJump();
    }
  }

  tryLightAttack(now: number): Phaser.Geom.Rectangle | null {
    if (now - this.lastLightAt < HOPE_CONFIG.lightCooldownMs) return null;
    this.lastLightAt = now;
    sfx.playLightAttack();
    return this.attackHitbox(HOPE_CONFIG.attackRange);
  }

  tryHeavyAttack(now: number): Phaser.Geom.Rectangle | null {
    if (now - this.lastHeavyAt < HOPE_CONFIG.heavyCooldownMs) return null;
    this.lastHeavyAt = now;
    sfx.playHeavyAttack();
    return this.attackHitbox(HOPE_CONFIG.attackRange + 30);
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    sfx.playPlayerHurt();
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      duration: 80,
      yoyo: true,
      repeat: 2,
    });
  }

  private attackHitbox(range: number): Phaser.Geom.Rectangle {
    const x =
      this.facing === 1 ? this.x : this.x - range;
    return new Phaser.Geom.Rectangle(
      x,
      this.y - HOPE_CONFIG.attackHeight,
      range,
      HOPE_CONFIG.attackHeight,
    );
  }
}
