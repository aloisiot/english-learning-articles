import { describe, expect, it } from "vitest";

import {
  MINIMUM_REAL_CLASS_MINUTES,
  OUTCOME,
  cancellationOutcomeFor,
  draftSession,
  outcomeFrom,
  type Attendance,
} from "../domain/session-record";

const START = new Date("2026-09-15T19:00:00Z");

const attendance = (over: Partial<Attendance> = {}): Attendance => ({
  studentArrived: true,
  tutorArrived: true,
  startedAt: START,
  endedAt: new Date("2026-09-15T19:30:00Z"),
  ...over,
});

describe("outcomeFrom", () => {
  it("is completed for a class both attended for its length", () => {
    expect(outcomeFrom(attendance())).toBe(OUTCOME.COMPLETED);
  });

  it("is a student no-show when the student never arrived", () => {
    expect(outcomeFrom(attendance({ studentArrived: false }))).toBe(
      OUTCOME.STUDENT_NO_SHOW,
    );
  });

  /*
    A student who turned up to nothing is not the student's failure, and
    the record should not read as though it were. There is a
    tutor_no_show in some designs; this system calls it a technical
    failure because from the student's side the two are the same event
    and the difference is not observable from the room.
  */
  it("is a technical failure when the tutor never arrived", () => {
    expect(outcomeFrom(attendance({ tutorArrived: false }))).toBe(
      OUTCOME.TECHNICAL_FAILURE,
    );
  });

  it("prefers the student's absence when neither arrived", () => {
    expect(
      outcomeFrom(attendance({ studentArrived: false, tutorArrived: false })),
    ).toBe(OUTCOME.STUDENT_NO_SHOW);
  });

  it.each([
    ["no start", { startedAt: null }],
    ["no end", { endedAt: null }],
    ["neither", { startedAt: null, endedAt: null }],
  ])("is a technical failure with %s", (_label, over) => {
    expect(outcomeFrom(attendance(over))).toBe(OUTCOME.TECHNICAL_FAILURE);
  });

  describe("the minimum that counts as a class", () => {
    it("is five minutes, stated so it can be argued with", () => {
      expect(MINIMUM_REAL_CLASS_MINUTES).toBe(5);
    });

    it("counts a class exactly that long", () => {
      expect(
        outcomeFrom(
          attendance({ endedAt: new Date("2026-09-15T19:05:00Z") }),
        ),
      ).toBe(OUTCOME.COMPLETED);
    });

    it("does not count one a second shorter", () => {
      expect(
        outcomeFrom(
          attendance({ endedAt: new Date("2026-09-15T19:04:59Z") }),
        ),
      ).toBe(OUTCOME.TECHNICAL_FAILURE);
    });
  });
});

describe("cancellationOutcomeFor", () => {
  it.each([
    ["student", OUTCOME.STUDENT_CANCELLED],
    ["tutor", OUTCOME.TUTOR_CANCELLED],
  ] as const)("records that the %s called it off", (who, expected) => {
    expect(cancellationOutcomeFor(who)).toBe(expected);
  });

  /*
    04 §6 defers cancellation windows to whenever billing is discussed,
    and that question cannot be answered from a record that only says
    "cancelled".
  */
  it("keeps the two distinguishable", () => {
    expect(cancellationOutcomeFor("student")).not.toBe(
      cancellationOutcomeFor("tutor"),
    );
  });
});

describe("draftSession", () => {
  const input = {
    bookingId: "booking-1",
    tutorId: "tutor-1",
    studentId: "student-1",
    tutorName: "Marta",
    studentName: "Aloísio",
    scheduledStart: START,
    attendance: attendance(),
  };

  it("carries the scheduled time and the real one separately", () => {
    const draft = draftSession(input);

    expect(draft.scheduledStart).toBe(START);
    expect(draft.actualStart).toEqual(START);
    expect(draft.actualEnd).toEqual(new Date("2026-09-15T19:30:00Z"));
  });

  /*
    03 §4: the identities are copied onto the row rather than reached
    through the booking, because a session is a historical fact and has
    to survive the booking being deleted or a profile anonymised. A name
    is copied for the same reason — "a class with student #4f2a" is not a
    record anybody can read a year later.
  */
  it("copies both names onto the record", () => {
    const draft = draftSession(input);

    expect(draft.tutorName).toBe("Marta");
    expect(draft.studentName).toBe("Aloísio");
  });

  it("keeps the ids as well as the names", () => {
    const draft = draftSession(input);

    expect(draft.tutorId).toBe("tutor-1");
    expect(draft.studentId).toBe("student-1");
  });

  it("takes its outcome from what the room saw", () => {
    expect(
      draftSession({ ...input, attendance: attendance({ studentArrived: false }) })
        .outcome,
    ).toBe(OUTCOME.STUDENT_NO_SHOW);
  });

  it("records a start of null when the class never began", () => {
    const draft = draftSession({
      ...input,
      attendance: attendance({ startedAt: null, endedAt: null }),
    });

    expect(draft.actualStart).toBeNull();
    expect(draft.actualEnd).toBeNull();
    expect(draft.outcome).toBe(OUTCOME.TECHNICAL_FAILURE);
  });
});
