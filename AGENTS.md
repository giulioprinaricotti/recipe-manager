# recipe-manager (dueforchette) — agent index

Read this index, then only the part the task touches (see `.claude/rules/docs.md`).

## What it is
Weekly meal planner for couples: recipes (own or imported from a URL), a weekly
menu, and the week's shopping list exported to Bring!. Invite links let a user
bring someone in with a starter recipe.

## Stack
Next.js App Router + TypeScript, shadcn/ui + Radix + Tailwind, react-hook-form + zod,
Prisma 7 on Supabase Postgres (`@prisma/adapter-pg`), next-auth credentials (JWT), vitest.

## Commands
- `npm run dev` · `npm run build` · `npm run lint` · `npx tsc --noEmit` · `npm test`

## Database / Prisma
- **Do NOT run `npx prisma migrate dev`**: The Supabase connection uses a pooler that causes migrations to hang indefinitely. Instead, generate the SQL (or write it manually) and run it directly on the Supabase SQL Editor. Then run `npx prisma generate` locally to update the client.
- **`npx prisma generate` is safe**: It only regenerates the local client and does not connect to the database.

## Where the rest lives
| Topic | File |
|---|---|
| Conduct, planning, decision process | `docs/conduct.md` |
| File organization | `docs/file-organization.md` |
| Code quality, lint/build gates | `docs/code-quality.md` |
| Documentation maintenance, templates | `docs/documentation.md` |

## Domain rules (code is the source of truth, no feature docs yet)
- Weekly menu: `src/lib/weeks.ts`, `src/app/(dashboard)/meal-plans/`, model `MealPlan`/`MealPlanItem`
- Shopping list: `src/lib/ingredient-{parser,aggregator,translator,utils}.ts` (+ tests)
- Bring! export: `src/lib/bring.ts`, `src/app/api/meal-plans/[weekId]/schema/route.ts`
- Invites and signup: `src/lib/public-invite.ts`, `src/app/api/invitations/`, `src/app/(auth)/{invite,join,signup}/`
- Recipe visibility: `src/lib/recipe-access.ts`, `src/lib/recipe-clone.ts`
- Owner notes (outside the repo): `../.brain/recipe-manager/gotchas.md`, `decisions.md`
