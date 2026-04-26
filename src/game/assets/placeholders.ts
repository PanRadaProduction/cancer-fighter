import * as Phaser from "phaser";

export const TEXTURES = {
  hope: "hope-placeholder",
  stress: "stress-placeholder",
  ground: "ground-placeholder",
  hitFlash: "hitflash-placeholder",
} as const;

export function createPlaceholderTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(TEXTURES.hope)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xfbbf24);
    g.fillRoundedRect(0, 0, 96, 144, 10);
    g.fillStyle(0xfde68a);
    g.fillCircle(48, 36, 22);
    g.fillStyle(0x1e1b4b);
    g.fillCircle(40, 32, 4);
    g.fillCircle(56, 32, 4);
    g.lineStyle(3, 0x1e1b4b);
    g.beginPath();
    g.arc(48, 44, 8, 0.2, Math.PI - 0.2);
    g.strokePath();
    g.fillStyle(0xffffff);
    g.fillRect(20, 80, 56, 4);
    g.fillStyle(0x1e1b4b);
    g.fillRect(40, 100, 16, 36);
    g.lineStyle(3, 0x1e1b4b);
    g.strokeRoundedRect(0, 0, 96, 144, 10);
    g.generateTexture(TEXTURES.hope, 96, 144);
    g.destroy();
  }

  if (!scene.textures.exists(TEXTURES.stress)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x4c1d95);
    g.fillRect(0, 0, 192, 288);
    g.fillStyle(0x6d28d9);
    g.fillRect(8, 8, 176, 272);
    g.fillStyle(0xfca5a5);
    g.fillCircle(60, 100, 16);
    g.fillCircle(132, 100, 16);
    g.fillStyle(0x1e1b4b);
    g.fillCircle(60, 100, 8);
    g.fillCircle(132, 100, 8);
    g.fillStyle(0x000000);
    g.fillTriangle(96, 160, 64, 220, 128, 220);
    g.fillStyle(0xffffff);
    g.fillTriangle(80, 180, 96, 200, 80, 200);
    g.fillTriangle(112, 180, 96, 200, 112, 200);
    g.lineStyle(4, 0x000000);
    g.strokeRect(0, 0, 192, 288);
    g.generateTexture(TEXTURES.stress, 192, 288);
    g.destroy();
  }

  if (!scene.textures.exists(TEXTURES.ground)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x312e81);
    g.fillRect(0, 0, 64, 32);
    g.fillStyle(0x4338ca);
    g.fillRect(0, 0, 64, 4);
    g.lineStyle(1, 0x1e1b4b);
    g.strokeRect(0, 0, 64, 32);
    g.generateTexture(TEXTURES.ground, 64, 32);
    g.destroy();
  }

  if (!scene.textures.exists(TEXTURES.hitFlash)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xfde68a);
    g.fillCircle(20, 20, 20);
    g.fillStyle(0xffffff);
    g.fillCircle(20, 20, 12);
    g.generateTexture(TEXTURES.hitFlash, 40, 40);
    g.destroy();
  }
}
