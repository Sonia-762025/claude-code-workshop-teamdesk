# Spec: My day

Status: draft, not built. Target: about 20 minutes to build.

## Goal

One page that answers "what do I have on today?" for the chosen member: today's bookings and the tasks they need to do by today.

## Decisions (from the interview)

| Question | Decision |
| --- | --- |
| What is "today"? | The viewer's local day, from the browser's timezone. |
| Which tasks? | Assigned to the member, not done, due today or earlier (overdue included). |
| Interactive? | Read-only. No cancel, no complete. |
| Where? | New `/my-day` page, linked from the header. Whose day follows the existing member picker. |
| Finished bookings? | Still shown, dimmed, in time order. |

## Behaviour

- Route `/my-day`, header link "My day" placed before Bookings.
- Page has the same heading block and `MemberPicker` as the Tasks page.
- **Bookings** section: the member's active (not cancelled) bookings that overlap today's local day, earliest first. Each row shows time range (viewer's local time), title and room name. Rows whose end time has passed are dimmed. Each links to `/bookings`.
- **Tasks** section: title and due date. Overdue tasks get an "Overdue" badge and sort first, then tasks due today. Each links to `/tasks`.
- Empty states: "Nothing booked today." and "No tasks due." Both sections always render.
- Changing the member picker reloads both sections.

## Design notes

1. **Day data loads in the browser, not the route loader.** The SSR loader runs on the Worker, whose timezone is UTC, so it cannot know the viewer's day. The loader fetches `members` only (like `/tasks`). A client effect then fetches the day once an acting member exists, and re-fetches when the member changes. Show a skeleton while loading. Use `useAction` / `getTrpc()` the way the other pages do.
2. **The client sends the day, the server never guesses it.** Same pattern as `tasks.create`'s `today` argument.
   - `from` / `to`: ISO UTC strings for local midnight to the next local midnight. Compute with `new Date(y, m, d)` and `toISOString()`.
   - `today`: local `YYYY-MM-DD`, built from local date parts. Never `toISOString().slice(0, 10)`, which is the UTC date.
3. **No new tables or migrations.**

## Changes

**`@repo/db`**
- `bookings.ts`: `listMemberBookingsInRange(db, memberId, { from, to })`. Active bookings with `startsAt < to` and `endsAt > from`, ordered by `startsAt`. Same shape as `listRoomBookings`.

**`@repo/services`**
- `bookings.ts`: `listForMemberInRange(memberId, from, to)`. Parse both as ISO datetimes. Throw `ValidationError` if `to <= from` or the window is longer than 26 hours (a DST day is 23 or 25 hours).
- `tasks.ts`: `listDueBy(assigneeId, today)`. Uses the existing `listTasks(db, { assigneeId })`, then keeps tasks with `completedAt === null`, `dueOn !== null` and `dueOn <= today`. Sort by `dueOn`, then `id`.
- `today` is validated with `z.iso.date()`.

**`apps/web`**
- `routers/bookings.ts`: `forMemberDay` query, input `{ memberId, from, to }`.
- `routers/tasks.ts`: `dueBy` query, input `{ assigneeId, today }`.
- `routes/my-day.tsx`: the page. Room names come from `rooms.list`, fetched with the members in the loader.
- `components/my-day-bookings.tsx`, `components/my-day-tasks.tsx`: presentational lists (kebab-case, not the PascalCase of `components/bookings/`).
- `components/header.tsx`: add the link.
- No `context.ts` change, since no new service is created.
- Do not hand-edit `routeTree.gen.ts`. Run `bun run generate-routes` in `apps/web`.

## Tests (bun, in-memory db, existing fixtures)

- Bookings: a booking inside the window is included. Back-to-back at the window end (`startsAt == to`) is excluded. One that started yesterday and ends inside the window is included. Cancelled bookings and other members' bookings are excluded. Results are ordered by start.
- Bookings validation: `to <= from` and a 48-hour window both throw `ValidationError`.
- Tasks: overdue and due-today are included. Due tomorrow, no due date, completed, and other assignees' tasks are excluded. Overdue sorts before today.
- Timezone case: a booking at 23:30 UTC the previous day appears in a Sydney-day window (from `...T13:00:00Z` the previous day).

## Out of scope

- Cancelling, rescheduling or completing from this page.
- Tasks you created but did not get assigned, and tasks with no due date.
- Tasks completed today.
- Week view, date navigation, or showing other people's days.
- Real sign-in. "Me" stays the member picker.
- Showing today's announcements.

## Assumptions to confirm

- "My tasks" means assigned to me, not created by me. Tell me if you want both.
- Hiding the finished tasks is fine, so a task disappears once it is done.

## Done when

- `bun run check` and `bun test` pass.
- With the demo data, `/my-day` shows the picked member's bookings and due tasks, and the lists change when you switch member.
- Opened with the browser timezone set to Sydney, a booking at 9am Sydney time shows under that day.
