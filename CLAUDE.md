# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev           # dev server (Turbopack, http://localhost:3000)
npm run build         # production build
npm run start         # serve the production build
npm run lint          # ESLint — runs `eslint` directly, NOT `next lint` (removed in Next 16)
npm run format        # Prettier, rewrites files
npm run format:check  # Prettier, check only

npm run db:types             # regenerate app/lib/supabase/database.types.ts from the linked project
npm run db:migration <name>  # create an empty timestamped migration in supabase/migrations/
npm run db:push              # apply pending migrations to the REMOTE database — writes to production
```

## Skills

Always use `/frontend-design` skill to design user interfaces.

No test runner is configured. If tests are needed, pick and install one before writing test files.

## What this project is

Arcade Vault — a platform for playing games online and competing for the highest score. Specs
01–09 are implemented. The screens: landing (`/`), game library (`/games`), game detail and play screens
(`/games/[id]`, `/games/[id]/play`), hall of fame (`/hall-of-fame`), about + contact form wired
to Resend (`/about`) and a **mock** login (`/login` — `AuthForm.tsx` validates nothing, creates
no session, just navigates to `/games`).

Since spec 06 the **catalog and the scores live in Supabase** (tables `games` and `scores`, see
_Supabase_ below). Every ranking, record and stat on the site — the detail leaderboard, the
library's best score, the hall of fame (per-game podium + top 12, and the **POR JUGADOR** matrix),
and the home's recent scores and top players — is derived from `scores`. Nothing is invented any
more: a block with no rows says "SIN PUNTUACIONES TODAVÍA". Every screen renders **on each
request** (no `generateStaticParams`, no ISR), so a saved score shows on reload.

What is still static: the marketing copy in `app/lib/home.ts` (`FEATURES`, `HOME_STATS` except the
game count, `FAQ`), `app/lib/about.ts`, and `CATEGORY_FILTERS` in `app/lib/games.ts` (UI, not
data). **Four games are real**: `asteroides` (spec 05), `tuerca` (spec 07, a falling-pieces
puzzle with an eighth piece, the nut), `ladrillazo` (spec 08, a brick breaker with the
reference's sprites and sounds) and `serpentina` (spec 09, a snake on a grid with a timed golden
fruit; it was a mockup, converted in place) play on a canvas with a live HUD, and their end-of-game
modal saves the score. The other seven catalog entries (`caida`, `bloque-buster`, `gloton`,
`invasores`, `rocas`, `ranaria`, `duelo-pixel`) are still mockups: they render the mockup play
screen, whose HUD shows `0` and whose modal saves nothing.

Features go through a **spec-driven workflow**: `/spec` (write the spec) then `/spec-impl`
(implement it). Both skills are installed under `.claude/skills/`, and the specs live in
`specs/NN-slug.md`. Write the spec before implementing a feature. For a **new game**, use
`/new-game <reference folder | idea>` instead of `/spec`: it writes the game spec (contract gaps,
catalog seed, standard plan and criteria) by following `/spec`'s rules, then run `/spec-impl`.

## Game runtime (`app/lib/arcade/`)

Real games are framework-free TypeScript engines behind a small contract. The `games` table is
the **catalog** (what the library lists); `app/lib/arcade/` is the **runtime** (what actually
plays). Do not put game code in `app/games/<id>/` — a static segment there shadows
`app/games/[id]/page.tsx` and the game's detail page disappears.

- `types.ts` — the contract. An engine receives a canvas and an `onSnapshot` callback and exposes
  `start / pause / resume / end / restart / destroy`, all idempotent. It publishes
  `{ score, lives, level, status }` **only when a value changes**, never per frame; anything that
  changes every frame (e.g. the `3x 4.7s` timer) is drawn inside the canvas instead, and so is
  anything only one game has (tuerca's LÍNEAS and SIGUIENTE). `lives: null` means "this game has no
  lives" (tuerca): the HUD hides "Vidas". Before the first snapshot the HUD shows the default 3
  hearts, so it tells "no snapshot yet" from `null` (`snapshot ? snapshot.lives : 3`, never `??`).
- `registry.ts` — `id → () => import(...)`. **The only source of truth for "this game is
  playable"**: `isPlayable(id)` drives the real play screen, the `JUGABLE` badge on `GameCard` and
  the detail page. Never add a `playable` flag to the catalog.
- `math.ts`, `keyboard.ts` — shared by every game. The keyboard listens on `window` (a listener on
  the canvas leaves keys stuck on keyup outside it). Three ways to read it: `held()` (down now),
  `pressed()` (pressed since the last read, OS auto-repeat ignored, consumed on read) and `typed()`
  (how many keydowns since the last read, auto-repeat included, consumed on read — for move/rotate
  that repeat at the system's rate). `start()` runs while the starting keydown is still bubbling
  to `window`, so the listener `attach()` just added receives it: clear the keyboard on the first
  frame after start/resume too (tuerca and ladrillazo do), or the start key also acts in the game.
- `<game>/index.ts` — the game's only public entry: default export with `width`, `height`,
  `controls` (rows for the start overlay) and `createEngine`. Nothing outside the folder imports
  its `engine`, `constants` or helpers (`entities`, `board`, `levels`, `sprites`, `sounds`).

Mouse, images and sound live **inside the engine**; the contract does not change for them
(ladrillazo is the precedent):

- **Mouse** — the engine listens to `pointermove` on the canvas it receives (never `document`: it
  would break pause-on-click-outside), scales by `W / rect.width` (never `canvas.width`, which is
  `W · dpr` with HiDPI), acts only while `playing`, and `destroy()` removes the listener.
- **Assets** — files in `public/games/<id>/` (with a `CREDITS.md`), loaded by the engine with
  `new Image()` per instance, never through the bundler. Nothing is drawn until the image loads,
  there is one `draw()` on load, and pixel art sets `imageSmoothingEnabled = false` after the HiDPI
  `setTransform`.
- **Sound** — one `Audio` per effect in the instance, played with
  `cloneNode().play().catch(() => {})` (the rejection is swallowed so the console stays clean), and
  only from `update`, so it is silent while idle, paused or on the modal. There is no platform
  volume or mute yet: that belongs to a platform spec.

`app/components/GameCanvas.tsx` owns everything React/DOM: the dynamic `import()` inside an effect
(so the engine never runs on the server), the start overlay, `preventDefault` of arrows/space
**only while `playing`**, `Esc`, auto-pause on window blur / hidden tab / click outside, and
`destroy()` on unmount. `GamePlayerScreen.tsx` branches on `isPlayable`; the mockup branch must
stay as it was. Neither component may mention a game id.

**Adding the next game** (no reference waits in `references/started-games/` any more: tetris
became `tuerca` and arkanoid became `ladrillazo`; start with `/new-game`, which produces the spec): create
`app/lib/arcade/<id>/` with an `index.ts` that satisfies `ArcadeGameModule` and add one line to
`registry.ts`. If the id is new, its catalog entry is **seeded with a migration** that inserts the
row into `games` (`npm run db:migration add_<id>` with an `insert` including a unique `position`),
not added to `games.ts`. **Converting an existing mockup** keeps its id and its row: the migration
(`npm run db:migration convert_<id>`) is an `update` of that row's texts (`short`, `long`), with
title, category, cover, color and position untouched, so nothing else in the catalog moves (spec 09,
`serpentina`, is the precedent). Both halves are needed: a registered game with no `games` row has no detail
page (`getGame` returns `null` → 404), and a row with no registry entry stays a mockup. Port engines from the
references with state in the instance (no module-level globals), colors in `constants.ts`, the
DOM HUD removed from the canvas, and per-frame physics multiplied by `dt`. Verify by playing, with
StrictMode on: one loop only (rAF rate equals the display refresh rate) and no orphan loop after
leaving the page.

## Stack and conventions

- **Next.js 16.2.12** App Router, **React 19.2.4**, **TypeScript** (`strict: true`), **Tailwind CSS v4**.
- Routes live in `app/` at the repo root — there is no `src/` directory.
- Import alias: `@/*` → repo root (e.g. `@/app/components/Foo`).
- Tailwind v4 is configured through PostCSS (`postcss.config.mjs`) and `@import "tailwindcss"`
  in `app/globals.css`. **There is no `tailwind.config.js`** — design tokens are declared in the
  `@theme inline` block in `globals.css`, and the CSS vars `--background`/`--foreground` drive
  light/dark via `prefers-color-scheme`.
- Fonts are loaded with `next/font/google` in `app/layout.tsx` and exposed as
  `--font-geist-sans` / `--font-geist-mono`.
- ESLint 9 flat config (`eslint.config.mjs`) composing `eslint-config-next/core-web-vitals`
  and `eslint-config-next/typescript`.
- **No blank lines inside code files.** `eslint.config.mjs` sets `no-multiple-empty-lines` to
  `max: 0` and `padded-blocks: "never"`, so js/ts/jsx/tsx carry no blank lines at all — separate
  sections with comments instead. Markdown keeps its blank lines. The PostToolUse hook runs
  Prettier first and ESLint second, so a file written with blank lines comes out without them;
  a file written by hand needs `npx eslint --fix`. Generated files (`next-env.d.ts`,
  `app/lib/supabase/database.types.ts`) are excluded from linting.

## Supabase

Project ref `vrepjeurrsaekrosmuye`. MCP server configured in `.mcp.json`. The API URL and the
publishable key live in `.env` (documented in `.env.example`); `SUPABASE_DB_PASSWORD` is there too
and is used by the CLI, not by the app.

**Invoke the `supabase` skill (in `.claude/skills/`) before touching anything Supabase-related** —
it carries the security checklist and the rule that APIs and CLI flags change often, so verify
against the docs (MCP `search_docs`) or `--help` rather than memory.

Spec 04 installed the plumbing (the two clients, session refresh, the linked CLI and generated
types). Spec 06 added the schema in one migration, `supabase/migrations/*_games_and_scores.sql`.

### Schema and access rules

| Object              | What it holds                                                                         | `anon` / `authenticated` can                                                  |
| ------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `games`             | the catalog: `id`, `title`, `short`, `long`, `category`, `cover`, `color`, `position` | `select` (policy `using (true)`)                                              |
| `scores`            | one row per saved game: `id`, `game_id` → `games.id`, `name`, `score`, `created_at`   | `select` (`using (true)`) and `insert` **only of `game_id`, `name`, `score`** |
| `game_player_bests` | view: one row per (game, name) — best score and `achieved_at` (when first reached)    | `select`                                                                      |
| `game_stats`        | view: one row per game with scores — `best` and `score_count`                         | `select`                                                                      |
| `player_bests`      | view: one row per name — highest single score in any game and its `achieved_at`       | `select`                                                                      |

- **RLS is on in both tables.** There is **no `update` or `delete` policy and no such grant**:
  nobody can edit or remove a score through the API. Cleanup is SQL in a migration.
- The migration `revoke all`s first and then grants only the above, so access does not depend on
  the project's default privileges. `id` and `created_at` are set by the database, so nobody can
  backdate a score to win a tie.
- `scores` validates twice in the database: the table `check` (`name ~ '^[A-Z0-9_]{1,10}$'`,
  `score between 0 and 10000000`) and the insert policy's `with check`, which repeats it.
- `category`, `cover` and `color` are `text` + `check`, not enums. `cover` has a lax check
  (`like 'cover-%'`): the closed list lives in the TS type `CoverClass`.
- **The three views are `security_invoker = true`** — they run with the caller's rights and so obey
  the RLS of `scores`. A new view must do the same, or it bypasses RLS. Aggregates belong in views,
  not in JS.
- **Ties:** same score → whoever reached it first wins (`achieved_at` ascending). The rank is
  never stored: it is the index + 1 after sorting.
- **Known risks (accepted in spec 06):** anonymous inserts mean anyone with the public key can post
  a fake score or an offensive name via REST, and `isPlayable` is only enforced by the Server
  Action, so a direct REST insert can add scores to mockup games. Anti-cheat, rate limiting and
  moderation are future specs.

### Reading and writing from the app

Supabase is only ever called **from the server**. No screen imports `lib/supabase/client.ts`;
Client Components (the hall of fame tabs, the library filters) receive the data as props.

- `app/lib/data/games.ts` (`server-only`) — `getGames()` (ordered by `position`) and
  `getGame(id)` (`null` → `notFound()`). They **throw** on failure: without a catalog there is no
  page, and `app/error.tsx` shows REINTENTAR (it calls `unstable_retry`).
- `app/lib/data/scores.ts` (`server-only`) — `getGameStats`, `getLeaderboard`, `getRecentScores`,
  `getTopPlayers`, `getPlayerMatrix`. They **never throw**: `null` means "RANKING NO DISPONIBLE"
  and `[]` means "SIN PUNTUACIONES TODAVÍA" (both rendered by `RankingNotice`), so a scores failure
  degrades one block and not the page. Their `catch` calls `unstable_rethrow` first — swallowing
  Next's internal `cookies()` signal would prerender the page statically with "no disponible".
- Both wrap their functions in React `cache()` (one query per request even if called twice).
- `app/actions/scores.ts` — Server Action `saveScore({ gameId, name, score })` →
  `{ ok: true } | { ok: false, error }`. Input is untrusted; it validates types, the name regex, an
  integer 0–10.000.000, `isPlayable(gameId)` and that the game exists, then inserts with the
  server client. It is the only writer in the app.
- Dates are `dd/mm/aaaa` in `Europe/Madrid`; "hace X" is computed on the server at render time.
  Scores are formatted with `formatScore` (`app/lib/format.ts`), which always groups (`1.200`) —
  `toLocaleString("es-ES")` does not group 4-digit numbers.

### Which client goes where

- `app/lib/supabase/client.ts` — Client Components only. `createBrowserClient` is already a
  singleton, so call `createClient()` wherever you need it instead of exporting an instance.
- `app/lib/supabase/server.ts` — Server Components, Server Actions and Route Handlers. It is
  `async` because `cookies()` is a Promise in Next 16. **Create a new client per request**: never
  keep it in a module variable or a global, or two users' sessions will mix.
- The two files stay separate on purpose — merging them drags `next/headers` into the browser
  bundle.
- `app/lib/supabase/config.ts` is the only file that reads `process.env`. It validates on import
  and throws naming the variable that is missing.

### `proxy.ts` refreshes the session, it does not protect routes

`proxy.ts` at the repo root delegates to `app/lib/supabase/proxy.ts`, which refreshes the auth
cookie and **always returns a continuation response**. Protecting a route is the route's job, not
this file's. When real auth arrives, keep these three intact:

- `getClaims()`, never `getSession()` — `getSession()` does not revalidate the token, and cookies
  are forgeable.
- No code between `createServerClient` and the `getClaims()` call. Anything in between causes
  random logouts that are very hard to reproduce.
- Apply `setAll`'s second `headers` argument to the response: those are the cache headers that stop
  a CDN from serving one user's session to another.

Do not declare `runtime` in a proxy file — in Next 16 that is a compile error, and the proxy
already runs on the Node.js runtime.

### Changing the schema

Versioned migrations only: `npm run db:migration <name>` creates the file, `npm run db:push`
applies it. Never run loose SQL against the remote project without a file backing it.

- ⚠️ `npm run db:push` writes to the **remote production database**. Pass `-- --dry-run` to see
  what it would apply without applying it.
- `npm run db:migration` reads SQL from stdin, so it hangs in a non-interactive shell — redirect
  `</dev/null` when a tool or script runs it.
- `app/lib/supabase/database.types.ts` is generated: never edit it by hand, regenerate with
  `npm run db:types`. It is in ESLint's ignore list for that reason.
- The link itself lives in `supabase/.temp/`, which is gitignored. After a fresh clone you need
  `npx supabase login` (interactive, a human has to run it) and
  `npx supabase link --project-ref vrepjeurrsaekrosmuye`.

**Every new table in `public`: RLS on, explicit policies and grants, and types regenerated — in
the same migration that creates it.** Not "later". After `db:push`, run the MCP `get_advisors`
(security).

Two things the skill can't know:

- **This repo is public on GitHub.** The ref and the publishable key are public by design, but a
  table without RLS is found by scanners in hours.
- **Never put a secret behind `NEXT_PUBLIC_`** — that prefix ships to the browser. The
  `service_role` / secret key belongs nowhere near `app/`.

## Next.js 16: read the bundled docs first

Per `AGENTS.md`, the version-matched docs ship inside the package at
`node_modules/next/dist/docs/` — that is the source of truth, not training data. Useful entry points:

- `01-app/01-getting-started/` — layouts/pages, server vs client components, data fetching, caching, route handlers
- `01-app/02-guides/` — auth, forms, environment variables, testing, migrating
- `01-app/02-guides/upgrading/version-16.md` — the full list of v16 breaking changes
- `01-app/03-api-reference/` — per-API reference

Things that commonly differ from pre-16 knowledge (confirm details in the docs before relying on them):

- **Async request APIs**: `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()`
  are Promises and must be awaited.
- **`middleware.ts` is now `proxy.ts`**.
- **Turbopack is the default** for `next dev` and `next build`; Turbopack config lives at the
  top level of `next.config.ts`, not under `experimental`.
- **`next lint` was removed** — hence the bare `eslint` in the `lint` script.
- `next/image` defaults changed (`minimumCacheTTL`, `imageSizes`, `qualities`, local images
  with query strings); `images.domains` and `next/legacy/image` are deprecated.
- Parallel routes now require a `default.js`.
