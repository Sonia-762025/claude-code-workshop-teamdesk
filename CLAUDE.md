# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Teamdesk: Bun + Turborepo monorepo. TanStack Start on Cloudflare Workers with D1. Packages: `apps/web`, `packages/db` (`@repo/db`), `packages/services` (`@repo/services`).

## Commands (repo root, bun not npm)

- `bun run dev` seeds a local SQLite DB and serves http://localhost:3000. No Cloudflare account needed.
- `bun test` runs everything. One file: `bun test packages/services/src/bookings.test.ts`.
- `bun run check` runs lint and typecheck. Run it before saying work is done.
- Schema change: edit `packages/db/src/schema.ts`, then `bun run generate` inside `packages/db`.

## Rules, with the reason

**Layering: route, tRPC router, service, db function.**
- Put validation and business rules in the service, never in `@repo/db`.
  Why: tests and scripts call services directly, so rules in a router get skipped.
- Keep routers to one service call with the service's exported zod schema as `.input()`.
  Why: the service re-parses the same schema, so there is one source of truth.
- A new service needs a line in `apps/web/src/server/trpc/context.ts` and an `exports` entry in its package.json.
  Why: it is built per request there, and there are no barrel files, so nothing is picked up automatically.
- Throw `ServiceError` subclasses from `@repo/services/errors`, not `TRPCError`.
  Why: `init.ts` maps them to 404/400/409/403. Anything else becomes a 500.

**Browser code imports only `@repo/db/shared`.**
Why: every other entry imports drizzle and would bundle it into the client. Put UI-needed types and limits in `shared.ts`.

**No auth exists.** Mutations take `actorId` first and check it with `requireMember` / `requireAdmin`.
- Don't use `protectedProcedure` for team features. `ctx.userId` is always null, so it always returns 401.
- Don't read `ctx.env`. It is absent during SSR.

**Don't add `cors()` to `/api/trpc/*`.**
Why: JSON POSTs are CSRF-safe only because no preflight is ever answered (see `server.ts`).

**Migrations.**
- Commit `migrations/meta/` with the SQL.
  Why: drizzle diffs against the snapshot, and without it the next `generate` recreates every table.
- Apply migrations with wrangler (`db:apply`), not drizzle-kit.
  Why: `wrangler.jsonc` points `migrations_dir` at `packages/db/migrations`.

**Time.** UTC ISO strings only. Slots are `[startsAt, endsAt)`, so back-to-back bookings don't clash. Use the helpers in `packages/services/src/time.ts`.

**Query functions return plain JSON.**
Why: ids are strings in the API but numeric in the schema, and row types must not leak through tRPC (see `Number(memberId)` in `bookings.ts`).

**Tests** use `createTestDatabase()` (real migrations, in-memory `bun:sqlite`) and `fixtures.ts` in services.
- Don't mock the db.
- Never import `@repo/db/testing` from app code. The Worker has no `bun:sqlite`.

## Don't touch

- `apps/web/src/routeTree.gen.ts` is generated. Use `bun run generate-routes` in `apps/web`.
- `apps/web/src/components/ui/` and `hooks/use-mobile.ts` are vendored shadcn files that Biome skips.
  Why: `ultracite fix` once duplicated a JSX attribute in `combobox.tsx`. Don't format or hand-edit them.
- `components/bookings/` has PascalCase filenames from an old prototype. Don't copy that style. Use kebab-case for new files.
