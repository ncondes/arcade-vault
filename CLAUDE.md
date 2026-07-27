# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev     # dev server (Turbopack, http://localhost:3000)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint — runs `eslint` directly, NOT `next lint` (removed in Next 16)
```

## Skills

Always use `/frontend-design` skill to design user interfaces.

No test runner is configured. If tests are needed, pick and install one before writing test files.

## What this project is

Arcade Vault — a platform for playing games online and competing for the highest score. The
codebase is currently the unmodified `create-next-app` scaffold (`app/page.tsx` is still the
starter page); the game/scoring domain has not been built yet.

The README specifies a **spec-driven workflow**: features go through `/spec` (write the spec)
then `/spec-impl` (implement it). Those skills come from
[Klerith/fernando-skills](https://github.com/Klerith/fernando-skills) and are **not installed
yet** — install with `npx skills@latest add Klerith/fernando-skills`. Prefer writing a spec
before implementing a feature.

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
