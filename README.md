# Cancer Fighter — Heroes of Hope

Charytatywna gra 2D fighting (retro pixel art) wspierająca walkę z rakiem dziecięcym.

> **Status:** scaffold — projekt w fazie pre-produkcji.
> **Plan produkcyjny:** `~/.claude/plans/plan-stworzenia-gry-async-petal.md`

## Misja

- Zbiórka funduszy na walkę z rakiem dziecięcym
- Edukacja i budowanie świadomości
- Mechanika **leczenia** zamiast obrażeń — bohaterowie pokonują personifikacje chorób, nie siebie nawzajem
- Pełna zgodność z RODO i przepisami o zbiórkach publicznych

## Stack

- **Engine:** Phaser 4
- **Frontend / SSR:** Next.js 16 (App Router) + React 19 + Tailwind v4
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- **Hosting:** Vercel + Cloudflare CDN dla assetów
- **Płatności:** Zrzutka.pl / PayU / Stripe

## Struktura

```
src/
  app/                Next.js App Router (lądówka, panel zbiórki)
  game/
    scenes/           Phaser scenes (menu, story, versus, training)
    characters/       Definicje postaci (Hope, Brave, Wise Doc, ...)
  lib/                Klient Supabase, helpery
supabase/
  migrations/         Schemat bazy (donations, players, stories)
  functions/          Edge Functions (webhooki płatności, agregacja zbiórki)
assets/
  sprites/            Pixel art postaci i bossów
  audio/              Muzyka i SFX
  backgrounds/        Tła stages
docs/
  legal/              Regulamin, polityka prywatności, RODO, dokumenty zbiórki
```

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Otwórz `http://localhost:3000`.

## Aspekty etyczne

Gra jest narzędziem **wsparcia i edukacji**, nie leczenia. Każdy element narracyjny i medyczny przechodzi konsultację z onkologiem dziecięcym i psychoonkologiem. Wizerunki/historie realnych dzieci wyłącznie za pisemną zgodą rodziców.

## Licencje

- Kod źródłowy: zobacz `LICENSE` (do uzupełnienia)
- Assety (grafika, audio): zobacz `assets/LICENSES.md`
