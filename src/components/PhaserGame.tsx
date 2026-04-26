"use client";

import { useEffect, useRef } from "react";
import type * as Phaser from "phaser";

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    let cancelled = false;
    let game: Phaser.Game | null = null;

    void (async () => {
      const [PhaserLib, { createGameConfig }] = await Promise.all([
        import("phaser"),
        import("@/game/config"),
      ]);
      if (cancelled || !containerRef.current) return;
      game = new PhaserLib.Game(createGameConfig(containerRef.current));
      gameRef.current = game;
    })();

    return () => {
      cancelled = true;
      if (game) {
        game.destroy(true);
      }
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="aspect-video w-full max-w-6xl bg-black ring-1 ring-white/10"
      aria-label="Cancer Fighter — gra"
      role="application"
    />
  );
}
