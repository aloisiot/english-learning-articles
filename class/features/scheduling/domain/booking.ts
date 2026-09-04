/**
 * A student's claim on a tutor's time.
 *
 * 03 §3 keeps slot and booking apart because their lifecycles differ: a
 * slot can be opened and withdrawn with nobody involved, and a booking
 * can be declined without the slot ceasing to exist. These are the rules
 * that connect the two.
 */
import { SLOT, type SlotStatus } from "./slot";

export const BOOKING = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  CANCELLED: "cancelled",
} as const;

export type BookingStatus = (typeof BOOKING)[keyof typeof BOOKING];

/**
 * What a request becomes, and what it does to the slot.
 *
 * The two are decided together because they are one rule: a booking that
 * needs vetting is pending *and* holds the slot, and one that does not is
 * confirmed *and* takes it. Splitting them across two call sites is how
 * they drift apart, and a slot left open under a confirmed booking is a
 * double booking waiting to happen.
 */
export function requestOutcome(requiresApproval: boolean): {
  booking: BookingStatus;
  slot: SlotStatus;
} {
  return requiresApproval
    ? { booking: BOOKING.PENDING, slot: SLOT.HELD }
    : { booking: BOOKING.CONFIRMED, slot: SLOT.BOOKED };
}

/**
 * 04 §4: the first student to request a slot locks it, and nobody else
 * may request it while the tutor decides. The dead-slot cost of that is
 * known and accepted — a request made on Thursday and unanswered until
 * Saturday makes the time invisible to everyone else in between.
 */
export function mayRequest(slotStatus: SlotStatus): boolean {
  return slotStatus === SLOT.OPEN;
}

/** Only the tutor whose slot it is decides. */
export function mayDecide(
  tutorIdOfSlot: string,
  viewerProfileId: string,
): boolean {
  return tutorIdOfSlot === viewerProfileId;
}

/** A decision is made once. Re-deciding a settled booking is a no-op. */
export function isDecidable(status: BookingStatus): boolean {
  return status === BOOKING.PENDING;
}

/**
 * What a decision does to both rows.
 *
 * Declining returns the slot to open (step 13), which is the free half
 * of 04 §4's two mitigations for the dead slot: the tutor releases the
 * hold by answering. The other half — expiring holds automatically —
 * needs a scheduled job and was deliberately not chosen; it should be
 * revisited the first time a slot is actually lost.
 */
export function decisionOutcome(confirmed: boolean): {
  booking: BookingStatus;
  slot: SlotStatus;
} {
  return confirmed
    ? { booking: BOOKING.CONFIRMED, slot: SLOT.BOOKED }
    : { booking: BOOKING.DECLINED, slot: SLOT.OPEN };
}

/**
 * Cancelling by the student also frees the time.
 *
 * Kept separate from declining even though the slot ends up the same,
 * because the booking's own status has to record who walked away. 04 §6
 * defers cancellation windows to whenever billing is discussed, and the
 * model supports that question only if the two are distinguishable.
 */
export function cancellationOutcome(): {
  booking: BookingStatus;
  slot: SlotStatus;
} {
  return { booking: BOOKING.CANCELLED, slot: SLOT.OPEN };
}

/** Either party may walk away from a booking that has not happened. */
export function mayCancel(
  status: BookingStatus,
  startsAt: Date,
  now: Date,
): boolean {
  if (status !== BOOKING.PENDING && status !== BOOKING.CONFIRMED) return false;
  return startsAt.getTime() > now.getTime();
}

/** A booking a tutor is still sitting on, which is what to surface. */
export function isAwaitingTutor(status: BookingStatus): boolean {
  return status === BOOKING.PENDING;
}
