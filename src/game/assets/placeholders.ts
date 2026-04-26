import * as Phaser from "phaser";

export const TEXTURES = {
  hope: "hope-placeholder",
  brave: "brave-placeholder",
  wise: "wise-placeholder",
  stress: "stress-placeholder",
  darkness: "darkness-placeholder",
  ground: "ground-placeholder",
  groundGarden: "ground-garden-placeholder",
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

  if (!scene.textures.exists(TEXTURES.brave)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xdc2626);
    g.fillRoundedRect(0, 0, 96, 144, 10);
    g.fillStyle(0xfecaca);
    g.fillCircle(48, 36, 22);
    g.fillStyle(0x1e1b4b);
    g.fillCircle(40, 32, 4);
    g.fillCircle(56, 32, 4);
    g.lineStyle(3, 0x1e1b4b);
    g.beginPath();
    g.arc(48, 44, 8, 0.2, Math.PI - 0.2);
    g.strokePath();
    // Tarcza na piersi
    g.fillStyle(0xfde047);
    g.fillCircle(48, 90, 18);
    g.fillStyle(0xdc2626);
    g.fillRect(46, 76, 4, 28);
    g.fillRect(34, 88, 28, 4);
    g.fillStyle(0x1e1b4b);
    g.fillRect(40, 110, 16, 30);
    g.lineStyle(3, 0x1e1b4b);
    g.strokeRoundedRect(0, 0, 96, 144, 10);
    g.generateTexture(TEXTURES.brave, 96, 144);
    g.destroy();
  }

  if (!scene.textures.exists(TEXTURES.wise)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff);
    g.fillRoundedRect(0, 0, 96, 144, 10);
    g.fillStyle(0xfde68a);
    g.fillCircle(48, 36, 22);
    g.fillStyle(0xe5e7eb);
    g.fillRect(34, 24, 28, 6);
    g.fillStyle(0x1e1b4b);
    g.fillCircle(40, 32, 4);
    g.fillCircle(56, 32, 4);
    g.lineStyle(2, 0x6df6ff);
    g.strokeCircle(40, 32, 7);
    g.strokeCircle(56, 32, 7);
    g.lineStyle(2, 0x6df6ff);
    g.strokeRect(15, 80, 66, 50);
    g.fillStyle(0x6df6ff);
    g.fillRect(70, 70, 4, 50);
    g.fillStyle(0xa5f3fc);
    g.fillCircle(72, 70, 5);
    g.fillStyle(0x1e3a8a);
    g.fillRect(38, 110, 20, 30);
    g.lineStyle(3, 0x1e3a8a);
    g.strokeRoundedRect(0, 0, 96, 144, 10);
    g.generateTexture(TEXTURES.wise, 96, 144);
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

  if (!scene.textures.exists(TEXTURES.groundGarden)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x14532d);
    g.fillRect(0, 0, 64, 32);
    g.fillStyle(0x16a34a);
    g.fillRect(0, 0, 64, 4);
    g.fillStyle(0x86efac);
    for (let i = 0; i < 6; i++) {
      const tx = (i * 13) % 60;
      g.fillRect(tx, 4, 2, 6);
    }
    g.lineStyle(1, 0x052e16);
    g.strokeRect(0, 0, 64, 32);
    g.generateTexture(TEXTURES.groundGarden, 64, 32);
    g.destroy();
  }

  if (!scene.textures.exists(TEXTURES.darkness)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x111827);
    g.fillRect(0, 0, 192, 288);
    g.fillStyle(0x1f2937);
    g.fillRect(8, 8, 176, 272);
    // Płaszcz / cień
    g.fillStyle(0x4b5563);
    g.fillTriangle(96, 30, 30, 240, 162, 240);
    // Kaptur / głowa
    g.fillStyle(0x000000);
    g.fillCircle(96, 80, 44);
    g.fillStyle(0x1f2937);
    g.fillCircle(96, 80, 36);
    // Świecące oczy
    g.fillStyle(0xc4b5fd);
    g.fillCircle(80, 78, 6);
    g.fillCircle(112, 78, 6);
    g.fillStyle(0xffffff);
    g.fillCircle(80, 78, 2);
    g.fillCircle(112, 78, 2);
    // Łza/krew
    g.fillStyle(0x7c3aed);
    g.fillTriangle(80, 90, 76, 104, 84, 104);
    g.lineStyle(4, 0x000000);
    g.strokeRect(0, 0, 192, 288);
    g.generateTexture(TEXTURES.darkness, 192, 288);
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
