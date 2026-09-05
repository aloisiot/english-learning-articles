/**
 * May this person be in this class, now?
 *
 * 04 §5 is the reason this exists at all. With signed links, whoever held
 * the link was anonymous and attendance was unknowable. With a session
 * the join endpoint knows who is joining, which is what makes
 * `session.actual_start` — and "did the student ever arrive" — recordable
 * facts rather than guesses.
 *
 * The signed-link path is not replaced by this. It remains the only way
 * to run a class for someone without an account, which is this
 * platform's founding use case.
 */

/** How early someone may arrive. Early is normal; a class is a meeting. */
export const EARLY_JOIN_MINUTES = 10;

/**
 * How long after the scheduled end the room stays enterable.
 *
 * Matches the grace period the signed links already use, so a class
 * behaves the same whichever way its participants got in.
 */
export const LATE_JOIN_MINUTES = 10;

export const JOIN_REFUSAL = {
  /** Not a party to this booking at all. */
  NOT_YOURS: "not_yours",
  /** The booking exists but is not confirmed. */
  NOT_CONFIRMED: "not_confirmed",
  /** Right class, wrong time. */
  TOO_EARLY: "too_early",
  TOO_LATE: "too_late",
} as const;

export type JoinRefusal = (typeof JOIN_REFUSAL)[keyof typeof JOIN_REFUSAL];

export interface JoinCandidate {
  status: string;
  studentId: string;
  tutorId: string;
  startsAt: Date;
  durationMinutes: number;
}

export type JoinDecision =
  | { ok: true; role: "student" | "tutor" }
  | { ok: false; reason: JoinRefusal };

/**
 * The whole question, as one function, so that no route re-answers half
 * of it. The order matters: "not yours" is decided before anything about
 * time, so that someone probing booking ids learns nothing about when
 * other people's classes are.
 */
export function mayJoin(
  booking: JoinCandidate,
  viewerProfileId: string,
  now: Date,
): JoinDecision {
  const isStudent = booking.studentId === viewerProfileId;
  const isTutor = booking.tutorId === viewerProfileId;

  if (!isStudent && !isTutor) {
    return { ok: false, reason: JOIN_REFUSAL.NOT_YOURS };
  }

  if (booking.status !== "confirmed") {
    return { ok: false, reason: JOIN_REFUSAL.NOT_CONFIRMED };
  }

  const start = booking.startsAt.getTime();
  const opensAt = start - EARLY_JOIN_MINUTES * 60_000;
  const closesAt =
    start + (booking.durationMinutes + LATE_JOIN_MINUTES) * 60_000;
  const at = now.getTime();

  if (at < opensAt) return { ok: false, reason: JOIN_REFUSAL.TOO_EARLY };
  if (at > closesAt) return { ok: false, reason: JOIN_REFUSAL.TOO_LATE };

  return { ok: true, role: isStudent ? "student" : "tutor" };
}

/**
 * The booking a dashboard should offer a join button for.
 *
 * Deliberately the same window as mayJoin, so the button appears exactly
 * when pressing it would work. A button that appears early and then
 * refuses is worse than no button.
 */
export function isJoinable(booking: JoinCandidate, now: Date): boolean {
  const decision = mayJoin(booking, booking.studentId, now);
  return decision.ok;
}
