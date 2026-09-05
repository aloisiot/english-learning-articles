import { describe, expect, it } from "vitest";

import {
  DEFAULT_DURATION_MINUTES,
  SLOT,
  instantFromLocal,
  isKnownTimeZone,
  isOpenable,
  isTakeable,
  statusAfterRelease,
} from "../domain/slot";

describe("DEFAULT_DURATION_MINUTES", () => {
  it("is the 30-minute class the call app already runs", () => {
    expect(DEFAULT_DURATION_MINUTES).toBe(30);
  });
});

describe("instantFromLocal", () => {
  /*
    Golden values, derived from the offsets themselves rather than from
    this function. São Paulo is UTC-3 year round since 2019; Lisbon is
    UTC+1 in summer and UTC+0 in winter; Tokyo is UTC+9 and has no DST.
  */
  const cases: Array<[string, string, string, string]> = [
    ["São Paulo, UTC-3", "2026-09-15T19:00", "America/Sao_Paulo", "2026-09-15T22:00:00.000Z"],
    ["Lisbon in summer, UTC+1", "2026-07-01T09:30", "Europe/Lisbon", "2026-07-01T08:30:00.000Z"],
    ["Lisbon in winter, UTC+0", "2026-01-15T09:30", "Europe/Lisbon", "2026-01-15T09:30:00.000Z"],
    ["Tokyo, UTC+9", "2026-03-02T08:00", "Asia/Tokyo", "2026-03-01T23:00:00.000Z"],
    ["UTC itself", "2026-05-05T00:00", "UTC", "2026-05-05T00:00:00.000Z"],
    ["Kolkata's half-hour offset", "2026-05-05T12:15", "Asia/Kolkata", "2026-05-05T06:45:00.000Z"],
    ["Chatham's 12:45 offset", "2026-06-01T12:45", "Pacific/Chatham", "2026-06-01T00:00:00.000Z"],
  ];

  it.each(cases)("reads %s", (_label, local, zone, expected) => {
    expect(instantFromLocal(local, zone)?.toISOString()).toBe(expected);
  });

  /*
    The reason concrete slots were chosen at all (04 §1). The same wall
    time on either side of a DST change is a different instant, and the
    tutor means the wall time both times.
  */
  it("gives different instants either side of a DST change", () => {
    const summer = instantFromLocal("2026-07-01T19:00", "Europe/Lisbon");
    const winter = instantFromLocal("2026-12-01T19:00", "Europe/Lisbon");

    expect(summer?.toISOString()).toBe("2026-07-01T18:00:00.000Z");
    expect(winter?.toISOString()).toBe("2026-12-01T19:00:00.000Z");
  });

  it("accepts a space instead of the T", () => {
    expect(instantFromLocal("2026-09-15 19:00", "America/Sao_Paulo")).toEqual(
      instantFromLocal("2026-09-15T19:00", "America/Sao_Paulo"),
    );
  });

  it("tolerates surrounding whitespace", () => {
    expect(
      instantFromLocal("  2026-09-15T19:00  ", "UTC")?.toISOString(),
    ).toBe("2026-09-15T19:00:00.000Z");
  });

  const malformed = [
    "",
    "2026-09-15",
    "19:00",
    "15/09/2026 19:00",
    "2026-9-5T19:00",
    "2026-09-15T19:00:30",
    "not a time",
  ];

  it.each(malformed)("refuses %s rather than guessing", (input) => {
    expect(instantFromLocal(input, "UTC")).toBeNull();
  });

  /*
    Date.UTC rolls over instead of refusing, so without an explicit range
    check "2026-13-01" would quietly become January 2027 — a slot on a
    different day from the one the tutor typed, with no error anywhere.
  */
  const outOfRange: Array<[string, string]> = [
    ["a thirteenth month", "2026-13-01T10:00"],
    ["a zeroth month", "2026-00-01T10:00"],
    ["a forty-fifth day", "2026-09-45T10:00"],
    ["a zeroth day", "2026-09-00T10:00"],
    ["a twenty-fifth hour", "2026-09-15T25:00"],
    ["a sixtieth minute", "2026-09-15T10:60"],
  ];

  it.each(outOfRange)("refuses %s rather than rolling over", (_label, input) => {
    expect(instantFromLocal(input, "UTC")).toBeNull();
  });

  const impossibleDays: Array<[string, string]> = [
    ["31 April", "2026-04-31T10:00"],
    ["29 February in a common year", "2026-02-29T10:00"],
    ["31 November", "2026-11-31T10:00"],
  ];

  it.each(impossibleDays)("refuses %s", (_label, input) => {
    expect(instantFromLocal(input, "UTC")).toBeNull();
  });

  it("accepts 29 February in a leap year", () => {
    expect(instantFromLocal("2028-02-29T10:00", "UTC")?.toISOString()).toBe(
      "2028-02-29T10:00:00.000Z",
    );
  });

  it("refuses an unknown zone rather than silently using UTC", () => {
    // Silently using UTC would put the class at the wrong hour, which is
    // worse than not creating it.
    expect(instantFromLocal("2026-09-15T19:00", "Mars/Olympus")).toBeNull();
  });
});

describe("isKnownTimeZone", () => {
  it.each(["UTC", "Europe/Lisbon", "America/Sao_Paulo", "Asia/Tokyo"])(
    "knows %s",
    (zone) => {
      expect(isKnownTimeZone(zone)).toBe(true);
    },
  );

  it.each(["Mars/Olympus", "", "GMT+25", undefined, null, 7, {}])(
    "does not know %s",
    (zone) => {
      expect(isKnownTimeZone(zone)).toBe(false);
    },
  );
});

describe("isOpenable", () => {
  const now = new Date("2026-09-15T12:00:00Z");

  it("allows a time in the future", () => {
    expect(isOpenable(new Date("2026-09-15T12:01:00Z"), now)).toBe(true);
  });

  it("refuses a time in the past", () => {
    expect(isOpenable(new Date("2026-09-15T11:59:00Z"), now)).toBe(false);
  });

  it("refuses the present instant", () => {
    expect(isOpenable(new Date("2026-09-15T12:00:00Z"), now)).toBe(false);
  });
});

describe("isTakeable", () => {
  it("allows an open slot", () => {
    expect(isTakeable(SLOT.OPEN)).toBe(true);
  });

  /*
    04 §4: the first student to request a slot locks it. A held slot is
    somebody else's pending request, and this is half the no-double-
    booking guarantee — the partial unique index in 0004 is the other.
  */
  it.each([SLOT.HELD, SLOT.BOOKED, SLOT.CANCELLED])(
    "refuses a %s slot",
    (status) => {
      expect(isTakeable(status)).toBe(false);
    },
  );
});

describe("statusAfterRelease", () => {
  it.each([SLOT.HELD, SLOT.BOOKED, SLOT.OPEN])(
    "returns a %s slot to open",
    (status) => {
      expect(statusAfterRelease(status)).toBe(SLOT.OPEN);
    },
  );

  it("does not resurrect a slot the tutor withdrew", () => {
    expect(statusAfterRelease(SLOT.CANCELLED)).toBe(SLOT.CANCELLED);
  });
});
