import Link from "next/link";
import { DonateQR } from "@/components/DonateQR";
import { DONATION } from "@/lib/donation";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Heroes of Hope
          </p>
          <h1 className="mt-3 text-5xl font-extrabold tracking-tight sm:text-6xl">
            Cancer Fighter
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            Charytatywna gra retro pixel art wspierająca walkę z rakiem
            dziecięcym. Każda rozegrana minuta to symboliczny krok obok dzieci,
            które walczą naprawdę.
          </p>
          <Link
            href="/play"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-300 px-8 py-3 font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            ▶ Zagraj teraz
          </Link>
        </div>

        <section
          aria-labelledby="donate-heading"
          className="flex flex-col items-center gap-4 rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur"
        >
          <h2
            id="donate-heading"
            className="text-xl font-semibold text-amber-200"
          >
            Wesprzyj akcję teraz
          </h2>
          <DonateQR size={240} />
          <p className="text-xs text-white/50">
            Płatność przez {DONATION.platform}
          </p>
        </section>

        <p className="text-xs text-white/40">
          Projekt w fazie pre-produkcji. Status zbiórki będzie publiczny.
        </p>
      </div>
    </main>
  );
}
