import * as Phaser from "phaser";
import { TEXTURES } from "../assets/placeholders";
import { Hope, HOPE_CONFIG } from "../characters/Hope";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const STRESS_MAX_HP = 200;
const GROUND_Y = 640;

export class StageScene extends Phaser.Scene {
  private hope!: Hope;
  private stress!: Phaser.Physics.Arcade.Sprite;
  private stressHp = STRESS_MAX_HP;
  private stressFlashing = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  private hopeBar!: Phaser.GameObjects.Graphics;
  private stressBar!: Phaser.GameObjects.Graphics;
  private hpLabel!: Phaser.GameObjects.Text;
  private bossLabel!: Phaser.GameObjects.Text;
  private hintsLabel!: Phaser.GameObjects.Text;
  private outcomeLabel?: Phaser.GameObjects.Text;

  private finished = false;

  constructor() {
    super({ key: "StageScene" });
  }

  create(): void {
    this.physics.world.gravity.y = 1100;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x4338ca, 0x4338ca, 0x0f0a1f, 0x0f0a1f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add
      .text(GAME_WIDTH / 2, 40, "ETAP 1 — SALA ZABAW SZPITALA", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fcd34d",
      })
      .setOrigin(0.5);

    const ground = this.physics.add.staticGroup();
    for (let x = 0; x < GAME_WIDTH; x += 64) {
      ground.create(x + 32, GROUND_Y + 16, TEXTURES.ground);
    }

    this.hope = new Hope(this, 320, GROUND_Y);
    this.physics.add.collider(this.hope, ground);

    this.stress = this.physics.add.sprite(950, GROUND_Y, TEXTURES.stress);
    this.stress.setOrigin(0.5, 1);
    this.stress.setImmovable(true);
    const stressBody = this.stress.body as Phaser.Physics.Arcade.Body;
    stressBody.allowGravity = false;
    stressBody.setSize(180, 280);
    stressBody.setOffset(6, 8);

    this.add
      .text(this.stress.x, GROUND_Y - 305, "LORD STRES", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#f87171",
      })
      .setOrigin(0.5);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.A,
    );
    this.keyS = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.S,
    );
    this.keySpace = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );

    this.hopeBar = this.add.graphics();
    this.stressBar = this.add.graphics();

    this.hpLabel = this.add.text(40, 70, "NADZIEJA", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#fcd34d",
    });

    this.bossLabel = this.add.text(GAME_WIDTH - 240, 70, "LORD STRES", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#f87171",
    });

    this.hintsLabel = this.add
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
      this.hope.moveLeft();
    } else if (this.cursors.right?.isDown) {
      this.hope.moveRight();
    } else {
      this.hope.stopHorizontal();
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace)
    ) {
      this.hope.jump();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
      const hb = this.hope.tryLightAttack(time);
      if (hb) this.resolveAttack(hb, HOPE_CONFIG.lightDamage, false);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
      const hb = this.hope.tryHeavyAttack(time);
      if (hb) this.resolveAttack(hb, HOPE_CONFIG.heavyDamage, true);
    }
  }

  private resolveAttack(
    hitbox: Phaser.Geom.Rectangle,
    damage: number,
    heavy: boolean,
  ): void {
    const sb = this.stress.body as Phaser.Physics.Arcade.Body;
    const stressRect = new Phaser.Geom.Rectangle(
      sb.x,
      sb.y,
      sb.width,
      sb.height,
    );
    if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, stressRect)) {
      this.stressHp = Math.max(0, this.stressHp - damage);
      this.spawnHitFlash(this.stress.x, this.stress.y - 140, heavy);
      if (!this.stressFlashing) {
        this.stressFlashing = true;
        this.tweens.add({
          targets: this.stress,
          tint: 0xff5555,
          duration: 70,
          yoyo: true,
          onComplete: () => {
            this.stress.clearTint();
            this.stressFlashing = false;
          },
        });
      }
      this.drawBars();

      if (this.stressHp === 0) {
        this.endStage(true);
      }
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
    const barWidth = 200;
    const barHeight = 14;

    this.hopeBar.clear();
    this.hopeBar.fillStyle(0x000000, 0.5);
    this.hopeBar.fillRect(40, 86, barWidth, barHeight);
    const hopePct = this.hope.hp / HOPE_CONFIG.maxHp;
    this.hopeBar.fillStyle(0x22c55e, 1);
    this.hopeBar.fillRect(40, 86, barWidth * hopePct, barHeight);
    this.hopeBar.lineStyle(2, 0xffffff, 0.6);
    this.hopeBar.strokeRect(40, 86, barWidth, barHeight);

    this.stressBar.clear();
    this.stressBar.fillStyle(0x000000, 0.5);
    this.stressBar.fillRect(GAME_WIDTH - 240, 86, barWidth, barHeight);
    const stressPct = this.stressHp / STRESS_MAX_HP;
    this.stressBar.fillStyle(0xef4444, 1);
    this.stressBar.fillRect(GAME_WIDTH - 240, 86, barWidth * stressPct, barHeight);
    this.stressBar.lineStyle(2, 0xffffff, 0.6);
    this.stressBar.strokeRect(GAME_WIDTH - 240, 86, barWidth, barHeight);
  }

  private endStage(victory: boolean): void {
    this.finished = true;
    this.hope.stopHorizontal();

    const message = victory
      ? "UZDROWIONO!\nLord Stres rozpływa się w świetle nadziei."
      : "PRZERWA W WALCE.\nNabierz sił i spróbuj ponownie.";

    this.outcomeLabel = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, message, {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#fcd34d",
        align: "center",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    if (victory) {
      this.tweens.add({
        targets: this.stress,
        alpha: 0,
        scale: 1.3,
        duration: 800,
      });
      this.spawnHealParticles();
    }

    this.time.delayedCall(2400, () => {
      this.scene.start("MainMenuScene");
    });

    void this.bossLabel;
    void this.hpLabel;
    void this.hintsLabel;
  }

  private spawnHealParticles(): void {
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dx = Math.cos(angle) * 80;
      const dy = Math.sin(angle) * 80;
      const p = this.add.image(
        this.stress.x,
        this.stress.y - 140,
        TEXTURES.hitFlash,
      );
      p.setScale(0.8);
      this.tweens.add({
        targets: p,
        x: this.stress.x + dx * 3,
        y: this.stress.y - 140 + dy * 3,
        alpha: 0,
        scale: 0.2,
        duration: 1200,
        ease: "Cubic.Out",
        onComplete: () => p.destroy(),
      });
    }
  }
}
