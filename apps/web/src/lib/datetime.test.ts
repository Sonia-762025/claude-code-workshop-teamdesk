import { describe, expect, test } from "bun:test";
import {
  formatUtc,
  formatUtcRange,
  formatUtcTime,
  isoFromDayAndTime,
  localDayWindow,
  todayLocal,
  todayUtc,
} from "./datetime.ts";

describe("datetime", () => {
  test("formatUtc shows date and minutes", () => {
    expect(formatUtc("2026-10-20T09:30:45.000Z")).toBe("2026-10-20 09:30 UTC");
  });

  test("formatUtcTime shows HH:MM", () => {
    expect(formatUtcTime("2026-10-20T23:05:00.000Z")).toBe("23:05");
  });

  test("formatUtcRange on one day", () => {
    expect(
      formatUtcRange("2026-10-20T09:30:00.000Z", "2026-10-20T10:00:00.000Z")
    ).toBe("09:30 to 10:00 UTC");
  });

  test("formatUtcRange across midnight names the end day", () => {
    expect(
      formatUtcRange("2026-10-20T23:30:00.000Z", "2026-10-21T00:30:00.000Z")
    ).toBe("23:30 to 2026-10-21 00:30 UTC");
  });

  test("todayUtc uses the UTC date", () => {
    expect(todayUtc(new Date("2026-10-20T23:59:00.000Z"))).toBe("2026-10-20");
  });

  test("isoFromDayAndTime builds a UTC ISO string", () => {
    expect(isoFromDayAndTime("2026-10-20", "09:30")).toBe(
      "2026-10-20T09:30:00.000Z"
    );
  });

  test("isoFromDayAndTime rejects a bad time", () => {
    expect(() => isoFromDayAndTime("2026-10-20", "25:00")).toThrow();
  });
});

describe("local day helpers", () => {
  // Built from local parts, so these hold in any timezone the tests run in.
  const lateEvening = new Date(2026, 9, 23, 23, 45);

  test("todayLocal uses the local date, not the UTC one", () => {
    expect(todayLocal(lateEvening)).toBe("2026-10-23");
  });

  test("localDayWindow runs from local midnight to the next", () => {
    expect(localDayWindow(lateEvening)).toEqual({
      from: new Date(2026, 9, 23).toISOString(),
      to: new Date(2026, 9, 24).toISOString(),
    });
  });

  test("localDayWindow contains the moment it was built from", () => {
    const { from, to } = localDayWindow(lateEvening);
    expect(Date.parse(from)).toBeLessThanOrEqual(lateEvening.getTime());
    expect(Date.parse(to)).toBeGreaterThan(lateEvening.getTime());
  });
});
