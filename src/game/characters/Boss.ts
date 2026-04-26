import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";

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
  specialKind: "dash" | "teleport";
  specialCooldownMs: number;
  specialDashSpeed: number;
  specialDashDurationMs: number;
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
    specialKind: "dash",
    specialCooldownMs: 5500,
    specialDashSpeed: 520,
    specialDashDurationMs: 380,
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
    specialKind: "teleport",
    specialCooldownMs: 4500,
    specialDashSpeed: 0,
    specialDashDurationMs: 0,
  },
};

export type BossTarget = { readonly x: number; readonly y: number };

type BossState =
  | "idle"
  | "approach"
  | "telegraph"
  | "attack"
  | "cooldown"
  | "dash"
  | "teleport";

export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly spec: BossSpec;
  hp: number;
  state: BossState = "idle";
  private nextActionAt = 0;
  private nextSpecialAt = 0;
  private attackHitbox: Phaser.Geom.Rectangle | null = null;
  private telegraphIndicator: Phaser.GameObjects.Rectangle | null = null;
  private dashHitbox: Phaser.Geom.Rectangle | null = null;

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
    this.nextSpecialAt = scene.time.now + spec.specialCooldownMs;
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

  getActiveHitbox(): Phaser.Geom.Rectangle | null {
    if (this.state === "attack") return this.attackHitbox;
    if (this.state === "dash") return this.dashHitbox;
    return null;
  }

  tick(time: number, target: BossTarget): void {
    if (this.isDead()) {
      this.setVelocityX(0);
      return;
    }

    const dx = target.x - this.x;
    const distance = Math.abs(dx);
    const facing: 1 | -1 = dx >= 0 ? 1 : -1;
    this.setFlipX(facing === -1);

    switch (this.state) {
      case "idle":
      case "cooldown":
        this.setVelocityX(0);
        if (time >= this.nextActionAt) {
          if (this.canUseSpecial(time)) {
            this.startSpecial(time, facing, target);
          } else {
            this.state = "approach";
          }
        }
        break;
      case "approach":
        if (this.canUseSpecial(time)) {
          this.startSpecial(time, facing, target);
          break;
        }
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
      case "dash":
        this.dashHitbox = new Phaser.Geom.Rectangle(
          this.x - this.spec.width / 2,
          this.y - this.spec.height,
          this.spec.width,
          this.spec.height,
        );
        if (time >= this.nextActionAt) {
          this.endDash(time);
        }
        break;
      case "teleport":
        // Krótka pauza, completion event obsłużony przez delayedCall.
        this.setVelocityX(0);
        break;
    }
  }

  private canUseSpecial(time: number): boolean {
    return time >= this.nextSpecialAt && this.hp / this.spec.maxHp < 0.95;
  }

  private startSpecial(
    time: number,
    facing: 1 | -1,
    target: BossTarget,
  ): void {
    if (this.spec.specialKind === "dash") {
      this.startDash(time, facing);
    } else {
      this.startTeleport(time, target);
    }
  }

  private startDash(time: number, facing: 1 | -1): void {
    this.state = "dash";
    this.nextActionAt = time + this.spec.specialDashDurationMs;
    this.nextSpecialAt = time + this.spec.specialCooldownMs;
    this.setVelocityX(facing * this.spec.specialDashSpeed);

    // Pre-dash flash pod stopami
    const trail = this.scene.add.rectangle(
      this.x,
      this.y - 4,
      this.spec.width,
      8,
      this.spec.tintFlash,
      0.7,
    );
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 2.5,
      duration: this.spec.specialDashDurationMs,
      onComplete: () => trail.destroy(),
    });
  }

  private endDash(time: number): void {
    this.dashHitbox = null;
    this.setVelocityX(0);
    this.state = "cooldown";
    this.nextActionAt = time + 350;
  }

  private startTeleport(time: number, target: BossTarget): void {
    this.state = "teleport";
    this.nextSpecialAt = time + this.spec.specialCooldownMs;
    this.nextActionAt = time + 600;

    const fromX = this.x;
    const fromY = this.y;
    this.spawnPuff(fromX, fromY - this.spec.height / 2);

    this.setActive(false);
    this.setVisible(false);
    this.setVelocityX(0);

    // Reappear na przeciwnej stronie targetu (~250px od niego)
    const offset = 250;
    const direction = target.x >= this.x ? 1 : -1;
    const newX = Phaser.Math.Clamp(
      target.x + direction * offset,
      120,
      1280 - 120,
    );

    this.scene.time.delayedCall(280, () => {
      if (this.isDead()) return;
      this.setPosition(newX, fromY);
      this.setVisible(true);
      this.setActive(true);
      this.spawnPuff(newX, fromY - this.spec.height / 2);
      this.scene.time.delayedCall(180, () => {
        if (this.isDead()) return;
        this.state = "approach";
      });
    });
  }

  private spawnPuff(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dx = Math.cos(angle) * 30;
      const dy = Math.sin(angle) * 30;
      const p = this.scene.add.image(x, y, TEXTURES.hitFlash);
      p.setTint(this.spec.tintFlash);
      p.setScale(0.6);
      this.scene.tweens.add({
        targets: p,
        x: x + dx * 2,
        y: y + dy * 2,
        alpha: 0,
        scale: 0.1,
        duration: 350,
        ease: "Cubic.Out",
        onComplete: () => p.destroy(),
      });
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
