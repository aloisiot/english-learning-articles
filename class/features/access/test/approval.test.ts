import { describe, expect, it } from "vitest";

import {
  bookingStartsPending,
  isBookable,
  mayApproveTutors,
  maySetUpSlots,
  shouldRecordApproval,
  type TutorSettings,
} from "../domain/approval";
import type { Role } from "@/server/ports";

const roles = (...held: Role[]) => new Set<Role>(held);

const settings = (over: Partial<TutorSettings> = {}): TutorSettings => ({
  profileId: "tutor-1",
  requiresBookingApproval: true,
  approvedAt: null,
  approvedBy: null,
  ...over,
});

const APPROVED = new Date("2026-09-01T10:00:00Z");

describe("mayApproveTutors", () => {
  it("allows the owner", () => {
    expect(mayApproveTutors(roles("owner"))).toBe(true);
  });

  it.each<[string, Role[]]>([
    ["a tutor", ["tutor"]],
    ["a student", ["student"]],
    ["a tutor who is also a student", ["tutor", "student"]],
    ["nobody", []],
  ])("refuses %s", (_label, held) => {
    expect(mayApproveTutors(roles(...held))).toBe(false);
  });

  it("allows the owner who is also a student", () => {
    // The author holds both from day one (01 §1).
    expect(mayApproveTutors(roles("owner", "student"))).toBe(true);
  });
});

describe("isBookable", () => {
  it("is false before the owner approves", () => {
    expect(isBookable(settings())).toBe(false);
  });

  it("is true once approved", () => {
    expect(
      isBookable(settings({ approvedAt: APPROVED, approvedBy: "owner-1" })),
    ).toBe(true);
  });

  it("is false for a profile with no tutor settings at all", () => {
    expect(isBookable(null)).toBe(false);
  });

  /*
    The two flags are independent, and 03 §2 says so because confusing
    them either exposes an unvetted stranger or silently blocks a vetted
    tutor. These two assertions are that independence.
  */
  it("does not read the tutor's own vetting preference as approval", () => {
    expect(isBookable(settings({ requiresBookingApproval: false }))).toBe(
      false,
    );
  });

  it("stays bookable whatever the tutor's vetting preference is", () => {
    for (const requiresBookingApproval of [true, false]) {
      expect(
        isBookable(
          settings({
            requiresBookingApproval,
            approvedAt: APPROVED,
            approvedBy: "owner-1",
          }),
        ),
      ).toBe(true);
    }
  });
});

describe("maySetUpSlots", () => {
  /*
    04 §2: approval gates visibility, not slot creation. A tutor invited
    from another platform sets themselves up completely while approval is
    pending, and becomes bookable the moment it lands.
  */
  it("lets an unapproved tutor prepare slots", () => {
    expect(maySetUpSlots(roles("tutor"))).toBe(true);
  });

  it("is not the same question as being bookable", () => {
    const unapproved = settings();
    expect(maySetUpSlots(roles("tutor"))).toBe(true);
    expect(isBookable(unapproved)).toBe(false);
  });

  it.each<[string, Role[]]>([
    ["a student", ["student"]],
    ["the owner alone", ["owner"]],
    ["nobody", []],
  ])("refuses %s", (_label, held) => {
    expect(maySetUpSlots(roles(...held))).toBe(false);
  });
});

describe("bookingStartsPending", () => {
  it("is pending when the tutor asked to vet bookings", () => {
    expect(bookingStartsPending(settings({ requiresBookingApproval: true }))).toBe(
      true,
    );
  });

  it("is not when they did not", () => {
    expect(
      bookingStartsPending(settings({ requiresBookingApproval: false })),
    ).toBe(false);
  });

  it("does not consult the owner's approval", () => {
    // A different question entirely: whether the tutor is bookable is
    // decided before a booking is attempted at all.
    expect(
      bookingStartsPending(
        settings({
          requiresBookingApproval: false,
          approvedAt: APPROVED,
          approvedBy: "owner-1",
        }),
      ),
    ).toBe(false);
  });
});

describe("shouldRecordApproval", () => {
  it("records the first approval", () => {
    expect(shouldRecordApproval(settings())).toBe(true);
  });

  /*
    Re-approving would move approved_at, rewriting when the tutor was let
    in — the one question that timestamp exists to answer.
  */
  it("does not move the timestamp on a second approval", () => {
    expect(
      shouldRecordApproval(
        settings({ approvedAt: APPROVED, approvedBy: "owner-1" }),
      ),
    ).toBe(false);
  });

  it("refuses a profile that is not a tutor at all", () => {
    expect(shouldRecordApproval(null)).toBe(false);
  });
});
