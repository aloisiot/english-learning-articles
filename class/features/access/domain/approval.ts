/**
 * Who may be booked, and who may decide that.
 *
 * The two approvals in this system are unrelated and easily confused
 * (03 §2). This module is about the owner's one — whether a tutor is
 * visible to students at all. The tutor's own preference about vetting
 * bookings is a scheduling concern and lives with bookings.
 */
import type { ProfileId, Role } from "@/server/ports";

export interface TutorSettings {
  profileId: ProfileId;
  /** The TUTOR's preference: should bookings be vetted? */
  requiresBookingApproval: boolean;
  /** The OWNER's gate: when was this tutor approved, if ever? */
  approvedAt: Date | null;
  approvedBy: ProfileId | null;
}

/** Only the owner approves tutors. */
export function mayApproveTutors(roles: ReadonlySet<Role>): boolean {
  return roles.has("owner");
}

/**
 * Approval gates **visibility, not slot creation** (04 §2).
 *
 * This is the distinction that keeps onboarding usable: a tutor invited
 * from another platform can complete their profile and prepare a full
 * week of slots while approval is pending, and become bookable the
 * moment it lands. A gate in front of slot creation would mean they sat
 * looking at an empty screen instead.
 */
export function isBookable(settings: TutorSettings | null): boolean {
  return settings?.approvedAt != null;
}

/** An unapproved tutor may still do everything except be seen. */
export function maySetUpSlots(roles: ReadonlySet<Role>): boolean {
  return roles.has("tutor");
}

/**
 * A booking is pending, rather than immediately confirmed, when the
 * tutor asked for it to be (04 §3).
 *
 * Stated as its own function because the alternative is an inline
 * ternary at the one place a booking is created, and this is a rule
 * about the product rather than a detail of that route.
 */
export function bookingStartsPending(settings: TutorSettings): boolean {
  return settings.requiresBookingApproval;
}

/**
 * Approving is not idempotent in the way it looks.
 *
 * Re-approving an approved tutor would move `approved_at`, quietly
 * rewriting when they were let in — which is the one thing that
 * timestamp exists to answer. So the second approval is a no-op rather
 * than an overwrite.
 */
export function shouldRecordApproval(settings: TutorSettings | null): boolean {
  return settings != null && settings.approvedAt == null;
}
