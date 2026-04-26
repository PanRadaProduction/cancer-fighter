import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import { sfx } from "../audio/sfx";
import { SPRITES } from "../scenes/BootScene";

export type ExtraSpecialKind =
  | "ground_slam"
  | "projectile_volley"
  | "charge_beam"
  | "mirror_clones";

export type BossSpec = {
  key: "stress" | "darkness";
  name: string;
  textureKey: string;
  fallbackTextureKey: string;
  idleAnimKey?: string;
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
  phaseEnrageHpRatio: number;
  enrageTimingMultiplier: number;
  enrageSpeedMultiplier: number;
  extraSpecials: ExtraSpecialKind[];
};

export const BOSS_SPECS: Record<BossSpec["key"], BossSpec> = {
  stress: {
    key: "stress",
    name: "LORD STRES",
    textureKey: SPRITES.stress,
    fallbackTextureKey: TEXTURES.stress,
    idleAnimKey: "stress-idle",
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
    phaseEnrageHpRatio: 0.4,
    enrageTimingMultiplier: 0.7,
    enrageSpeedMultiplier: 1.2,
    extraSpecials: ["ground_slam", "projectile_volley"],
  },
  darkness: {
    key: "darkness",
    name: "PANI CIEMNOŚĆ",
    textureKey: SPRITES.darkness,
    fallbackTextureKey: TEXTURES.darkness,
    idleAnimKey: "darkness-idle",
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
    phaseEnrageHpRatio: 0.4,
    enrageTimingMultiplier: 0.7,
    enrageSpeedMultiplier: 1.2,
    extraSpecials: ["charge_beam", "mirror_clones"],
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
  | "teleport"
  | "slam_charge"
  | "slam_jump"
  | "slam_recover"
  | "volley_charge"
  | "volley_active"
  | "beam_charge"
  | "beam_fire"
  | "beam_pause"
  | "beam_charge2"
  | "beam_fire2"
  | "clones_active";

type SlamWave = {
  rect: Phaser.Geom.Rectangle;
  vx: number;
  bornAt: number;
  sprite: Phaser.GameObjects.Rectangle;
};

type Projectile = {
  rect: Phaser.Geom.Rectangle;
  vx: number;
  vy: number;
  bornAt: number;
  sprite: Phaser.GameObjects.Image;
  lastTrailAt: number;
};

export type Clone = {
  sprite: Phaser.GameObjects.Sprite;
  spawnedAt: number;
  facing: 1 | -1;
  fakeCycleAt: number;
};

type FireTrail = {
  rect: Phaser.Geom.Rectangle;
  bornAt: number;
  sprite: Phaser.GameObjects.Rectangle;
};

const SLAM_WAVE_DAMAGE = 16;
const PROJECTILE_DAMAGE = 8;
const BEAM_DAMAGE = 18;
const FIRE_TRAIL_DAMAGE = 6;

export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly spec: BossSpec;
  hp: number;
  state: BossState = "idle";
  enraged = false;
  clones: Clone[] = [];

  private nextActionAt = 0;
  private nextSpecialAt = 0;
  private attackHitbox: Phaser.Geom.Rectangle | null = null;
  private telegraphIndicator: Phaser.GameObjects.Rectangle | null = null;
  private dashHitbox: Phaser.Geom.Rectangle | null = null;
  private slamWaves: SlamWave[] = [];
  private projectiles: Projectile[] = [];
  private fireTrails: FireTrail[] = [];
  private beamHitbox: Phaser.Geom.Rectangle | null = null;
  private beamSprite: Phaser.GameObjects.Rectangle | null = null;
  private beamLine: Phaser.GameObjects.Rectangle | null = null;
  private slamShadow: Phaser.GameObjects.Rectangle | null = null;
  private enrageAura: Phaser.GameObjects.Rectangle | null = null;
  private extraSpecialIndex = 0;
  private cachedTarget: BossTarget | null = null;
  private lastFireTrailAt = 0;
  private clonesStartAt = 0;
  private baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, spec: BossSpec) {
    const initialTexture = scene.textures.exists(spec.textureKey)
      ? spec.textureKey
      : spec.fallbackTextureKey;
    super(scene, x, y, initialTexture);
    this.spec = spec;
    this.hp = spec.maxHp;
    this.baseY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDisplaySize(spec.width, spec.height);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(spec.width - 16, spec.height - 16);
    body.setOffset(8, 8);
    body.allowGravity = false;
    this.setImmovable(true);
    this.nextSpecialAt = scene.time.now + spec.specialCooldownMs;
    if (
      spec.idleAnimKey &&
      scene.anims.exists(spec.idleAnimKey) &&
      initialTexture === spec.textureKey
    ) {
      this.play(spec.idleAnimKey);
    }
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    const wasEnraged = this.enraged;
    this.scene.tweens.add({
      targets: this,
      tint: this.spec.tintFlash,
      duration: 60,
      yoyo: true,
      onComplete: () => {
        if (this.enraged) this.setTint(this.spec.tintFlash);
        else this.clearTint();
      },
    });

    if (
      !wasEnraged &&
      this.hp > 0 &&
      this.hp / this.spec.maxHp < this.spec.phaseEnrageHpRatio
    ) {
      this.enterEnrage(this.scene.time.now);
    }
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  getActiveHitboxes(): { rect: Phaser.Geom.Rectangle; damage: number }[] {
    const out: { rect: Phaser.Geom.Rectangle; damage: number }[] = [];
    if (this.state === "attack" && this.attackHitbox) {
      out.push({ rect: this.attackHitbox, damage: this.spec.attackDamage });
    }
    if (this.state === "dash" && this.dashHitbox) {
      out.push({ rect: this.dashHitbox, damage: this.spec.attackDamage });
    }
    if (this.beamHitbox) {
      out.push({ rect: this.beamHitbox, damage: BEAM_DAMAGE });
    }
    for (const w of this.slamWaves) {
      out.push({ rect: w.rect, damage: SLAM_WAVE_DAMAGE });
    }
    for (const p of this.projectiles) {
      out.push({ rect: p.rect, damage: PROJECTILE_DAMAGE });
    }
    for (const t of this.fireTrails) {
      out.push({ rect: t.rect, damage: FIRE_TRAIL_DAMAGE });
    }
    return out;
  }

  tick(time: number, target: BossTarget): void {
    if (this.isDead()) {
      this.cleanupAll();
      this.setVelocityX(0);
      return;
    }

    this.cachedTarget = target;

    const dx = target.x - this.x;
    const distance = Math.abs(dx);
    const facing: 1 | -1 = dx >= 0 ? 1 : -1;

    const flipLockedStates: BossState[] = ["teleport", "slam_jump", "beam_fire", "beam_fire2"];
    if (!flipLockedStates.includes(this.state)) {
      this.setFlipX(facing === -1);
    }

    this.tickSlamWaves(time);
    this.tickProjectiles(time);
    this.tickFireTrails(time);
    this.tickClones(time);
    this.tickEnrageAura();
    this.tickDashFireTrails(time);

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
          this.setVelocityX(facing * this.effectiveSpeed());
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
      case "slam_charge":
      case "slam_jump":
      case "slam_recover":
      case "volley_charge":
      case "volley_active":
      case "beam_charge":
      case "beam_fire":
      case "beam_pause":
      case "beam_charge2":
      case "beam_fire2":
      case "clones_active":
        this.setVelocityX(0);
        break;
    }
  }

  private effectiveSpeed(): number {
    return this.enraged
      ? this.spec.speed * this.spec.enrageSpeedMultiplier
      : this.spec.speed;
  }

  private effectiveTelegraphMs(): number {
    return this.enraged
      ? this.spec.attackTelegraphMs * this.spec.enrageTimingMultiplier
      : this.spec.attackTelegraphMs;
  }

  private effectiveAttackCooldownMs(): number {
    return this.enraged
      ? this.spec.attackCooldownMs * this.spec.enrageTimingMultiplier
      : this.spec.attackCooldownMs;
  }

  private effectiveSpecialCooldownMs(): number {
    return this.enraged
      ? this.spec.specialCooldownMs * this.spec.enrageTimingMultiplier
      : this.spec.specialCooldownMs;
  }

  private canUseSpecial(time: number): boolean {
    return time >= this.nextSpecialAt && this.hp / this.spec.maxHp < 0.95;
  }

  private startSpecial(
    time: number,
    facing: 1 | -1,
    target: BossTarget,
  ): void {
    const total = this.spec.extraSpecials.length + 1;
    const idx = this.extraSpecialIndex % total;
    this.extraSpecialIndex = (this.extraSpecialIndex + 1) % total;

    if (idx === 0) {
      if (this.spec.specialKind === "dash") {
        this.startDash(time, facing);
      } else {
        this.startTeleport(time, target);
      }
      return;
    }
    const extra = this.spec.extraSpecials[idx - 1];
    switch (extra) {
      case "ground_slam":
        this.startGroundSlam(time);
        break;
      case "projectile_volley":
        this.startProjectileVolley(time, facing);
        break;
      case "charge_beam":
        this.startChargeBeam(time, target);
        break;
      case "mirror_clones":
        this.startMirrorClones(time);
        break;
    }
  }

  private startDash(time: number, facing: 1 | -1): void {
    this.state = "dash";
    this.nextActionAt = time + this.spec.specialDashDurationMs;
    this.nextSpecialAt = time + this.effectiveSpecialCooldownMs();
    this.setVelocityX(facing * this.spec.specialDashSpeed);

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
    this.nextSpecialAt = time + this.effectiveSpecialCooldownMs();
    this.nextActionAt = time + 600;

    const fromX = this.x;
    const fromY = this.y;
    this.spawnPuff(fromX, fromY - this.spec.height / 2);

    this.setActive(false);
    this.setVisible(false);
    this.setVelocityX(0);

    const offset = 250;
    const direction = target.x >= this.x ? 1 : -1;
    const newX = Phaser.Math.Clamp(
      target.x + direction * offset,
      120,
      this.scene.scale.width - 120,
    );

    this.scene.time.delayedCall(280, () => {
      if (this.isDead()) return;
      this.setPosition(newX, fromY);
      this.setVisible(true);
      this.setActive(true);
      this.spawnPuff(newX, fromY - this.spec.height / 2);
      this.scene.time.delayedCall(180, () => {
        if (this.isDead()) return;
        if (this.enraged && this.cachedTarget) {
          const tdx = this.cachedTarget.x - this.x;
          const tFacing: 1 | -1 = tdx >= 0 ? 1 : -1;
          this.setFlipX(tFacing === -1);
          this.startTelegraph(this.scene.time.now, tFacing);
        } else {
          this.state = "approach";
        }
      });
    });
  }

  private spawnPuff(
    x: number,
    y: number,
    count = 12,
    radius = 30,
    color?: number,
  ): void {
    const tint = color ?? this.spec.tintFlash;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      const p = this.scene.add.image(x, y, TEXTURES.hitFlash);
      p.setTint(tint);
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
    const telegraphMs = this.effectiveTelegraphMs();
    this.nextActionAt = time + telegraphMs;

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
      duration: telegraphMs,
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
    this.nextActionAt = time + this.effectiveAttackCooldownMs();
  }

  private computeAttackRect(facing: 1 | -1): Phaser.Geom.Rectangle {
    const range = this.spec.attackRange;
    const height = this.spec.height * 0.65;
    const x = facing === 1 ? this.x : this.x - range;
    return new Phaser.Geom.Rectangle(x, this.y - height, range, height);
  }

  // ====== GROUND SLAM ======

  private startGroundSlam(time: number): void {
    this.state = "slam_charge";
    this.nextSpecialAt = time + this.effectiveSpecialCooldownMs() + 1500;
    const groundY = this.baseY;

    this.slamShadow = this.scene.add.rectangle(
      this.x,
      this.y - this.spec.height - 40,
      this.spec.width * 1.2,
      14,
      this.spec.tintFlash,
      0.2,
    );
    this.scene.tweens.add({
      targets: this.slamShadow,
      alpha: 0.7,
      scaleX: 1.4,
      duration: 600,
      ease: "Sine.InOut",
    });

    sfx.playSlamCharge();
    sfx.playWarningBeep();

    this.scene.time.delayedCall(600, () => {
      if (this.isDead()) return;
      this.state = "slam_jump";
      this.scene.tweens.add({
        targets: this,
        y: groundY - 220,
        duration: 360,
        ease: "Cubic.Out",
        onComplete: () => {
          if (this.isDead()) return;
          this.scene.time.delayedCall(120, () => {
            if (this.isDead()) return;
            this.scene.tweens.add({
              targets: this,
              y: groundY,
              duration: 200,
              ease: "Cubic.In",
              onComplete: () => {
                if (this.isDead()) return;
                this.onSlamImpact(this.scene.time.now);
              },
            });
          });
        },
      });
    });
  }

  private onSlamImpact(time: number): void {
    if (this.slamShadow) {
      this.slamShadow.destroy();
      this.slamShadow = null;
    }

    this.scene.cameras.main.shake(220, 0.014);
    sfx.playSlamImpact();

    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const angle = Math.PI + t * Math.PI;
      const dx = Math.cos(angle) * 80;
      const dy = -Math.abs(Math.sin(angle)) * 50;
      const p = this.scene.add.image(this.x, this.y - 8, TEXTURES.hitFlash);
      p.setTint(this.spec.tintFlash);
      p.setScale(0.5);
      this.scene.tweens.add({
        targets: p,
        x: this.x + dx,
        y: this.y - 8 + dy,
        alpha: 0,
        scale: 0.1,
        duration: 500,
        ease: "Cubic.Out",
        onComplete: () => p.destroy(),
      });
    }

    for (const dir of [-1, 1] as const) {
      const startX = this.x + dir * 50;
      const sprite = this.scene.add.rectangle(
        startX,
        this.y - 36,
        56,
        72,
        this.spec.tintFlash,
        0.75,
      );
      sprite.setStrokeStyle(2, 0xffffff, 0.6);

      this.scene.tweens.add({
        targets: sprite,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        repeat: -1,
      });

      this.slamWaves.push({
        sprite,
        rect: new Phaser.Geom.Rectangle(startX - 28, this.y - 72, 56, 72),
        vx: dir * 380,
        bornAt: time,
      });
    }

    this.state = "slam_recover";
    this.nextActionAt = time + 400;

    this.scene.time.delayedCall(400, () => {
      if (this.isDead()) return;
      if (this.state === "slam_recover") {
        this.state = "cooldown";
        this.nextActionAt = this.scene.time.now + 200;
      }
    });
  }

  private tickSlamWaves(time: number): void {
    const sceneW = this.scene.scale.width;
    const delta = (this.scene.game.loop.delta || 16) / 1000;
    this.slamWaves = this.slamWaves.filter((w) => {
      const age = time - w.bornAt;
      if (age > 1400) {
        w.sprite.destroy();
        return false;
      }
      w.sprite.x += w.vx * delta;
      w.rect.x = w.sprite.x - w.rect.width / 2;
      if (w.sprite.x < -50 || w.sprite.x > sceneW + 50) {
        w.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  // ====== PROJECTILE VOLLEY ======

  private startProjectileVolley(time: number, facing: 1 | -1): void {
    this.state = "volley_charge";
    this.nextSpecialAt = time + this.effectiveSpecialCooldownMs() + 500;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 50;
      const cx = this.x + Math.cos(angle) * r;
      const cy = this.y - this.spec.height / 2 + Math.sin(angle) * r;
      const part = this.scene.add.image(cx, cy, TEXTURES.hitFlash);
      part.setTint(this.spec.tintFlash);
      part.setScale(0.45);
      this.scene.tweens.add({
        targets: part,
        x: this.x,
        y: this.y - this.spec.height / 2,
        scale: 0.1,
        alpha: 0,
        duration: 700,
        ease: "Cubic.In",
        onComplete: () => part.destroy(),
      });
    }
    sfx.playWarningBeep();

    this.scene.time.delayedCall(700, () => {
      if (this.isDead()) return;
      this.fireVolley(this.scene.time.now, facing);
    });
  }

  private fireVolley(time: number, facing: 1 | -1): void {
    this.state = "volley_active";
    sfx.playProjectileFire();

    const speed = 320;
    const angles = [-18, 0, 18];
    const baseY = this.y - this.spec.height * 0.55;

    for (const angDeg of angles) {
      const rad = Phaser.Math.DegToRad(angDeg);
      const dirX = facing * Math.cos(rad);
      const dirY = Math.sin(rad);

      const sprite = this.scene.add.image(
        this.x + facing * 40,
        baseY,
        TEXTURES.hitFlash,
      );
      sprite.setTint(this.spec.tintFlash);
      sprite.setScale(0.9);

      this.projectiles.push({
        sprite,
        rect: new Phaser.Geom.Rectangle(sprite.x - 14, sprite.y - 14, 28, 28),
        vx: dirX * speed,
        vy: dirY * speed,
        bornAt: time,
        lastTrailAt: time,
      });
    }

    this.nextActionAt = time + 300;
    this.scene.time.delayedCall(300, () => {
      if (this.isDead()) return;
      if (this.state === "volley_active") {
        this.state = "cooldown";
        this.nextActionAt = this.scene.time.now + 400;
      }
    });
  }

  private tickProjectiles(time: number): void {
    const sceneW = this.scene.scale.width;
    const delta = (this.scene.game.loop.delta || 16) / 1000;
    this.projectiles = this.projectiles.filter((p) => {
      const age = time - p.bornAt;
      if (age > 1600) {
        this.spawnPuff(p.sprite.x, p.sprite.y, 4, 12);
        p.sprite.destroy();
        return false;
      }
      p.sprite.x += p.vx * delta;
      p.sprite.y += p.vy * delta;
      p.rect.x = p.sprite.x - 14;
      p.rect.y = p.sprite.y - 14;

      if (time - p.lastTrailAt > 100) {
        p.lastTrailAt = time;
        const ghost = this.scene.add.image(
          p.sprite.x,
          p.sprite.y,
          TEXTURES.hitFlash,
        );
        ghost.setTint(this.spec.tintFlash);
        ghost.setScale(0.6);
        ghost.setAlpha(0.4);
        this.scene.tweens.add({
          targets: ghost,
          scale: 0.2,
          alpha: 0,
          duration: 250,
          onComplete: () => ghost.destroy(),
        });
      }

      if (
        p.sprite.x < -30 ||
        p.sprite.x > sceneW + 30 ||
        p.sprite.y > this.baseY + 20
      ) {
        this.spawnPuff(p.sprite.x, p.sprite.y, 4, 12);
        p.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  // ====== CHARGE BEAM ======

  private startChargeBeam(time: number, target: BossTarget): void {
    this.state = "beam_charge";
    this.nextSpecialAt = time + this.effectiveSpecialCooldownMs() + 2500;
    this.startBeamCharge(time, target.x, true);
  }

  private startBeamCharge(time: number, targetX: number, isFirst: boolean): void {
    const beamY = this.y - this.spec.height * 0.55;
    const chargeMs = isFirst ? 1400 : 350;

    const lineWidth = Math.abs(targetX - this.x) + 100;
    const lineX = (this.x + targetX) / 2;
    this.beamLine = this.scene.add.rectangle(
      lineX,
      beamY,
      lineWidth,
      4,
      this.spec.tintFlash,
      0.5,
    );
    this.scene.tweens.add({
      targets: this.beamLine,
      alpha: 0.9,
      duration: 200,
      yoyo: true,
      repeat: Math.max(1, Math.floor(chargeMs / 400)),
    });

    if (isFirst) {
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const radius = 130;
        const px = this.x + Math.cos(angle) * radius;
        const py = beamY + Math.sin(angle) * radius;
        const part = this.scene.add.image(px, py, TEXTURES.hitFlash);
        part.setTint(this.spec.tintFlash);
        part.setScale(0.6);
        this.scene.tweens.add({
          targets: part,
          x: this.x,
          y: beamY,
          scale: 0.2,
          alpha: 0,
          duration: 1400,
          ease: "Cubic.In",
          onComplete: () => part.destroy(),
        });
      }
    }

    sfx.playBeamCharge();
    sfx.playWarningBeep();

    this.scene.time.delayedCall(chargeMs, () => {
      if (this.isDead()) return;
      this.fireBeam(this.scene.time.now, beamY, isFirst);
    });
  }

  private fireBeam(time: number, beamY: number, isFirst: boolean): void {
    this.state = isFirst ? "beam_fire" : "beam_fire2";
    if (this.beamLine) {
      this.beamLine.destroy();
      this.beamLine = null;
    }

    const sceneW = this.scene.scale.width;
    this.beamSprite = this.scene.add.rectangle(
      sceneW / 2,
      beamY,
      sceneW,
      80,
      this.spec.tintFlash,
      0.85,
    );
    this.beamHitbox = new Phaser.Geom.Rectangle(0, beamY - 40, sceneW, 80);

    this.scene.tweens.add({
      targets: this.beamSprite,
      scaleY: 1.05,
      duration: 100,
      yoyo: true,
      repeat: 1,
    });

    this.scene.cameras.main.shake(180, 0.012);
    sfx.playBeamFire();

    this.scene.time.delayedCall(380, () => {
      if (this.isDead()) return;
      if (this.beamSprite) {
        this.beamSprite.destroy();
        this.beamSprite = null;
      }
      this.beamHitbox = null;

      if (isFirst) {
        this.state = "beam_pause";
        this.scene.time.delayedCall(800, () => {
          if (this.isDead()) return;
          if (!this.cachedTarget) {
            this.state = "cooldown";
            this.nextActionAt = this.scene.time.now + 400;
            return;
          }
          this.state = "beam_charge2";
          this.startBeamCharge(this.scene.time.now, this.cachedTarget.x, false);
        });
      } else {
        this.state = "cooldown";
        this.nextActionAt = this.scene.time.now + 600;
      }
    });
  }

  // ====== MIRROR CLONES ======

  private startMirrorClones(time: number): void {
    this.state = "clones_active";
    this.nextSpecialAt = time + this.effectiveSpecialCooldownMs() + 4000;
    this.clonesStartAt = time;

    const sceneW = this.scene.scale.width;
    for (const dir of [-1, 1] as const) {
      const cx = Phaser.Math.Clamp(
        this.x + dir * 320,
        200,
        sceneW - 200,
      );
      const cloneTexture = this.scene.textures.exists(this.spec.textureKey)
        ? this.spec.textureKey
        : this.spec.fallbackTextureKey;
      const sprite = this.scene.add.sprite(cx, this.y, cloneTexture);
      sprite.setOrigin(0.5, 1);
      sprite.setDisplaySize(this.spec.width, this.spec.height);
      sprite.setTint(this.spec.tintFlash);
      sprite.setAlpha(0.55);
      sprite.setFlipX(dir === -1);
      if (
        this.spec.idleAnimKey &&
        this.scene.anims.exists(this.spec.idleAnimKey) &&
        cloneTexture === this.spec.textureKey
      ) {
        sprite.play(this.spec.idleAnimKey);
      }

      this.spawnPuff(cx, this.y - this.spec.height / 2, 8, 30);

      this.clones.push({
        sprite,
        spawnedAt: time,
        facing: dir,
        fakeCycleAt: time + 800,
      });
    }

    sfx.playCloneSpawn();

    this.scene.time.delayedCall(300, () => {
      if (this.isDead()) return;
      if (this.state === "clones_active") {
        this.state = "cooldown";
        this.nextActionAt = this.scene.time.now + 200;
      }
    });

    this.scene.time.delayedCall(5000, () => {
      this.despawnClones();
    });
  }

  private tickClones(time: number): void {
    this.clones = this.clones.filter((c) => {
      if (!c.sprite.active) return false;
      const age = time - c.spawnedAt;
      if (age > 5000) {
        return false;
      }

      const pulse = 0.4 + Math.sin(age / 180) * 0.15;
      c.sprite.setAlpha(pulse);

      if (time >= c.fakeCycleAt) {
        const range = this.spec.attackRange;
        const height = this.spec.height * 0.5;
        const cx = c.facing === 1 ? c.sprite.x : c.sprite.x - range;
        const fakeRect = this.scene.add.rectangle(
          cx + range / 2,
          c.sprite.y - height,
          range,
          height,
          this.spec.tintFlash,
          0.2,
        );
        const teleMs = this.effectiveTelegraphMs();
        this.scene.tweens.add({
          targets: fakeRect,
          alpha: 0.5,
          duration: teleMs,
          onComplete: () => {
            this.scene.tweens.add({
              targets: fakeRect,
              alpha: 0,
              scaleX: 1.1,
              duration: 200,
              onComplete: () => fakeRect.destroy(),
            });
          },
        });
        c.fakeCycleAt = time + 1500 + teleMs;
      }

      return true;
    });
  }

  crackClone(clone: Clone): void {
    this.spawnPuff(
      clone.sprite.x,
      clone.sprite.y - this.spec.height / 2,
      10,
      35,
    );
    sfx.playCloneCrack();
    clone.sprite.destroy();
    this.clones = this.clones.filter((c) => c !== clone);
  }

  private despawnClones(): void {
    for (const c of this.clones) {
      this.scene.tweens.add({
        targets: c.sprite,
        alpha: 0,
        scaleX: c.sprite.scaleX * 0.9,
        scaleY: c.sprite.scaleY * 0.9,
        duration: 200,
        onComplete: () => c.sprite.destroy(),
      });
    }
    this.clones = [];
  }

  // ====== ENRAGE ======

  private enterEnrage(time: number): void {
    this.enraged = true;

    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const r = 80;
      const part = this.scene.add.image(
        this.x,
        this.y - this.spec.height / 2,
        TEXTURES.hitFlash,
      );
      part.setTint(this.spec.tintFlash);
      part.setScale(0.8);
      this.scene.tweens.add({
        targets: part,
        x: this.x + Math.cos(angle) * r * 2,
        y: this.y - this.spec.height / 2 + Math.sin(angle) * r * 2,
        alpha: 0,
        scale: 0.2,
        duration: 600,
        ease: "Cubic.Out",
        onComplete: () => part.destroy(),
      });
    }

    this.scene.cameras.main.shake(300, 0.02);
    sfx.playEnrageRoar();

    this.setTint(this.spec.tintFlash);

    this.enrageAura = this.scene.add.rectangle(
      this.x,
      this.y - this.spec.height / 2,
      this.spec.width * 1.4,
      this.spec.height * 1.2,
      this.spec.tintFlash,
      0.2,
    );
    this.enrageAura.setDepth((this.depth ?? 0) - 1);
    this.scene.tweens.add({
      targets: this.enrageAura,
      alpha: 0.5,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
    void time;
  }

  private tickEnrageAura(): void {
    if (this.enrageAura) {
      this.enrageAura.x = this.x;
      this.enrageAura.y = this.y - this.spec.height / 2;
    }
  }

  private tickDashFireTrails(time: number): void {
    if (
      this.enraged &&
      this.state === "dash" &&
      this.spec.specialKind === "dash"
    ) {
      if (time - this.lastFireTrailAt > 80) {
        this.lastFireTrailAt = time;
        const sprite = this.scene.add.rectangle(
          this.x,
          this.y - 8,
          44,
          16,
          0xff5555,
          0.7,
        );
        this.fireTrails.push({
          sprite,
          rect: new Phaser.Geom.Rectangle(this.x - 22, this.y - 16, 44, 16),
          bornAt: time,
        });
      }
    }
  }

  private tickFireTrails(time: number): void {
    this.fireTrails = this.fireTrails.filter((t) => {
      const age = time - t.bornAt;
      if (age > 600) {
        t.sprite.destroy();
        return false;
      }
      t.sprite.alpha = 0.7 * (1 - age / 600);
      return true;
    });
  }

  private cleanupAll(): void {
    for (const w of this.slamWaves) w.sprite.destroy();
    for (const p of this.projectiles) p.sprite.destroy();
    for (const t of this.fireTrails) t.sprite.destroy();
    for (const c of this.clones) c.sprite.destroy();
    this.slamWaves = [];
    this.projectiles = [];
    this.fireTrails = [];
    this.clones = [];
    if (this.beamSprite) {
      this.beamSprite.destroy();
      this.beamSprite = null;
    }
    if (this.beamLine) {
      this.beamLine.destroy();
      this.beamLine = null;
    }
    if (this.slamShadow) {
      this.slamShadow.destroy();
      this.slamShadow = null;
    }
    if (this.enrageAura) {
      this.enrageAura.destroy();
      this.enrageAura = null;
    }
    if (this.telegraphIndicator) {
      this.telegraphIndicator.destroy();
      this.telegraphIndicator = null;
    }
    this.beamHitbox = null;
    this.attackHitbox = null;
    this.dashHitbox = null;
  }
}
