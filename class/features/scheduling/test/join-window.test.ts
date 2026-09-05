import { describe, expect, it } from "vitest";

import {
  EARLY_JOIN_MINUTES,
  JOIN_REFUSAL,
  LATE_JOIN_MINUTES,
  isJoinable,
  mayJoin,
  type JoinCandidate,
} from "../domain/join-window";

const STARTS_AT = new Date("2026-09-15T19:00:00Z");

const booking = (over: Partial<JoinCandidate> = {}): JoinCandidate => ({
  status: "confirmed",
  studentId: "student-1",
  tutorId: "tutor-1",
  startsAt: STARTS_AT,
  durationMinutes: 30,
  ...over,
});

const at = (iso: string) => new Date(iso);

describe("mayJoin", () => {
  it("lets the student in at the scheduled time", () => {
    expect(mayJoin(booking(), "student-1", STARTS_AT)).toEqual({
      ok: true,
      role: "student",
    });
  });

  it("lets the tutor in, and says which they are", () => {
    expect(mayJoin(booking(), "tutor-1", STARTS_AT)).toEqual({
      ok: true,
      role: "tutor",
    });
  });

  it("refuses a stranger", () => {
    expect(mayJoin(booking(), "someone-else", STARTS_AT)).toEqual({
      ok: false,
      reason: JOIN_REFUSAL.NOT_YOURS,
    });
  });

  /*
    Order matters. Someone probing booking ids must not learn when other
    people's classes are, so "not yours" is decided before any question
    about time.
  */
  it("says not-yours rather than too-early to a stranger", () => {
    const early = at("2026-09-14T00:00:00Z");
    expect(mayJoin(booking(), "someone-else", early)).toEqual({
      ok: false,
      reason: JOIN_REFUSAL.NOT_YOURS,
    });
  });

  it.each(["pending", "declined", "cancelled"])(
    "refuses a %s booking",
    (status) => {
      expect(mayJoin(booking({ status }), "student-1", STARTS_AT)).toEqual({
        ok: false,
        reason: JOIN_REFUSAL.NOT_CONFIRMED,
      });
    },
  );

  describe("the window", () => {
    it("opens exactly ten minutes early", () => {
      expect(EARLY_JOIN_MINUTES).toBe(10);
      expect(mayJoin(booking(), "student-1", at("2026-09-15T18:50:00Z")).ok).toBe(
        true,
      );
    });

    it("is shut a moment before that", () => {
      expect(mayJoin(booking(), "student-1", at("2026-09-15T18:49:59Z"))).toEqual(
        { ok: false, reason: JOIN_REFUSAL.TOO_EARLY },
      );
    });

    it("stays open to the end of the class plus the grace period", () => {
      // 19:00 + 30 minutes + 10 minutes grace.
      expect(LATE_JOIN_MINUTES).toBe(10);
      expect(mayJoin(booking(), "student-1", at("2026-09-15T19:40:00Z")).ok).toBe(
        true,
      );
    });

    it("is shut a moment after", () => {
      expect(mayJoin(booking(), "student-1", at("2026-09-15T19:40:01Z"))).toEqual(
        { ok: false, reason: JOIN_REFUSAL.TOO_LATE },
      );
    });

    it("follows a longer class", () => {
      const long = booking({ durationMinutes: 60 });
      expect(mayJoin(long, "student-1", at("2026-09-15T20:10:00Z")).ok).toBe(true);
      expect(mayJoin(long, "student-1", at("2026-09-15T20:10:01Z")).ok).toBe(false);
    });

    it("refuses the day before", () => {
      expect(
        mayJoin(booking(), "student-1", at("2026-09-14T19:00:00Z")).ok,
      ).toBe(false);
    });
  });
});

describe("isJoinable", () => {
  /*
    The same window as mayJoin, on purpose: a button that appears before
    pressing it would work is worse than no button.
  */
  it("is true exactly when a join would succeed", () => {
    const moments = [
      "2026-09-15T18:49:59Z",
      "2026-09-15T18:50:00Z",
      "2026-09-15T19:00:00Z",
      "2026-09-15T19:40:00Z",
      "2026-09-15T19:40:01Z",
    ];

    for (const moment of moments) {
      expect(isJoinable(booking(), at(moment))).toBe(
        mayJoin(booking(), "student-1", at(moment)).ok,
      );
    }
  });

  it("is false for a booking that was never confirmed", () => {
    expect(isJoinable(booking({ status: "pending" }), STARTS_AT)).toBe(false);
  });
});
