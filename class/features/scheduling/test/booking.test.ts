import { describe, expect, it } from "vitest";

import {
  BOOKING,
  cancellationOutcome,
  decisionOutcome,
  isAwaitingTutor,
  isDecidable,
  mayCancel,
  mayDecide,
  mayRequest,
  requestOutcome,
} from "../domain/booking";
import { SLOT } from "../domain/slot";

describe("requestOutcome", () => {
  /*
    The booking's status and the slot's are decided together because they
    are one rule. A confirmed booking over a slot left open is a double
    booking waiting to happen, and that is what splitting this across two
    call sites eventually produces.
  */
  it("holds the slot when the tutor vets bookings", () => {
    expect(requestOutcome(true)).toEqual({
      booking: BOOKING.PENDING,
      slot: SLOT.HELD,
    });
  });

  it("takes the slot outright when they do not", () => {
    expect(requestOutcome(false)).toEqual({
      booking: BOOKING.CONFIRMED,
      slot: SLOT.BOOKED,
    });
  });

  it("never leaves a slot open behind a live booking", () => {
    for (const requiresApproval of [true, false]) {
      expect(requestOutcome(requiresApproval).slot).not.toBe(SLOT.OPEN);
    }
  });
});

describe("mayRequest", () => {
  it("allows an open slot", () => {
    expect(mayRequest(SLOT.OPEN)).toBe(true);
  });

  it("refuses one another student is already holding", () => {
    expect(mayRequest(SLOT.HELD)).toBe(false);
  });

  it.each([SLOT.BOOKED, SLOT.CANCELLED])("refuses a %s slot", (status) => {
    expect(mayRequest(status)).toBe(false);
  });
});

describe("mayDecide", () => {
  it("allows the tutor whose slot it is", () => {
    expect(mayDecide("tutor-1", "tutor-1")).toBe(true);
  });

  it("refuses another tutor", () => {
    expect(mayDecide("tutor-1", "tutor-2")).toBe(false);
  });

  it("refuses the student who asked", () => {
    expect(mayDecide("tutor-1", "student-1")).toBe(false);
  });
});

describe("isDecidable", () => {
  it("allows a pending booking", () => {
    expect(isDecidable(BOOKING.PENDING)).toBe(true);
  });

  it.each([BOOKING.CONFIRMED, BOOKING.DECLINED, BOOKING.CANCELLED])(
    "refuses a booking already %s",
    (status) => {
      expect(isDecidable(status)).toBe(false);
    },
  );
});

describe("decisionOutcome", () => {
  it("confirms the booking and takes the slot", () => {
    expect(decisionOutcome(true)).toEqual({
      booking: BOOKING.CONFIRMED,
      slot: SLOT.BOOKED,
    });
  });

  /*
    Step 13, and the free half of 04 §4's two mitigations for the dead
    slot: the tutor releases the hold by answering.
  */
  it("declines the booking and returns the slot to open", () => {
    expect(decisionOutcome(false)).toEqual({
      booking: BOOKING.DECLINED,
      slot: SLOT.OPEN,
    });
  });
});

describe("cancellationOutcome", () => {
  it("frees the slot", () => {
    expect(cancellationOutcome().slot).toBe(SLOT.OPEN);
  });

  /*
    The slot ends up the same as a decline, but the booking must not:
    04 §6 defers cancellation windows to whenever billing is discussed,
    and that question is only answerable if who walked away is recorded.
  */
  it("records that the student walked away, not the tutor", () => {
    expect(cancellationOutcome().booking).toBe(BOOKING.CANCELLED);
    expect(cancellationOutcome().booking).not.toBe(decisionOutcome(false).booking);
  });
});

describe("mayCancel", () => {
  const now = new Date("2026-09-15T12:00:00Z");
  const later = new Date("2026-09-15T18:00:00Z");
  const earlier = new Date("2026-09-15T09:00:00Z");

  it.each([BOOKING.PENDING, BOOKING.CONFIRMED])(
    "allows cancelling a %s booking before it starts",
    (status) => {
      expect(mayCancel(status, later, now)).toBe(true);
    },
  );

  it("refuses once the class has started", () => {
    expect(mayCancel(BOOKING.CONFIRMED, earlier, now)).toBe(false);
  });

  it("refuses at the exact start", () => {
    expect(mayCancel(BOOKING.CONFIRMED, now, now)).toBe(false);
  });

  it.each([BOOKING.DECLINED, BOOKING.CANCELLED])(
    "refuses a booking already %s",
    (status) => {
      expect(mayCancel(status, later, now)).toBe(false);
    },
  );
});

describe("isAwaitingTutor", () => {
  it("is what the tutor's queue is built from", () => {
    expect(isAwaitingTutor(BOOKING.PENDING)).toBe(true);
  });

  it.each([BOOKING.CONFIRMED, BOOKING.DECLINED, BOOKING.CANCELLED])(
    "leaves a %s booking out of it",
    (status) => {
      expect(isAwaitingTutor(status)).toBe(false);
    },
  );
});
