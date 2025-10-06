# Repository Guidelines

## Project Structure & Module Organization
- `src/main.tsx` boots Vite; `src/pages` hosts route screens, `src/components` reusable UI, plus `hooks`, `lib`, `utils`, and asset bundles.
- Static files live in `public/`; Supabase clients and helpers in `src/lib`. Supabase migrations and edge handlers sit in `supabase/migrations` and `supabase/functions`.
- Deployment scripts (`deploy.sh`, `deploy-vercel.sh`) combine Vercel and Supabase steps—update them when build inputs change.

## Build, Test, and Development Commands
- `npm run dev` (or `bun run dev`) serves the app on `localhost:5173`; load env values from `.env` beforehand.
- `npm run build` emits `dist/`; follow with `npm run preview` for smoke tests. `npm run lint` enforces the shared TypeScript + React rules.
- Database and functions pipeline: `npx supabase db push`, `npx supabase functions deploy <name>`, and `npx supabase storage create` for new buckets.

## Coding Style & Naming Conventions
- Commit TypeScript with 2-space indentation, ES modules, and the `@/*` alias from `tsconfig.json` to avoid brittle relative paths.
- PascalCase for components/pages, `use` prefix for hooks, camelCase for utilities; colocate Tailwind class strings with the component.
- ESLint (see `eslint.config.js`) is the source of truth—fix warnings before pushing instead of disabling rules.

## Testing Guidelines
- No automated suite yet; run the manual paths in `TESTING_GUIDE.md`. Start the dev server, visit `/feature-tests`, and log results.
- Prioritize narrative exploration, profile uploads, community connections, and wellness library audio; call out Supabase edge cases in PR notes.
- After schema changes, run `supabase db push` and redeploy touched functions to confirm CLI output before opening a PR.

## Commit & Pull Request Guidelines
- Match the existing history: concise, imperative commit subjects ("Add quick-start guide", "Complete all features").
- PRs need a short summary, linked issue (if any), UI screenshots, Supabase migration/function notes, and manual test evidence.
- Scope PRs narrowly; separate frontend, Supabase, and deployment updates so reviewers can reason about risk.

## Supabase & Configuration Tips
- Keep `.env`, Supabase secrets, and documentation in sync; record new variables in `README_SUPABASE.md`.
- Use `npx supabase link` with personal refs only; never commit generated keys or service tokens.
- Update environment secrets with `supabase functions secrets set` right after adding or renaming env vars.
