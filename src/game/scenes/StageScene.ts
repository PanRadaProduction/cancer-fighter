import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import { Boss, BOSS_SPECS, type BossSpec } from "../characters/Boss";
import { Brave } from "../characters/Brave";
import { Hope } from "../characters/Hope";
import { PlayerCharacter } from "../characters/PlayerCharacter";
import { bgm } from "../audio/bgm";
import { sfx } from "../audio/sfx";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import type { CharacterKey } from "./StorySelectScene";

export type StageData = { stage?: 1 | 2; character?: CharacterKey };

const GROUND_Y = 640;

const STAGE_CONFIG: Record<
  1 | 2,
  {
    title: string;
    bossKey: BossSpec["key"];
    bgColors: [number, number, number, number];
    groundTexture: string;
  }
> = {
  1: {
    title: "ETAP 1 — SALA ZABAW SZPITALA",
    bossKey: "stress",
    bgColors: [0x4338ca, 0x4338ca, 0x0f0a1f, 0x0f0a1f],
    groundTexture: TEXTURES.ground,
  },
  2: {
    title: "ETAP 2 — MAGICZNY OGRÓD",
    bossKey: "darkness",
    bgColors: [0x166534, 0x166534, 0x4c1d95, 0x4c1d95],
    groundTexture: TEXTURES.groundGarden,
  },
};

function spawnPlayer(
  scene: Phaser.Scene,
  key: CharacterKey,
  x: number,
  y: number,
): PlayerCharacter {
  if (key === "brave") return new Brave(scene, x, y);
  return new Hope(scene, x, y);
}

export class StageScene extends Phaser.Scene {
  private player!: PlayerCharacter;
  private boss!: Boss;
  private currentStage: 1 | 2 = 1;
  private characterKey: CharacterKey = "hope";

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  private playerBar!: Phaser.GameObjects.Graphics;
  private bossBar!: Phaser.GameObjects.Graphics;

  private playerInvulnUntil = 0;
  private finished = false;

  constructor() {
    super({ key: "StageScene" });
  }

  init(data: StageData): void {
    this.currentStage = data.stage ?? 1;
    this.characterKey = data.character ?? "hope";
    this.finished = false;
    this.playerInvulnUntil = 0;
  }

  create(): void {
    const stageCfg = STAGE_CONFIG[this.currentStage];
    const spec = BOSS_SPECS[stageCfg.bossKey];

    bgm.play(this.currentStage === 1 ? "stage1" : "stage2");

    this.physics.world.gravity.y = 1100;

    const bg = this.add.graphics();
    bg.fillGradientStyle(...stageCfg.bgColors, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add
      .text(GAME_WIDTH / 2, 40, stageCfg.title, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fcd34d",
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        62,
        `Boss: ${spec.name}    HP: ${spec.maxHp}`,
        {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#cbd5e1",
        },
      )
      .setOrigin(0.5);

    const ground = this.physics.add.staticGroup();
    for (let x = 0; x < GAME_WIDTH; x += 64) {
      ground.create(x + 32, GROUND_Y + 16, stageCfg.groundTexture);
    }

    this.player = spawnPlayer(this, this.characterKey, 320, GROUND_Y);
    this.physics.add.collider(this.player, ground);

    this.boss = new Boss(this, 950, GROUND_Y, spec);

    this.add.text(40, 70, this.player.displayName.toUpperCase(), {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#fcd34d",
    });

    this.add
      .text(GAME_WIDTH - 240, 70, spec.name, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: spec.labelColor,
      })
      .setOrigin(0, 0);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keySpace = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );

    this.playerBar = this.add.graphics();
    this.bossBar = this.add.graphics();

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 30,
        "← → ruch     ↑ / SPACJA skok     A lekki atak     S silny atak",
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

    if (this.cursors.left?.isDown) {
      this.player.moveLeft();
    } else if (this.cursors.right?.isDown) {
      this.player.moveRight();
    } else {
      this.player.stopHorizontal();
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace)
    ) {
      this.player.jump();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
      const hb = this.player.tryLightAttack(time);
      if (hb) this.resolvePlayerAttack(hb, this.player.lightDamage, false);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
      const hb = this.player.tryHeavyAttack(time);
      if (hb) this.resolvePlayerAttack(hb, this.player.heavyDamage, true);
    }

    this.boss.tick(time, this.player);

    if (time >= this.playerInvulnUntil) {
      const bossHits = this.boss.getActiveHitboxes();
      const playerRect = this.playerRect();
      for (const { rect, damage } of bossHits) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(rect, playerRect)) {
          this.player.takeDamage(damage);
          this.playerInvulnUntil = time + 700;
          const knockX = this.boss.x < this.player.x ? 320 : -320;
          this.player.setVelocity(knockX, this.boss.spec.knockbackVelocity);
          this.drawBars();
          break;
        }
      }
    }

    if (this.player.hp <= 0) {
      this.endStage(false);
      return;
    }

    if (this.boss.isDead()) {
      this.endStage(true);
    }
  }

  private playerRect(): Phaser.Geom.Rectangle {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
  }

  private resolvePlayerAttack(
    hitbox: Phaser.Geom.Rectangle,
    damage: number,
    heavy: boolean,
  ): void {
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
      this.spawnHitFlash(this.boss.x, this.boss.y - 140, heavy);
      this.drawBars();
    }
  }

  private spawnHitFlash(x: number, y: number, heavy: boolean): void {
    const flash = this.add.image(x, y, TEXTURES.hitFlash);
    flash.setScale(heavy ? 1.6 : 1);
    flash.setAlpha(0.95);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: heavy ? 2.4 : 1.6,
      duration: 240,
      onComplete: () => flash.destroy(),
    });
  }

  private drawBars(): void {
    const w = 200;
    const h = 14;

    this.playerBar.clear();
    this.playerBar.fillStyle(0x000000, 0.5);
    this.playerBar.fillRect(40, 86, w, h);
    const playerPct = this.player.hp / this.player.maxHp;
    this.playerBar.fillStyle(0x22c55e, 1);
    this.playerBar.fillRect(40, 86, w * playerPct, h);
    this.playerBar.lineStyle(2, 0xffffff, 0.6);
    this.playerBar.strokeRect(40, 86, w, h);

    this.bossBar.clear();
    this.bossBar.fillStyle(0x000000, 0.5);
    this.bossBar.fillRect(GAME_WIDTH - 240, 86, w, h);
    const bossPct = this.boss.hp / this.boss.spec.maxHp;
    this.bossBar.fillStyle(0xef4444, 1);
    this.bossBar.fillRect(GAME_WIDTH - 240, 86, w * bossPct, h);
    this.bossBar.lineStyle(2, 0xffffff, 0.6);
    this.bossBar.strokeRect(GAME_WIDTH - 240, 86, w, h);
  }

  private endStage(victory: boolean): void {
    this.finished = true;
    this.player.stopHorizontal();

    if (victory) {
      sfx.playVictory();
    } else {
      sfx.playDefeat();
    }

    const isLastStage = this.currentStage === 2;
    const isMidVictory = victory && !isLastStage;

    if (isMidVictory) {
      this.add
        .text(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2 - 40,
          "UZDROWIONO!\nKolejny krok leczenia...",
          {
            fontFamily: "monospace",
            fontSize: "30px",
            color: "#fcd34d",
            align: "center",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
          },
        )
        .setOrigin(0.5);
    }

    if (victory) {
      this.tweens.add({
        targets: this.boss,
        alpha: 0,
        scale: 1.3,
        duration: 800,
      });
      this.spawnHealParticles();
    }

    const delay = victory ? 2400 : 2200;
    this.time.delayedCall(delay, () => {
      if (isMidVictory) {
        this.scene.restart({
          stage: 2,
          character: this.characterKey,
        } satisfies StageData);
      } else {
        this.scene.start("GameOverScene", {
          outcome: victory ? "victory" : "defeat",
          mode: "story",
          character: this.characterKey,
        });
      }
    });
  }

  private spawnHealParticles(): void {
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dx = Math.cos(angle) * 80;
      const dy = Math.sin(angle) * 80;
      const p = this.add.image(this.boss.x, this.boss.y - 140, TEXTURES.hitFlash);
      p.setScale(0.8);
      this.tweens.add({
        targets: p,
        x: this.boss.x + dx * 3,
        y: this.boss.y - 140 + dy * 3,
        alpha: 0,
        scale: 0.2,
        duration: 1200,
        ease: "Cubic.Out",
        onComplete: () => p.destroy(),
      });
    }
  }
}
