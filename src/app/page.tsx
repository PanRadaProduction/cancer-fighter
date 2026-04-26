import Link from "next/link";
import { DonateQR } from "@/components/DonateQR";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col bg-[#04020e] text-white overflow-hidden">
      {/* Background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(109,246,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,43,214,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 75%)",
        }}
      />
      {/* Sun-like neon horizon */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-[55%] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, #ff2bd6 0%, #6d28d9 35%, transparent 70%)",
        }}
      />

      {/* CRT overlay layers */}
      <div
        aria-hidden
        className="crt-scanlines crt-sweep crt-vignette pointer-events-none absolute inset-0"
      />

      <div className="crt-flicker relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-10 px-6 py-12 sm:py-16">
        {/* TOP: insert coin / heroes of hope label */}
        <div className="font-arcade flex w-full items-center justify-between text-[10px] tracking-[0.25em] sm:text-xs">
          <span className="neon-cyan">1P · READY</span>
          <span className="neon-amber">HEROES OF HOPE</span>
          <span className="neon-magenta">CREDITS · ∞</span>
        </div>

        {/* TITLE */}
        <div className="flex flex-col items-center text-center">
          <p className="font-arcade neon-magenta text-[9px] tracking-[0.5em] sm:text-xs">
            ★ CHARYTATYWNA ARCADE ★
          </p>
          <h1 className="font-arcade arcade-title mt-6 text-3xl leading-[1.1] sm:text-5xl md:text-6xl">
            CANCER
            <br />
            FIGHTER
          </h1>
          <p className="font-crt mt-6 max-w-xl text-xl leading-snug text-cyan-100/85 sm:text-2xl">
            Retro pixel-art bijatyka wspierająca walkę z rakiem dziecięcym.
            Każda runda to symboliczny krok obok dzieci, które walczą naprawdę.
          </p>
        </div>

        {/* MODE SELECT */}
        <section
          aria-label="Tryby gry"
          className="font-arcade flex w-full max-w-3xl flex-col gap-4"
        >
          <h2 className="text-center text-[10px] tracking-[0.4em] text-cyan-200/70 sm:text-xs">
            — WYBIERZ TRYB —
          </h2>
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 sm:gap-6">
            <ModeCard
              href="/play?mode=story"
              role="STORY"
              name="1 GRACZ"
              accent="cyan"
              spriteClass="hope-sprite-frame"
              description="Solo vs bossowie"
            />
            <ModeCard
              href="/play?mode=coop"
              role="CO-OP"
              name="2 GRACZE"
              accent="magenta"
              description="Duet bohaterów"
            />
          </div>
        </section>

        {/* INSERT COIN — donation panel */}
        <section
          aria-labelledby="donate-heading"
          className="cabinet-bezel relative flex w-full max-w-2xl flex-col items-center gap-4 rounded-md bg-[#0d0524]/85 px-6 py-8 backdrop-blur-sm"
        >
          <h2
            id="donate-heading"
            className="font-arcade neon-magenta text-xs tracking-[0.35em] sm:text-sm"
          >
            ▼ INSERT COIN ▼
          </h2>
          <p className="font-crt text-center text-lg leading-tight text-cyan-100/85 sm:text-xl">
            Wesprzyj akcję — zeskanuj kod i odpal donację.
          </p>
          <DonateQR size={200} showCta={false} />
          <p className="font-arcade text-[9px] tracking-[0.3em] text-amber-200/70 sm:text-[10px]">
            POWERED BY TIPPLY · QR · TAP TO PAY
          </p>
        </section>

        {/* TICKER */}
        <div className="relative w-full overflow-hidden border-y border-cyan-400/20 bg-[#070314]/70 py-2">
          <div className="marquee font-arcade flex shrink-0 gap-12 whitespace-nowrap text-[10px] tracking-[0.35em] text-cyan-200/70 sm:text-xs">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="flex shrink-0 items-center gap-12">
                <span>★ HEROES OF HOPE</span>
                <span className="neon-magenta">CHARYTATYWNA AKCJA</span>
                <span>★ NADZIEJA VS LORD STRES</span>
                <span className="neon-cyan">PRE-ALPHA · v0.1.0</span>
                <span>★ STAGE 1 — SALA ZABAW SZPITALA</span>
                <span className="neon-amber">PRESS START</span>
                <span>★ KAŻDA RUNDA = KROK OBOK DZIECI</span>
              </span>
            ))}
          </div>
        </div>

        <p className="font-arcade text-center text-[9px] leading-relaxed tracking-[0.25em] text-white/40 sm:text-[10px]">
          © HEROES OF HOPE · PRE-PRODUKCJA · STATUS ZBIÓRKI BĘDZIE PUBLICZNY
        </p>
      </div>
    </main>
  );
}

type ModeAccent = "cyan" | "magenta";

function ModeCard({
  href,
  role,
  name,
  accent,
  spriteClass,
  description,
}: {
  href: string;
  role: string;
  name: string;
  accent: ModeAccent;
  spriteClass?: string;
  description: string;
}) {
  const accentMap = {
    cyan: {
      ring: "ring-cyan-400/60",
      hoverRing: "hover:ring-cyan-300 focus-visible:ring-cyan-300",
      glow: "neon-cyan",
      chip: "#6df6ff",
    },
    magenta: {
      ring: "ring-fuchsia-400/60",
      hoverRing: "hover:ring-fuchsia-300 focus-visible:ring-fuchsia-300",
      glow: "neon-magenta",
      chip: "#ff2bd6",
    },
  } as const;
  const a = accentMap[accent];
  return (
    <Link
      href={href}
      aria-label={`${role} — ${name}`}
      className={`group relative flex flex-col items-center gap-2 rounded-md bg-[#0d0524]/70 px-3 pb-4 pt-3 ring-1 outline-none transition-transform sm:px-4 sm:pt-4 ${a.ring} ${a.hoverRing} hover:-translate-y-0.5 hover:ring-2 focus-visible:ring-2`}
    >
      <span
        className={`font-arcade absolute -top-2 left-1/2 -translate-x-1/2 rounded-sm bg-[#04020e] px-2 py-0.5 text-[8px] tracking-[0.3em] ${a.glow}`}
      >
        {role}
      </span>
      <div
        className="relative mt-3 flex h-36 w-full items-end justify-center overflow-hidden rounded-sm sm:h-44"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, ${a.chip}22 100%)`,
        }}
      >
        {spriteClass ? (
          <div className={`pixelated ${spriteClass}`} aria-hidden />
        ) : (
          <div className="flex items-end gap-3" aria-hidden>
            <div className="pixelated hope-sprite-frame" />
            <div
              className="pixelated"
              style={{
                width: 96,
                height: 144,
                background: `repeating-linear-gradient(45deg, ${a.chip}33 0, ${a.chip}33 4px, transparent 4px, transparent 8px)`,
                border: `2px solid ${a.chip}`,
                boxShadow: `0 0 12px ${a.chip}`,
              }}
            />
          </div>
        )}
      </div>
      <p className={`font-arcade text-[10px] tracking-[0.2em] sm:text-xs ${a.glow}`}>
        {name}
      </p>
      <p className="font-crt text-center text-sm text-white/75 sm:text-base">
        {description}
      </p>
      <span className="font-arcade text-[9px] tracking-[0.35em] text-amber-200/80 sm:text-[10px]">
        ▶ ZAGRAJ
      </span>
    </Link>
  );
}
