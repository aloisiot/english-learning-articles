import { describe, expect, it } from "vitest";

import {
  DEFAULT_CLASS_MINUTES,
  DEFAULT_GRACE_MINUTES,
  classWindow,
  deriveRoomName,
  type ClassWindowInput,
  type DeriveRoomNameInput,
} from "../lib/room";

const SLUG = "2026-08-13-the-deal-that-ended-it";
const STARTS_AT = 1_800_000_000;

/** Epoch seconds for a UTC wall time, so the tests state instants plainly. */
function utc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number {
  return Date.UTC(year, month - 1, day, hour, minute, 0) / 1000;
}

function inZone(epochSeconds: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(epochSeconds * 1000);
}

describe("deriveRoomName", () => {
  it("is deterministic for the same class", () => {
    const first = deriveRoomName({ slug: SLUG, startsAt: STARTS_AT });
    const second = deriveRoomName({ slug: SLUG, startsAt: STARTS_AT });

    expect(first).toBe(second);
  });

  it("differs for the same article taught at a different time", () => {
    expect(deriveRoomName({ slug: SLUG, startsAt: STARTS_AT })).not.toBe(
      deriveRoomName({ slug: SLUG, startsAt: STARTS_AT + 1 }),
    );
  });

  it("differs for a different article at the same time", () => {
    expect(deriveRoomName({ slug: SLUG, startsAt: STARTS_AT })).not.toBe(
      deriveRoomName({ slug: "another-article", startsAt: STARTS_AT }),
    );
  });

  it("produces only characters Daily accepts in a room name", () => {
    const name = deriveRoomName({
      slug: "A Slug: With Punctuation! (2026)",
      startsAt: STARTS_AT,
    });

    expect(name).toMatch(/^[a-z0-9-]+$/);
  });

  it("keeps the name within the length cap", () => {
    const name = deriveRoomName({
      slug: "a-very-long-article-slug-that-goes-on-well-past-any-sensible-limit",
      startsAt: STARTS_AT,
    });

    expect(name.length).toBeLessThanOrEqual(40);
  });

  it("does not leave a dash where the slug was truncated", () => {
    // The 29-character prefix of this slug ends on the dash.
    const name = deriveRoomName({
      slug: `${"a".repeat(28)}-b`,
      startsAt: STARTS_AT,
    });

    expect(name).not.toContain("--");
    expect(name).toBe(`${"a".repeat(28)}-${name.split("-").at(-1)}`);
  });

  it("still yields a legal name when the slug reduces to nothing", () => {
    const name = deriveRoomName({ slug: "!!!", startsAt: STARTS_AT });

    expect(name).toMatch(/^class-[0-9a-f]{10}$/);
  });

  const badSlugs: Array<[string, DeriveRoomNameInput]> = [
    ["a missing slug", { startsAt: STARTS_AT }],
    ["a non-string slug", { slug: 7, startsAt: STARTS_AT }],
    ["an empty slug", { slug: "", startsAt: STARTS_AT }],
  ];

  it.each(badSlugs)("throws for %s", (_label, input) => {
    expect(() => deriveRoomName(input)).toThrow(TypeError);
  });

  const badStarts: Array<[string, DeriveRoomNameInput]> = [
    ["a missing startsAt", { slug: SLUG }],
    ["a non-numeric startsAt", { slug: SLUG, startsAt: "soon" }],
    ["an infinite startsAt", { slug: SLUG, startsAt: Infinity }],
  ];

  it.each(badStarts)("throws for %s", (_label, input) => {
    expect(() => deriveRoomName(input)).toThrow(TypeError);
  });
});

describe("classWindow", () => {
  it("adds the class length and the grace period", () => {
    expect(
      classWindow({
        startsAt: STARTS_AT,
        durationMinutes: 30,
        graceMinutes: 10,
      }),
    ).toEqual({
      startsAt: STARTS_AT,
      endsAt: STARTS_AT + 30 * 60,
      expiresAt: STARTS_AT + 40 * 60,
    });
  });

  it("defaults to a 30-minute class with the standard grace", () => {
    expect(classWindow({ startsAt: STARTS_AT })).toEqual({
      startsAt: STARTS_AT,
      endsAt: STARTS_AT + DEFAULT_CLASS_MINUTES * 60,
      expiresAt:
        STARTS_AT + (DEFAULT_CLASS_MINUTES + DEFAULT_GRACE_MINUTES) * 60,
    });
  });

  it("allows no grace at all", () => {
    const { endsAt, expiresAt } = classWindow({
      startsAt: STARTS_AT,
      graceMinutes: 0,
    });

    expect(expiresAt).toBe(endsAt);
  });

  // The two cases the plan calls out. Neither is a special case in the
  // code, and these tests exist to keep it that way: the moment anything
  // here reconstructs a local date, one of them starts failing.
  it("measures a class that crosses midnight as its real length", () => {
    const startsAt = utc(2026, 8, 13, 23, 50);

    const { endsAt } = classWindow({ startsAt, durationMinutes: 30 });

    expect(endsAt - startsAt).toBe(30 * 60);
    expect(endsAt).toBe(utc(2026, 8, 14, 0, 20));
  });

  it("measures a class that crosses a DST boundary as its real length", () => {
    // 2026-03-08 is the US spring-forward: 02:00 EST becomes 03:00 EDT.
    // The class starts at 01:45 local and runs 30 minutes, so the wall
    // clock says it ends at 03:15 — an hour and a half later by
    // appearance, half an hour later in fact.
    const startsAt = utc(2026, 3, 8, 6, 45);

    const { endsAt } = classWindow({ startsAt, durationMinutes: 30 });

    expect(endsAt - startsAt).toBe(30 * 60);
    expect(inZone(startsAt, "America/New_York")).toBe("01:45");
    expect(inZone(endsAt, "America/New_York")).toBe("03:15");
  });

  const badStarts: Array<[string, ClassWindowInput]> = [
    ["a missing startsAt", {}],
    ["a non-numeric startsAt", { startsAt: "soon" }],
  ];

  it.each(badStarts)("throws a TypeError for %s", (_label, input) => {
    expect(() => classWindow(input)).toThrow(TypeError);
  });

  const badMinutes: Array<[string, ClassWindowInput]> = [
    ["a zero-length class", { startsAt: STARTS_AT, durationMinutes: 0 }],
    ["a negative class", { startsAt: STARTS_AT, durationMinutes: -30 }],
    ["a non-numeric length", { startsAt: STARTS_AT, durationMinutes: "half" }],
    ["a negative grace", { startsAt: STARTS_AT, graceMinutes: -1 }],
    ["a non-numeric grace", { startsAt: STARTS_AT, graceMinutes: "a bit" }],
  ];

  it.each(badMinutes)("throws a RangeError for %s", (_label, input) => {
    expect(() => classWindow(input)).toThrow(RangeError);
  });
});
