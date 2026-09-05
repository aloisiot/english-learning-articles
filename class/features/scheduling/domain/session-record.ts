/**
 * What happened, decided once and never amended.
 *
 * 03 §4: this is the only thing in the system that cannot be
 * reconstructed after the day has passed. Everything else — who booked
 * what, which slots existed — can be read back off the rows that are
 * still there. Whether the student actually arrived cannot.
 */

export const OUTCOME = {
  COMPLETED: "completed",
  STUDENT_CANCELLED: "student_cancelled",
  STUDENT_NO_SHOW: "student_no_show",
  TUTOR_CANCELLED: "tutor_cancelled",
  TECHNICAL_FAILURE: "technical_failure",
} as const;

export type Outcome = (typeof OUTCOME)[keyof typeof OUTCOME];

/**
 * Long enough that a class happened, rather than someone opening the
 * page and closing it.
 *
 * Five minutes is a judgement, and it is written down here rather than
 * buried so that it can be argued with. It only separates "completed"
 * from "technical failure" for a class both people joined.
 */
export const MINIMUM_REAL_CLASS_MINUTES = 5;

export interface Attendance {
  studentArrived: boolean;
  tutorArrived: boolean;
  startedAt: Date | null;
  endedAt: Date | null;
}

/**
 * The outcome, from what the room saw.
 *
 * A cancellation is not decided here — it is known before the class, from
 * the booking, and is passed in rather than inferred. What this decides
 * is the set of endings that are only visible afterwards, which is
 * exactly the set that cannot be reconstructed later.
 */
export function outcomeFrom(attendance: Attendance): Outcome {
  const { studentArrived, tutorArrived, startedAt, endedAt } = attendance;

  if (!studentArrived) return OUTCOME.STUDENT_NO_SHOW;
  if (!tutorArrived) return OUTCOME.TECHNICAL_FAILURE;

  if (startedAt === null || endedAt === null) {
    return OUTCOME.TECHNICAL_FAILURE;
  }

  const minutes = (endedAt.getTime() - startedAt.getTime()) / 60_000;
  return minutes >= MINIMUM_REAL_CLASS_MINUTES
    ? OUTCOME.COMPLETED
    : OUTCOME.TECHNICAL_FAILURE;
}

/**
 * The outcome for a class nobody attended because it was called off.
 *
 * Kept distinct by *who* called it off, because 04 §6 defers cancellation
 * windows to whenever billing is discussed, and that question cannot be
 * answered from a record that only says "cancelled".
 */
export function cancellationOutcomeFor(
  cancelledBy: "student" | "tutor",
): Outcome {
  return cancelledBy === "student"
    ? OUTCOME.STUDENT_CANCELLED
    : OUTCOME.TUTOR_CANCELLED;
}

export interface SessionDraft {
  bookingId: string;
  tutorId: string;
  studentId: string;
  /** Copied, not referenced — see below. */
  tutorName: string;
  studentName: string;
  scheduledStart: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  outcome: Outcome;
}

/**
 * Assemble the row.
 *
 * The identities are **copied onto it** rather than reached through the
 * booking (03 §4). A session is a historical fact: it has to survive the
 * booking being deleted and the profile being anonymised, and a foreign
 * key alone does not survive either. The names are copied for the same
 * reason — "a class with student #4f2a" is not a record anybody can read
 * a year later.
 */
export function draftSession(input: {
  bookingId: string;
  tutorId: string;
  studentId: string;
  tutorName: string;
  studentName: string;
  scheduledStart: Date;
  attendance: Attendance;
}): SessionDraft {
  return {
    bookingId: input.bookingId,
    tutorId: input.tutorId,
    studentId: input.studentId,
    tutorName: input.tutorName,
    studentName: input.studentName,
    scheduledStart: input.scheduledStart,
    actualStart: input.attendance.startedAt,
    actualEnd: input.attendance.endedAt,
    outcome: outcomeFrom(input.attendance),
  };
}
