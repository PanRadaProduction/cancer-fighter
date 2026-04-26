import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import { Boss, BOSS_SPECS } from "../characters/Boss";
import { Brave } from "../characters/Brave";
import { Hope } from "../characters/Hope";
import { PlayerCharacter } from "../characters/PlayerCharacter";
import { bgm } from "../audio/bgm";
import { sfx } from "../audio/sfx";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const GROUND_Y = 640;
const BOSS_HP_MULTIPLIER = 2.4;
const INVULN_MS = 700;

type ControlMap = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  light: Phaser.Input.Keyboard.Key;
  heavy: Phaser.Input.Keyboard.Key;
  altJump?: Phaser.Input.Keyboard.Key;
};

export class CoopScene extends Phaser.Scene {
  private hope!: Hope;
  private brave!: Brave;
  private boss!: Boss;

  private p1!: ControlMap;
  private p2!: ControlMap;

  private hopeBar!: Phaser.GameObjects.Graphics;
  private braveBar!: Phaser.GameObjects.Graphics;
  private bossBar!: Phaser.GameObjects.Graphics;

  private hopeInvulnUntil = 0;
  private braveInvulnUntil = 0;
  private finished = false;

  constructor() {
    super({ key: "CoopScene" });
  }

  init(): void {
    this.finished = false;
    this.hopeInvulnUntil = 0;
    this.braveInvulnUntil = 0;
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

    this.hope = new Hope(this, 260, GROUND_Y);
    this.brave = new Brave(this, 460, GROUND_Y);
    this.physics.add.collider(this.hope, ground);
    this.physics.add.collider(this.brave, ground);

    const baseSpec = BOSS_SPECS.stress;
    const coopSpec = {
      ...baseSpec,
      maxHp: Math.round(baseSpec.maxHp * BOSS_HP_MULTIPLIER),
    };
    this.boss = new Boss(this, 1020, GROUND_Y, coopSpec);

    const KC = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.p1 = {
      left: kb.addKey(KC.A),
      right: kb.addKey(KC.D),
      up: kb.addKey(KC.W),
      altJump: kb.addKey(KC.SPACE),
      light: kb.addKey(KC.F),
      heavy: kb.addKey(KC.G),
    };
    this.p2 = {
      left: kb.addKey(KC.LEFT),
      right: kb.addKey(KC.RIGHT),
      up: kb.addKey(KC.UP),
      light: kb.addKey(KC.N),
      heavy: kb.addKey(KC.M),
    };

    this.add.text(40, 60, "P1: NADZIEJA — WASD ruch/skok • F lekki • G silny", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#fde68a",
    });
    this.add.text(40, 78, "P2: ODWAGA — ← → ↑ ruch/skok • N lekki • M silny", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#fca5a5",
    });

    this.add
      .text(GAME_WIDTH - 240, 60, this.boss.spec.name, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: this.boss.spec.labelColor,
      })
      .setOrigin(0, 0);

    this.hopeBar = this.add.graphics();
    this.braveBar = this.add.graphics();
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

    if (this.hope.hp > 0) {
      this.handleInput(this.hope, this.p1, time);
    } else {
      this.hope.stopHorizontal();
    }
    if (this.brave.hp > 0) {
      this.handleInput(this.brave, this.p2, time);
    } else {
      this.brave.stopHorizontal();
    }

    const target = this.closestAlivePlayer();
    if (target) {
      this.boss.tick(time, target);

      const bossHit = this.boss.getActiveHitbox();
      if (bossHit) {
        if (this.hope.hp > 0 && time >= this.hopeInvulnUntil) {
          if (this.intersects(bossHit, this.hope)) {
            this.applyBossDamageTo(this.hope, time, "hope");
          }
        }
        if (this.brave.hp > 0 && time >= this.braveInvulnUntil) {
          if (this.intersects(bossHit, this.brave)) {
            this.applyBossDamageTo(this.brave, time, "brave");
          }
        }
      }
    }

    if (this.hope.hp === 0 && this.brave.hp === 0) {
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
    who: "hope" | "brave",
  ): void {
    player.takeDamage(this.boss.spec.attackDamage);
    if (who === "hope") this.hopeInvulnUntil = time + INVULN_MS;
    else this.braveInvulnUntil = time + INVULN_MS;

    const knockX = this.boss.x < player.x ? 320 : -320;
    player.setVelocity(knockX, this.boss.spec.knockbackVelocity);
    this.drawBars();
  }

  private closestAlivePlayer(): PlayerCharacter | null {
    const alive: PlayerCharacter[] = [];
    if (this.hope.hp > 0) alive.push(this.hope);
    if (this.brave.hp > 0) alive.push(this.brave);
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

    this.hopeBar.clear();
    this.hopeBar.fillStyle(0x000000, 0.5);
    this.hopeBar.fillRect(40, 96, w, h);
    this.hopeBar.fillStyle(0x22c55e, 1);
    this.hopeBar.fillRect(40, 96, w * (this.hope.hp / this.hope.maxHp), h);
    this.hopeBar.lineStyle(2, 0xffffff, 0.6);
    this.hopeBar.strokeRect(40, 96, w, h);

    this.braveBar.clear();
    this.braveBar.fillStyle(0x000000, 0.5);
    this.braveBar.fillRect(40, 116, w, h);
    this.braveBar.fillStyle(0xfb923c, 1);
    this.braveBar.fillRect(40, 116, w * (this.brave.hp / this.brave.maxHp), h);
    this.braveBar.lineStyle(2, 0xffffff, 0.6);
    this.braveBar.strokeRect(40, 116, w, h);

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
    this.hope.stopHorizontal();
    this.brave.stopHorizontal();

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
