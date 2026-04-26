import Link from "next/link";
import type { Metadata } from "next";
import { DonateQR } from "@/components/DonateQR";
import { PhaserGame, type LaunchMode } from "@/components/PhaserGame";

export const metadata: Metadata = {
  title: "Cancer Fighter — Gra",
};

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const mode: LaunchMode | undefined =
    raw === "story" || raw === "coop" ? raw : undefined;

  return (
    <main className="relative flex flex-1 items-center justify-center bg-slate-950 p-4 text-white sm:p-8">
      <Link
        href="/"
        className="absolute left-4 top-4 z-10 rounded-md bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition-colors hover:bg-white/20"
      >
        ← powrót
      </Link>

      <PhaserGame mode={mode} />

      <div className="pointer-events-auto absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
        <DonateQR size={120} showCta={false} />
        <span className="rounded-md bg-black/60 px-2 py-1 text-[10px] uppercase tracking-wider text-white/90 backdrop-blur">
          Skanuj telefonem
        </span>
      </div>
    </main>
  );
}
