import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import type { Hope } from "./Hope";

export type BossSpec = {
  key: "stress" | "darkness";
  name: string;
  textureKey: string;
  width: number;
  height: number;
  maxHp: number;
  speed: number;
  attackDamage: number;
  attackRange: number;
  attackTelegraphMs: number;
  attackActiveMs: number;
  attackCooldownMs: number;
  knockbackVelocity: number;
  tintFlash: number;
  labelColor: string;
};

export const BOSS_SPECS: Record<BossSpec["key"], BossSpec> = {
  stress: {
    key: "stress",
    name: "LORD STRES",
    textureKey: TEXTURES.stress,
    width: 192,
    height: 288,
    maxHp: 200,
    speed: 70,
    attackDamage: 10,
    attackRange: 180,
    attackTelegraphMs: 600,
    attackActiveMs: 220,
    attackCooldownMs: 1600,
    knockbackVelocity: -340,
    tintFlash: 0xff5555,
    labelColor: "#f87171",
  },
  darkness: {
    key: "darkness",
    name: "PANI CIEMNOŚĆ",
    textureKey: TEXTURES.darkness,
    width: 192,
    height: 288,
    maxHp: 280,
    speed: 110,
    attackDamage: 14,
    attackRange: 220,
    attackTelegraphMs: 450,
    attackActiveMs: 260,
    attackCooldownMs: 1300,
    knockbackVelocity: -380,
    tintFlash: 0xa78bfa,
    labelColor: "#c4b5fd",
  },
};

type BossState = "idle" | "approach" | "telegraph" | "attack" | "cooldown";

export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly spec: BossSpec;
  hp: number;
  state: BossState = "idle";
  private nextActionAt = 0;
  private attackHitbox: Phaser.Geom.Rectangle | null = null;
  private telegraphIndicator: Phaser.GameObjects.Rectangle | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, spec: BossSpec) {
    super(scene, x, y, spec.textureKey);
    this.spec = spec;
    this.hp = spec.maxHp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(spec.width - 16, spec.height - 16);
    body.setOffset(8, 8);
    body.allowGravity = false;
    this.setImmovable(true);
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    this.scene.tweens.add({
      targets: this,
      tint: this.spec.tintFlash,
      duration: 60,
      yoyo: true,
      onComplete: () => this.clearTint(),
    });
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  /**
   * Returns the active attack hitbox if currently in `attack` state and the
   * hitbox is live, otherwise null. Caller resolves overlap with the player.
   */
  getActiveHitbox(): Phaser.Geom.Rectangle | null {
    return this.state === "attack" ? this.attackHitbox : null;
  }

  tick(time: number, hope: Hope): void {
    if (this.isDead()) {
      this.setVelocityX(0);
      return;
    }

    const dx = hope.x - this.x;
    const distance = Math.abs(dx);
    const facing = dx >= 0 ? 1 : -1;
    this.setFlipX(facing === -1);

    switch (this.state) {
      case "idle":
      case "cooldown":
        this.setVelocityX(0);
        if (time >= this.nextActionAt) {
          this.state = "approach";
        }
        break;
      case "approach":
        if (distance > this.spec.attackRange * 0.85) {
          this.setVelocityX(facing * this.spec.speed);
        } else {
          this.setVelocityX(0);
          this.startTelegraph(time, facing);
        }
        break;
      case "telegraph":
        this.setVelocityX(0);
        if (time >= this.nextActionAt) {
          this.executeAttack(facing);
        }
        break;
      case "attack":
        this.setVelocityX(0);
        if (time >= this.nextActionAt) {
          this.endAttack(time);
        }
        break;
    }
  }

  private startTelegraph(time: number, facing: 1 | -1): void {
    this.state = "telegraph";
    this.nextActionAt = time + this.spec.attackTelegraphMs;

    const rect = this.computeAttackRect(facing);
    this.telegraphIndicator = this.scene.add.rectangle(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      rect.width,
      rect.height,
      this.spec.tintFlash,
      0.25,
    );
    this.scene.tweens.add({
      targets: this.telegraphIndicator,
      alpha: 0.6,
      duration: this.spec.attackTelegraphMs,
      ease: "Sine.InOut",
    });
  }

  private executeAttack(facing: 1 | -1): void {
    this.state = "attack";
    this.nextActionAt = this.scene.time.now + this.spec.attackActiveMs;
    this.attackHitbox = this.computeAttackRect(facing);
    if (this.telegraphIndicator) {
      this.telegraphIndicator.destroy();
      this.telegraphIndicator = null;
    }

    const flash = this.scene.add.rectangle(
      this.attackHitbox.x + this.attackHitbox.width / 2,
      this.attackHitbox.y + this.attackHitbox.height / 2,
      this.attackHitbox.width,
      this.attackHitbox.height,
      this.spec.tintFlash,
      0.55,
    );
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: this.spec.attackActiveMs,
      onComplete: () => flash.destroy(),
    });
  }

  private endAttack(time: number): void {
    this.state = "cooldown";
    this.attackHitbox = null;
    this.nextActionAt = time + this.spec.attackCooldownMs;
  }

  private computeAttackRect(facing: 1 | -1): Phaser.Geom.Rectangle {
    const range = this.spec.attackRange;
    const height = this.spec.height * 0.65;
    const x = facing === 1 ? this.x : this.x - range;
    return new Phaser.Geom.Rectangle(x, this.y - height, range, height);
  }
}
