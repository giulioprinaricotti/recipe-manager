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
- `bash scripts/qa-state.sh [--to db|user|menu|server|list] [--stop]` — local QA state (README)

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

## Working in sessions
- **One chat per task.** The brief is the Linear issue (team Fenpack, initiative
  `dueforchette`): read it first with the Linear connector, both the "Per Giulio" and
  "Per l'agente" sections, and check its blockers are done. With no issue, the brief is
  the task as written at the start of the chat. A new task means a new chat, not a longer one.
- **Linear stays short.** When the task is done, set the issue to Done and leave one short
  comment: what the person can now do, plus 2-4 technical decisions. Full sentences, no
  file lists; the detail lives in the commit.
- **Docs by index, then by part.** Read this file, then only the `docs/` part the task
  touches. Never read a whole file above 200 lines: `grep -n`, then `sed -n` around the hit.
- **One test run, filtered.** Run the tests once and filter the output with `grep`
  (failures and the summary line). Do not run them again and again.
- **QA by page text.** Reach the state with `bash scripts/qa-state.sh`, check pages by
  reading their text; take a screenshot only for the final proof.
- **Close with the commit.** The commit message is the handoff document: what changed,
  why, how to verify it, which files. Then append one line to the parent folder's
  `../.brain/episodic.jsonl` (argument `"life"`, schema in `../CLAUDE.md`).
- **Model.** Sonnet for tasks already designed and checkable by tests. Opus when the task
  needs judgment: text people will read, product decisions not yet written down, a bug
  with several possible causes, code about security or ownership. In doubt, Sonnet; if it
  goes in circles for 2-3 turns, reopen the task with Opus.
