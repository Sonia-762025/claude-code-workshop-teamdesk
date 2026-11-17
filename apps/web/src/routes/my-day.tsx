import type { Booking, Task } from "@repo/db/shared";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import FormError from "#/components/form-error";
import MemberPicker from "#/components/member-picker";
import MyDayBookings from "#/components/my-day-bookings";
import MyDayTasks from "#/components/my-day-tasks";
import PageError from "#/components/page-error";
import { Skeleton } from "#/components/ui/skeleton";
import { useActingMember } from "#/hooks/use-acting-member";
import { getTrpc } from "#/integrations/trpc/client";
import { localDayWindow, todayLocal } from "#/lib/datetime";

interface DayData {
  bookings: Booking[];
  now: number;
  tasks: Task[];
  today: string;
}

// The loader runs on the Worker, whose clock is UTC, so it cannot know the
// viewer's day. It loads the lookups only; the day itself is fetched in the
// browser below.
export const Route = createFileRoute("/my-day")({
  loader: async () => {
    const trpc = getTrpc();
    const [members, rooms] = await Promise.all([
      trpc.members.list.query(),
      trpc.rooms.list.query(),
    ]);
    return { members, rooms };
  },
  component: MyDayPage,
  errorComponent: PageError,
});

function MyDayPage() {
  const { members, rooms } = Route.useLoaderData();
  const { actingMember, setActingMemberId } = useActingMember(members);
  const actorId = actingMember?.id ?? "";
  const [data, setData] = useState<DayData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roomNames = useMemo(
    () => new Map(rooms.map((room) => [room.id, room.name])),
    [rooms]
  );

  useEffect(() => {
    if (!actorId) {
      return;
    }
    // Ignore an answer for a member that is no longer picked.
    let stale = false;
    setData(null);
    setError(null);

    const now = new Date();
    const { from, to } = localDayWindow(now);
    const today = todayLocal(now);
    const trpc = getTrpc();
    Promise.all([
      trpc.bookings.forMemberDay.query({ from, memberId: actorId, to }),
      trpc.tasks.dueBy.query({ assigneeId: actorId, today }),
    ])
      .then(([bookings, tasks]) => {
        if (!stale) {
          setData({ bookings, now: now.getTime(), tasks, today });
        }
      })
      .catch((err: unknown) => {
        if (!stale) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      });
    return () => {
      stale = true;
    };
  }, [actorId]);

  return (
    <main className="page-wrap px-4 py-12">
      <section className="flex max-w-3xl flex-col gap-4">
        <p className="island-kicker m-0">Teamdesk</p>
        <h1 className="display-title m-0 text-4xl text-foreground sm:text-5xl">
          My day
        </h1>
        <p className="m-0 text-base text-muted-foreground leading-8">
          Today's bookings and the tasks you need to finish by today.
        </p>
        <MemberPicker
          members={members}
          onChange={setActingMemberId}
          value={actingMember?.id}
        />
      </section>

      <FormError message={error} />

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-2xl text-foreground">Bookings</h2>
        {data ? (
          <MyDayBookings
            bookings={data.bookings}
            now={data.now}
            roomNames={roomNames}
          />
        ) : (
          <Skeleton className="h-16 w-full max-w-xl" />
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-2xl text-foreground">Tasks</h2>
        {data ? (
          <MyDayTasks tasks={data.tasks} today={data.today} />
        ) : (
          <Skeleton className="h-16 w-full max-w-xl" />
        )}
      </section>
    </main>
  );
}
