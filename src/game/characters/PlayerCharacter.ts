import * as Phaser from "phaser";
import { sfx } from "../audio/sfx";

export type PlayerConfig = {
  textureKey: string;
  speed: number;
  jumpVelocity: number;
  maxHp: number;
  lightDamage: number;
  heavyDamage: number;
  lightCooldownMs: number;
  heavyCooldownMs: number;
  attackRange: number;
  attackHeight: number;
  bodyWidth: number;
  bodyHeight: number;
  bodyOffsetX: number;
  bodyOffsetY: number;
  /** Display size in pixels (renders at this size regardless of source texture). */
  displayWidth: number;
  displayHeight: number;
};

export abstract class PlayerCharacter extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  facing: 1 | -1 = 1;
  protected readonly config: PlayerConfig;
  private lastLightAt = 0;
  private lastHeavyAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlayerConfig) {
    super(scene, x, y, config.textureKey);
    this.config = config;
    this.hp = config.maxHp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setBounce(0.05);
    this.setOrigin(0.5, 1);
    this.setDisplaySize(config.displayWidth, config.displayHeight);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(config.bodyWidth, config.bodyHeight);
    body.setOffset(config.bodyOffsetX, config.bodyOffsetY);
  }

  abstract get displayName(): string;

  get maxHp(): number {
    return this.config.maxHp;
  }

  get lightDamage(): number {
    return this.config.lightDamage;
  }

  get heavyDamage(): number {
    return this.config.heavyDamage;
  }

  moveLeft(): void {
    this.setVelocityX(-this.config.speed);
    this.setFlipX(true);
    this.facing = -1;
  }

  moveRight(): void {
    this.setVelocityX(this.config.speed);
    this.setFlipX(false);
    this.facing = 1;
  }

  stopHorizontal(): void {
    this.setVelocityX(0);
  }

  jump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) {
      this.setVelocityY(this.config.jumpVelocity);
      sfx.playJump();
    }
  }

  tryLightAttack(now: number): Phaser.Geom.Rectangle | null {
    if (now - this.lastLightAt < this.config.lightCooldownMs) return null;
    this.lastLightAt = now;
    sfx.playLightAttack();
    return this.attackHitbox(this.config.attackRange);
  }

  tryHeavyAttack(now: number): Phaser.Geom.Rectangle | null {
    if (now - this.lastHeavyAt < this.config.heavyCooldownMs) return null;
    this.lastHeavyAt = now;
    sfx.playHeavyAttack();
    return this.attackHitbox(this.config.attackRange + 30);
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

  protected attackHitbox(range: number): Phaser.Geom.Rectangle {
    const x = this.facing === 1 ? this.x : this.x - range;
    return new Phaser.Geom.Rectangle(
      x,
      this.y - this.config.attackHeight,
      range,
      this.config.attackHeight,
    );
  }
}
