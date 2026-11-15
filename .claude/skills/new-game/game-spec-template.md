# Game spec — the game-specific layer over `/spec`'s template

The structure, order and rules of every section come from `.claude/skills/spec/template.md`. Lines marked **(port)** apply only to a reference port and lines marked **(original)** only to an original game; adapt or drop the rest. This file only says **what a game spec has to carry in each of those sections**. It is a shape, not text to copy: replace `<id>`, `<TÍTULO>`, `<origen>`, `NN` with real values and drop what does not apply.

## Header

- **Depends on:** 05 (runtime) and 06 (catalog + scores), plus any earlier game spec whose contract extension this one reuses.
- **Objective:** one sentence: port `<origen>` (or build `<idea>`) as the playable game `<id>`, seeded in the catalog with a migration so its scores reach the existing rankings.

## Why this spec exists

Only when there is a contract extension or a mockup conversion. Say which gaps the game exposes, and that the leaderboard needs no new code.

## Scope — In

- **Catalog:** migration `add_<id>` (an `insert`, or an `update` of the converted mockup row); `"cover-<id>"` in `CoverClass`; `.cover-<id>` in `globals.css`; the cascades (library count, hall of fame tabs, the home's 6 featured games, the `N+` stat).
- **Contract:** each extension decided in the questions, stated as additive.
- **Engine `app/lib/arcade/<id>/`:** pure TypeScript, injected canvas, state in the instance, colours in `constants.ts`. **(port)** The numbers ported 1:1 (listed) and what leaves the original (DOM HUD, overlays, own keys, theme, sound). **(original)** The design numbers, all in `constants.ts`.
- **Registry:** the one line in `registry.ts`.
- **`CLAUDE.md`:** the number of real games, the games still waiting in `references/`, and any contract extension.

## Scope — Out

Converting or retiring the other mockups; the other references; modern or balance changes to the mechanics; sound; touch controls; storing extra stats (lines, level) in `scores`; any schema change; tests; editing `references/`.

## Data model

- **Files:** `index.ts` (the only public entry: `width`, `height`, `controls`, `createEngine`), `constants.ts`, `engine.ts`, plus whatever the game needs (`entities.ts`, a pure-logic `board.ts`, `levels.ts`…).
- **Contract changes:** the exact TS diff of `types.ts` / `keyboard.ts` / `GameCanvas.tsx`, if any.
- **The published snapshot:** e.g. `{ score, lives: null, level, status }`, published on change only.
- **The catalog SQL**, in full:

  ```sql
  -- Appended at the end: touches no other row.
  insert into public.games (id, title, short, long, category, cover, color, position)
  select '<id>', '<TÍTULO>', '<short>', '<long>', '<CATEGORY>', 'cover-<id>', '<color>',
         coalesce(max(position), 0) + 1
  from public.games;
  ```

  When the user picks a slot `P` other than the end: `position` is `unique` and not deferrable, so a single `position + 1` can collide mid-update. Shift in two steps, then insert:

  ```sql
  update public.games set position = position + 1000 where position >= P;
  update public.games set position = position - 999  where position >= 1000 + P;
  insert into public.games (...) values (..., P);
  ```

  When converting a mockup instead, it is an `update public.games set ... where id = '<mockup>'`, and its existing scores stay.

- **No schema change:** `npm run db:types` must produce no diff.

## Implementation plan (each step leaves `npm run build` green)

1. **Contract extensions** (only if any), with asteroides played again to confirm nothing changed.
2. **Pure logic and constants**: **(port)** with the same numbers as the original; **(original)** with the spec's design numbers. Nothing imports them yet.
3. **Engine and `index.ts`:** idempotent commands, keys cleared on pause, time reference reset on resume, every timer and movement × `dt`. **(port)** The four translations (globals → instance, HUD out of the canvas, colours in constants, frame-rate dependencies fixed). Still not registered. If this step would be too big for `/spec`'s step-size rule, split it (state and rules / input / drawing).
4. **Cover** `cover-<id>` with the `/frontend-design` skill.
5. **Migration:** invoke the `supabase` skill → `npm run db:migration add_<id> </dev/null` → write the SQL → `npm run db:push -- --dry-run` → ⚠️ **`npm run db:push` writes to the remote production database (`vrepjeurrsaekrosmuye`)**: blast radius = the `games` rows it inserts or reorders; ask for explicit confirmation → verify with MCP (`select` of the catalog, `get_advisors` security) → `npm run db:types` with no diff. `/games/<id>/play` now shows the mockup.
6. **Registry line:** the game plays for real and the `JUGABLE` badge appears.
7. **Canvas look** with `/frontend-design`. The board is drawn by the engine, so this step may change the drawing code and the colours in `constants.ts` (and `globals.css` only for the frame). The CRT scanlines stay on top.
8. **Real play session** with StrictMode: every mechanic listed, pause by button and Esc, tab switch, FIN, natural game over, save `KAI`, leave and come back. **(port)** The original open side by side. **(original)** Every design number changed while playing goes into Decisiones with its previous value.
9. **`CLAUDE.md`.**
10. **Final check:** `npm run lint`, `npm run build`, `npm run format:check`, `npx tsc --noEmit`.

## Acceptance criteria (standard block, plus the game's own)

- **Build:** the four commands green.
- **Contract:**
  - `app/lib/arcade/<id>/index.ts` exports `width`, `height`, `controls`, `createEngine`;
  - from outside the folder only `index` is imported;
  - `grep -rn "getElementById\|querySelector\|localStorage" app/lib/arcade/` is empty;
  - `grep -n "<id>" app/components/*.tsx` is empty;
  - `git status references/` is clean;
  - **(port)** constants match the original one to one; **(original)** constants match the spec, or each difference is recorded in Decisiones.
- **Database:**
  - the migration exists and `npx supabase migration list --linked` shows it applied;
  - `games` has the `<id>` row with a unique `position` and the expected order;
  - `get_advisors` gives no new warnings;
  - `db:types` produces no diff.
- **Catalog:**
  - the library card count, the category filter, `JUGABLE` only on the playable games;
  - the cover is distinguishable from the closest one;
  - the home and hall of fame cascades;
  - the converted or neighbouring mockup unchanged.
- **The game:** one criterion per mechanic, number and control from the inventory, checked by playing.
- **HUD and platform:**
  - HUD values match the canvas;
  - PAUSA and Esc;
  - auto-pause on blur, still paused on return;
  - FIN shows the running score;
  - JUGAR DE NUEVO resets;
  - no scroll while playing, scroll in pause or the modal;
  - a single loop under StrictMode;
  - no orphan loop after leaving;
  - a clean console.
- **Leaderboard (from spec 06, verified, no new code):**
  - saving `KAI` shows PUNTUACIÓN GUARDADA and a `scores` row with `game_id = '<id>'`;
  - after reload it appears in the detail top 10, the record and PUNTUACIONES, the library card, the `<TÍTULO>` hall of fame tab, and the home's recent scores;
  - the POR JUGADOR matrix gains the `<TÍTULO>` column in catalog order.
- **Regression:**
  - asteroides plays and saves exactly as before;
  - every contract extension's regression criterion from `contract-gaps.md`;
  - `/about`, `AuthForm` and `/no-existe` still work.

## Decisions

Every answer from the question blocks, each with what was discarded: new id vs mockup, title (and that it is original), position, colour/cover, port fidelity (undocumented features kept or dropped), each contract gap, sound and assets.

## Risks

The usual ones: `db:push` to production (and reordering, if the position is not the end), feel differences from the original (input, `dt`), StrictMode double loops, CRT stacking over the canvas, two similar games in the library when a mockup is kept.
