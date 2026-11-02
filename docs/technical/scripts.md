# Safree — Scripts

_Version 0.1.0 · Generated 2026-05-30_

All scripts ship as `.bat` (Windows) and `.sh` (macOS/Linux) in `/scripts`.

| Script | Purpose | Usage |
|---|---|---|
| install | Verify Node/npm, install deps, scaffold .env.local | `scripts/install.sh` |
| dev | Env check + Supabase + Next dev in parallel, open browser | `scripts/dev.sh` |
| build | Typecheck → lint → unit tests → build → docs → report | `scripts/build.sh` |
| test | Unit+integration coverage, RLS, reports → /reports | `scripts/test.sh` |
| docs | Generate /docs Markdown (+ PDF if md-to-pdf installed) | `scripts/docs.sh` |
| package-desktop | Phase 2 placeholder (Electron) | `scripts/package-desktop.sh` |

Colored output: web = cyan, database = yellow, build = green, errors = red.

