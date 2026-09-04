/**
 * Opening time, and reading it back in somebody else's zone.
 *
 * 04 §1: concrete slots, no recurrence. **Every stored time is a UTC
 * instant.** A timezone is an input and a display concern and is never
 * stored as part of a time — which is what makes a DST change unable to
 * move a published hour.
 */

/** 30 minutes, matching the class the call app already runs. */
export const DEFAULT_DURATION_MINUTES = 30;

/** Slot statuses, as 03 §1 names them. */
export const SLOT = {
  OPEN: "open",
  HELD: "held",
  BOOKED: "booked",
  CANCELLED: "cancelled",
} as const;

export type SlotStatus = (typeof SLOT)[keyof typeof SLOT];

/**
 * Turn what a tutor typed into the instant it means.
 *
 * The input is a wall-clock date and time plus the zone the tutor is in.
 * The output is a UTC instant. This is the only place that conversion
 * happens on the way in, and it returns null rather than guessing,
 * because a slot at the wrong hour is worse than a slot that was not
 * created.
 *
 * The awkward part is that JavaScript has no "parse this wall time in
 * that zone" primitive. Formatting a guess back in the target zone and
 * correcting by the difference is the standard way round it, and it is
 * exact after one correction for every real zone offset.
 */
export function instantFromLocal(
  localDateTime: string,
  timeZone: string,
): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/.exec(
    localDateTime.trim(),
  );
  if (!match) return null;

  const [, y, mo, d, h, mi] = match.map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  // The shape matched; the numbers still have to mean something.
  //
  // Date.UTC rolls over rather than refusing — month 13 becomes January
  // of the next year, day 45 becomes the middle of the month after — so
  // without this a tutor typing a bad date would silently open a slot on
  // a different day rather than being told. Refusing is the whole
  // contract of this function.
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > 31) return null;
  if (h > 23 || mi > 59) return null;

  // Treat the wall time as though it were UTC, then measure how wrong
  // that is when read back in the target zone, and correct.
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);

  let guess = asUtc;
  for (let pass = 0; pass < 2; pass += 1) {
    const wallInZone = wallClockInZone(new Date(guess), timeZone);
    if (wallInZone === null) return null;
    const drift = wallInZone - asUtc;
    if (drift === 0) break;
    guess -= drift;
  }

  // A day that does not exist in its month — 31 April, 29 February in a
  // common year — passes the range checks above and rolls over here.
  // Reading the day back is what catches it.
  const result = new Date(guess);
  const wall = wallClockInZone(result, timeZone);
  if (wall === null || new Date(wall).getUTCDate() !== d) return null;

  return result;
}

/**
 * The wall-clock reading of an instant in a zone, expressed as though
 * that reading were itself UTC. Only useful for the arithmetic above.
 */
function wallClockInZone(instant: Date, timeZone: string): number | null {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(instant);
  } catch {
    // An unknown zone. Better to refuse than to silently use UTC.
    return null;
  }

  const at = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  // Intl renders midnight as 24 in some engines' hourCycle handling.
  const hour = at("hour") % 24;

  return Date.UTC(at("year"), at("month") - 1, at("day"), hour, at("minute"));
}

/** Is this a zone the runtime knows? */
export function isKnownTimeZone(timeZone: unknown): boolean {
  if (typeof timeZone !== "string" || timeZone === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * A slot in the past cannot be booked, so it should not be opened.
 *
 * Checked against an explicit `now` rather than reading the clock, so
 * the rule is testable without waiting.
 */
export function isOpenable(startsAt: Date, now: Date): boolean {
  return startsAt.getTime() > now.getTime();
}

/**
 * What a student may take.
 *
 * A held slot is excluded because a pending request locks it (04 §4),
 * and that is the whole of the "no double booking" guarantee at this
 * layer — the database's partial unique index is the other half.
 */
export function isTakeable(status: SlotStatus): boolean {
  return status === SLOT.OPEN;
}

/**
 * Declining returns the slot to open (step 13), and cancelling a
 * confirmed booking does too. A cancelled *slot* does not come back:
 * the tutor withdrew the time.
 */
export function statusAfterRelease(current: SlotStatus): SlotStatus {
  return current === SLOT.CANCELLED ? SLOT.CANCELLED : SLOT.OPEN;
}
