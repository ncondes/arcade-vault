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
01–03 are implemented: landing (`/`), game library (`/games`), game detail and play screens
(`/games/[id]`, `/games/[id]/play`), hall of fame (`/hall-of-fame`), about + contact form wired
to Resend (`/about`) and a **mock** login (`/login` — `AuthForm.tsx` validates nothing, creates
no session, just navigates to `/games`).

All domain data is still **static**, hardcoded in `app/lib/{games,scores,home,about}.ts`. There
is no database behind any screen yet, and no real games — the play screen is a mockup.

Features go through a **spec-driven workflow**: `/spec` (write the spec) then `/spec-impl`
(implement it). Both skills are installed under `.claude/skills/`, and the specs live in
`specs/NN-slug.md`. Write the spec before implementing a feature.

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

Spec 04 installed the plumbing and nothing else: the two clients, session refresh, the linked CLI
and generated types. **The database still has zero tables**, `supabase/migrations/` is empty on
purpose, and no screen reads from Supabase — all domain data is still static.

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

**The moment the first table exists in `public`: RLS on, explicit policies, and types regenerated.**
Not "later".

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
