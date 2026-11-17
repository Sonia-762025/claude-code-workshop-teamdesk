// Every date the UI shows is UTC and built by slicing ISO strings, so the
// Worker and the browser render the same text. `toLocaleString()` would differ
// by locale and timezone and cause a hydration mismatch.

/** "2026-10-20T09:30:00.000Z" -> "2026-10-20 09:30 UTC" */
export function formatUtc(iso: string): string {
  return `${iso.slice(0, 16).replace("T", " ")} UTC`;
}

/** "2026-10-20T09:30:00.000Z" -> "09:30" */
export function formatUtcTime(iso: string): string {
  return iso.slice(11, 16);
}

/** "09:30 to 10:00 UTC", with the end day added when it differs. */
export function formatUtcRange(startIso: string, endIso: string): string {
  const sameDay = startIso.slice(0, 10) === endIso.slice(0, 10);
  const end = sameDay ? formatUtcTime(endIso) : formatUtc(endIso);
  return `${formatUtcTime(startIso)} to ${sameDay ? `${end} UTC` : end}`;
}

/** Today's date in UTC, YYYY-MM-DD. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

// The helpers below use the viewer's own timezone. Call them only in the
// browser after mount (an effect or an event handler), never while rendering on
// the Worker, or the server and client text would differ.

/** Local calendar date as YYYY-MM-DD. `toISOString()` would give the UTC date. */
export function todayLocal(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * The viewer's local day as UTC instants, [from, to): local midnight to the
 * next local midnight. Built from calendar parts, so a daylight saving day
 * comes out 23 or 25 hours long.
 */
export function localDayWindow(now: Date = new Date()): {
  from: string;
  to: string;
} {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** "2026-10-22T23:30:00.000Z" -> "10:30 am" in the viewer's timezone. */
export function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
  });
}

/** ("2026-10-20", "09:30") -> "2026-10-20T09:30:00.000Z" */
export function isoFromDayAndTime(day: string, time: string): string {
  return new Date(`${day}T${time}:00.000Z`).toISOString();
}
