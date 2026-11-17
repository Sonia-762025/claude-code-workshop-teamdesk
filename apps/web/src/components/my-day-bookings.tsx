import type { Booking } from "@repo/db/shared";
import { Link } from "@tanstack/react-router";
import { formatLocalTime } from "#/lib/datetime";

interface MyDayBookingsProps {
  bookings: readonly Booking[];
  /** Epoch milliseconds. Bookings that ended before it are dimmed. */
  now: number;
  roomNames: ReadonlyMap<string, string>;
}

export default function MyDayBookings({
  bookings,
  now,
  roomNames,
}: MyDayBookingsProps) {
  if (bookings.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Nothing booked today.</p>
    );
  }
  return (
    <ul className="m-0 list-none space-y-4 p-0">
      {bookings.map((booking) => {
        const finished = Date.parse(booking.endsAt) <= now;
        return (
          <li
            className={`border-border border-t pt-4 ${finished ? "opacity-50" : ""}`}
            key={booking.id}
          >
            <Link className="block no-underline" to="/bookings">
              <p className="m-0 text-foreground">{booking.title}</p>
              <p className="m-0 text-muted-foreground text-xs">
                {formatLocalTime(booking.startsAt)} to{" "}
                {formatLocalTime(booking.endsAt)},{" "}
                {roomNames.get(booking.roomId) ?? "archived room"}
                {finished ? ", finished" : ""}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
