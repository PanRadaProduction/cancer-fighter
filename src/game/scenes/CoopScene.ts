import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import { Boss, BOSS_SPECS } from "../characters/Boss";
import { Brave } from "../characters/Brave";
import { Hope } from "../characters/Hope";
import { PlayerCharacter } from "../characters/PlayerCharacter";
import { bgm } from "../audio/bgm";
import { sfx } from "../audio/sfx";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import type { CharacterKey } from "./StorySelectScene";

const GROUND_Y = 640;
const BOSS_HP_MULTIPLIER = 2.4;
const INVULN_MS = 700;

type CoopCharacter = Exclude<CharacterKey, "wise">;

export type CoopData = {
  p1Character?: CoopCharacter;
  p2Character?: CoopCharacter;
};

type ControlMap = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  light: Phaser.Input.Keyboard.Key;
  heavy: Phaser.Input.Keyboard.Key;
  altJump?: Phaser.Input.Keyboard.Key;
};

function spawnPlayer(
  scene: Phaser.Scene,
  key: CoopCharacter,
  x: number,
  y: number,
): PlayerCharacter {
  if (key === "brave") return new Brave(scene, x, y);
  return new Hope(scene, x, y);
}

export class CoopScene extends Phaser.Scene {
  private p1!: PlayerCharacter;
  private p2!: PlayerCharacter;
  private boss!: Boss;

  private p1Key: CoopCharacter = "hope";
  private p2Key: CoopCharacter = "brave";

  private p1Controls!: ControlMap;
  private p2Controls!: ControlMap;

  private p1Bar!: Phaser.GameObjects.Graphics;
  private p2Bar!: Phaser.GameObjects.Graphics;
  private bossBar!: Phaser.GameObjects.Graphics;

  private p1InvulnUntil = 0;
  private p2InvulnUntil = 0;
  private finished = false;

  constructor() {
    super({ key: "CoopScene" });
  }

  init(data: CoopData): void {
    this.p1Key = data.p1Character ?? "hope";
    this.p2Key = data.p2Character ?? "brave";
    this.finished = false;
    this.p1InvulnUntil = 0;
    this.p2InvulnUntil = 0;
  }

  create(): void {
    bgm.play("stage1");

    this.physics.world.gravity.y = 1100;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x4338ca, 0x4338ca, 0x0f0a1f, 0x0f0a1f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add
      .text(GAME_WIDTH / 2, 36, "CO-OP MODE — DUET BOHATERÓW", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fcd34d",
      })
      .setOrigin(0.5);

    const ground = this.physics.add.staticGroup();
    for (let x = 0; x < GAME_WIDTH; x += 64) {
      ground.create(x + 32, GROUND_Y + 16, TEXTURES.ground);
    }

    this.p1 = spawnPlayer(this, this.p1Key, 260, GROUND_Y);
    this.p2 = spawnPlayer(this, this.p2Key, 460, GROUND_Y);
    this.physics.add.collider(this.p1, ground);
    this.physics.add.collider(this.p2, ground);

    const baseSpec = BOSS_SPECS.stress;
    const coopSpec = {
      ...baseSpec,
      maxHp: Math.round(baseSpec.maxHp * BOSS_HP_MULTIPLIER),
    };
    this.boss = new Boss(this, 1020, GROUND_Y, coopSpec);

    const KC = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.p1Controls = {
      left: kb.addKey(KC.A),
      right: kb.addKey(KC.D),
      up: kb.addKey(KC.W),
      altJump: kb.addKey(KC.SPACE),
      light: kb.addKey(KC.F),
      heavy: kb.addKey(KC.G),
    };
    this.p2Controls = {
      left: kb.addKey(KC.LEFT),
      right: kb.addKey(KC.RIGHT),
      up: kb.addKey(KC.UP),
      light: kb.addKey(KC.N),
      heavy: kb.addKey(KC.M),
    };

    this.add.text(
      40,
      60,
      `P1: ${this.p1.displayName.toUpperCase()} — WASD ruch/skok • F lekki • G silny`,
      {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#fde68a",
      },
    );
    this.add.text(
      40,
      78,
      `P2: ${this.p2.displayName.toUpperCase()} — ← → ↑ ruch/skok • N lekki • M silny`,
      {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#fca5a5",
      },
    );

    this.add
      .text(GAME_WIDTH - 240, 60, this.boss.spec.name, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: this.boss.spec.labelColor,
      })
      .setOrigin(0, 0);

    this.p1Bar = this.add.graphics();
    this.p2Bar = this.add.graphics();
    this.bossBar = this.add.graphics();

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 26,
        "Połączcie siły. Ratujcie się nawzajem.",
        {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#cbd5e1",
        },
      )
      .setOrigin(0.5);

    this.drawBars();
  }

  update(time: number): void {
    if (this.finished) return;

    if (this.p1.hp > 0) {
      this.handleInput(this.p1, this.p1Controls, time);
    } else {
      this.p1.stopHorizontal();
    }
    if (this.p2.hp > 0) {
      this.handleInput(this.p2, this.p2Controls, time);
    } else {
      this.p2.stopHorizontal();
    }

    const target = this.closestAlivePlayer();
    if (target) {
      this.boss.tick(time, target);

      const bossHits = this.boss.getActiveHitboxes();
      for (const { rect, damage } of bossHits) {
        if (this.p1.hp > 0 && time >= this.p1InvulnUntil) {
          if (this.intersects(rect, this.p1)) {
            this.applyBossDamageTo(this.p1, time, "p1", damage);
          }
        }
        if (this.p2.hp > 0 && time >= this.p2InvulnUntil) {
          if (this.intersects(rect, this.p2)) {
            this.applyBossDamageTo(this.p2, time, "p2", damage);
          }
        }
      }
    }

    if (this.p1.hp === 0 && this.p2.hp === 0) {
      this.endGame(false);
      return;
    }

    if (this.boss.isDead()) {
      this.endGame(true);
    }
  }

  private handleInput(
    player: PlayerCharacter,
    keys: ControlMap,
    time: number,
  ): void {
    if (keys.left.isDown) {
      player.moveLeft();
    } else if (keys.right.isDown) {
      player.moveRight();
    } else {
      player.stopHorizontal();
    }

    const upJustDown = Phaser.Input.Keyboard.JustDown(keys.up);
    const altJump =
      keys.altJump && Phaser.Input.Keyboard.JustDown(keys.altJump);
    if (upJustDown || altJump) {
      player.jump();
    }

    if (Phaser.Input.Keyboard.JustDown(keys.light)) {
      const hb = player.tryLightAttack(time);
      if (hb) this.resolvePlayerAttack(hb, player.lightDamage, false);
    }
    if (Phaser.Input.Keyboard.JustDown(keys.heavy)) {
      const hb = player.tryHeavyAttack(time);
      if (hb) this.resolvePlayerAttack(hb, player.heavyDamage, true);
    }
  }

  private resolvePlayerAttack(
    hitbox: Phaser.Geom.Rectangle,
    damage: number,
    heavy: boolean,
  ): void {
    if (this.boss.isDead()) return;

    if (heavy) {
      for (const c of this.boss.clones) {
        const cloneRect = new Phaser.Geom.Rectangle(
          c.sprite.x - this.boss.spec.width / 2,
          c.sprite.y - this.boss.spec.height,
          this.boss.spec.width,
          this.boss.spec.height,
        );
        if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, cloneRect)) {
          this.boss.crackClone(c);
          return;
        }
      }
    }

    const sb = this.boss.body as Phaser.Physics.Arcade.Body;
    const bossRect = new Phaser.Geom.Rectangle(sb.x, sb.y, sb.width, sb.height);
    if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, bossRect)) {
      this.boss.takeDamage(damage);
      sfx.playHit();
      const flash = this.add.image(this.boss.x, this.boss.y - 140, TEXTURES.hitFlash);
      flash.setScale(heavy ? 1.6 : 1);
      flash.setAlpha(0.95);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scale: heavy ? 2.4 : 1.6,
        duration: 240,
        onComplete: () => flash.destroy(),
      });
      this.drawBars();
    }
  }

  private applyBossDamageTo(
    player: PlayerCharacter,
    time: number,
    who: "p1" | "p2",
    damage: number,
  ): void {
    player.takeDamage(damage);
    if (who === "p1") this.p1InvulnUntil = time + INVULN_MS;
    else this.p2InvulnUntil = time + INVULN_MS;

    const knockX = this.boss.x < player.x ? 320 : -320;
    player.setVelocity(knockX, this.boss.spec.knockbackVelocity);
    this.drawBars();
  }

  private closestAlivePlayer(): PlayerCharacter | null {
    const alive: PlayerCharacter[] = [];
    if (this.p1.hp > 0) alive.push(this.p1);
    if (this.p2.hp > 0) alive.push(this.p2);
    if (alive.length === 0) return null;
    let best = alive[0];
    let bestDist = Math.abs(best.x - this.boss.x);
    for (const p of alive.slice(1)) {
      const d = Math.abs(p.x - this.boss.x);
      if (d < bestDist) {
        best = p;
        bestDist = d;
      }
    }
    return best;
  }

  private intersects(
    hitbox: Phaser.Geom.Rectangle,
    player: PlayerCharacter,
  ): boolean {
    const body = player.body as Phaser.Physics.Arcade.Body;
    const rect = new Phaser.Geom.Rectangle(
      body.x,
      body.y,
      body.width,
      body.height,
    );
    return Phaser.Geom.Intersects.RectangleToRectangle(hitbox, rect);
  }

  private drawBars(): void {
    const w = 200;
    const h = 12;

    this.p1Bar.clear();
    this.p1Bar.fillStyle(0x000000, 0.5);
    this.p1Bar.fillRect(40, 96, w, h);
    this.p1Bar.fillStyle(0x22c55e, 1);
    this.p1Bar.fillRect(40, 96, w * (this.p1.hp / this.p1.maxHp), h);
    this.p1Bar.lineStyle(2, 0xffffff, 0.6);
    this.p1Bar.strokeRect(40, 96, w, h);

    this.p2Bar.clear();
    this.p2Bar.fillStyle(0x000000, 0.5);
    this.p2Bar.fillRect(40, 116, w, h);
    this.p2Bar.fillStyle(0xfb923c, 1);
    this.p2Bar.fillRect(40, 116, w * (this.p2.hp / this.p2.maxHp), h);
    this.p2Bar.lineStyle(2, 0xffffff, 0.6);
    this.p2Bar.strokeRect(40, 116, w, h);

    this.bossBar.clear();
    this.bossBar.fillStyle(0x000000, 0.5);
    this.bossBar.fillRect(GAME_WIDTH - 240, 80, w, 14);
    this.bossBar.fillStyle(0xef4444, 1);
    this.bossBar.fillRect(
      GAME_WIDTH - 240,
      80,
      w * (this.boss.hp / this.boss.spec.maxHp),
      14,
    );
    this.bossBar.lineStyle(2, 0xffffff, 0.6);
    this.bossBar.strokeRect(GAME_WIDTH - 240, 80, w, 14);
  }

  private endGame(victory: boolean): void {
    this.finished = true;
    this.p1.stopHorizontal();
    this.p2.stopHorizontal();

    if (victory) sfx.playVictory();
    else sfx.playDefeat();

    const message = victory
      ? "WSPÓLNE ZWYCIĘSTWO!\nDuet uzdrowił Lord Stresa."
      : "OBOJE POTRZEBUJECIE WYTCHNIENIA.\nWróćcie silniejsi.";

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, message, {
        fontFamily: "monospace",
        fontSize: "30px",
        color: victory ? "#fcd34d" : "#f87171",
        align: "center",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    if (victory) {
      this.tweens.add({
        targets: this.boss,
        alpha: 0,
        scale: 1.3,
        duration: 800,
      });
    }

    this.time.delayedCall(victory ? 2400 : 2200, () => {
      this.scene.start("MainMenuScene");
    });
  }
}
