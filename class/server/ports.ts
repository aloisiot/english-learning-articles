/**
 * What the domain needs, said in the domain's own words.
 *
 * These are ports, in the sense 02 §6 settles: interfaces **shaped by
 * what this application needs**, with the vendor on the far side. The
 * distinction that decides whether this holds or leaks is not
 * abstraction-versus-none, it is which direction the shape comes from.
 *
 * So: `findConfirmedBookingFor(studentId, at)` — never
 * `from("bookings").select()`, and never a `DatabaseClient` or an
 * `AuthProvider` invented by guessing what some future vendor might also
 * offer. An interface shaped by vendors ends up as the union of their
 * features and fits none of them. **A method that exists because
 * Supabase offers it is in the wrong place.**
 *
 * This is the third and fourth instance of a pattern already in the
 * codebase, which is the best evidence it will hold:
 * features/call/domain/daily-request.ts decides and
 * features/call/adapters/daily.ts fetches; server/config.ts is the only
 * reader of the environment.
 *
 * Two rules keep it honest, and both are enforced rather than trusted:
 *
 * - `@supabase/supabase-js` may be imported only inside a
 *   `features/*​/adapters/` directory. `scripts/check-adapter-boundary.mjs`
 *   fails the build otherwise.
 * - **Authorisation is decided in server code, not by RLS.** RLS is the
 *   second line (02 §3c). Getting that backwards would mean leaving
 *   Supabase required rewriting the security model, which is exactly what
 *   this arrangement exists to prevent.
 *
 * Nothing implements these yet. They are written first on purpose: a
 * port derived from an adapter is just the adapter with extra steps.
 */

/** Our id for a person. Never the identity provider's. */
export type ProfileId = string;

/**
 * The identity provider's id for the same person.
 *
 * Kept as its own type so that the two cannot be passed to each other by
 * accident. 03 §6 is the reason they are separate columns at all: every
 * foreign key in this model points at our id, so replacing the provider
 * touches one column rather than every table.
 */
export type AuthUserId = string;

/** A moment in time, always UTC. */
export type Instant = Date;

/**
 * 03 §2: a set rather than a column, because the author is owner and
 * student simultaneously from day one.
 */
export type Role = "owner" | "tutor" | "student";

export interface Profile {
  id: ProfileId;
  authUserId: AuthUserId;
  displayName: string;
  email: string;
  /** IANA zone, e.g. "America/Sao_Paulo". */
  timezone: string;
}

/**
 * Sign-in, and the mapping from a provider's user to ours.
 *
 * Magic link is the only credential for now (01 §3), which is why email
 * delivery is the availability of the whole system and why the project
 * needs custom SMTP on day one.
 */
export interface Identity {
  /** Email the visitor a link that signs them in. */
  sendSignInLink(email: string, returnTo: string): Promise<void>;

  /**
   * The profile behind a request, or null if nobody is signed in.
   *
   * Null is an ordinary answer rather than an error: the role gate is a
   * persistent state, and an unauthenticated visitor is the common case
   * on a public route.
   */
  profileForRequest(accessToken: string | null): Promise<Profile | null>;

  /**
   * Every role this person holds. Empty means signed in but not yet
   * through the role gate — which is a state a profile can sit in
   * indefinitely, not a step in a sign-up flow.
   */
  rolesOf(profileId: ProfileId): Promise<ReadonlySet<Role>>;
}

export type SlotStatus = "open" | "held" | "booked" | "cancelled";

export interface Slot {
  id: string;
  tutorId: ProfileId;
  startsAt: Instant;
  durationMinutes: number;
  status: SlotStatus;
}

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";

export interface Booking {
  id: string;
  slotId: string;
  studentId: ProfileId;
  status: BookingStatus;
  requestedAt: Instant;
  decidedAt: Instant | null;
}

/**
 * Slots and the claims students make on them.
 *
 * 03 §3 keeps the two apart because their lifecycles differ: a slot can
 * be opened and withdrawn with nobody involved, and a booking can be
 * declined without the slot ceasing to exist.
 */
export interface Schedule {
  openSlotsFrom(tutorId: ProfileId, from: Instant): Promise<readonly Slot[]>;

  /**
   * The booking that entitles this student to be in a class at this
   * moment, or null.
   *
   * This is the question the join route asks, and it is the reason this
   * port is worth having: it is one sentence of domain language, and the
   * query behind it is nobody else's business.
   */
  findConfirmedBookingFor(
    studentId: ProfileId,
    at: Instant,
  ): Promise<Booking | null>;

  /**
   * Hold a slot while a booking is decided.
   *
   * Returns false if it was already taken — the caller decides what that
   * means, because the decision is a domain rule and this is not where
   * domain rules live. 04 §3 accepts that a hold has no automatic expiry
   * and that a dead slot is the cost.
   */
  holdSlot(slotId: string, forStudent: ProfileId): Promise<boolean>;

  requestBooking(slotId: string, studentId: ProfileId): Promise<Booking>;
  decideBooking(bookingId: string, confirmed: boolean): Promise<Booking>;
}

/** 03 §4's five outcomes. */
export type SessionOutcome =
  | "held"
  | "cancelled_by_student"
  | "cancelled_by_tutor"
  | "student_no_show"
  | "tutor_no_show";

export interface SessionRecord {
  bookingId: string;
  tutorId: ProfileId;
  studentId: ProfileId;
  scheduledStart: Instant;
  actualStart: Instant | null;
  actualEnd: Instant | null;
  outcome: SessionOutcome;
}

/**
 * What actually happened, which is the one thing here that cannot be
 * reconstructed after the day has passed (03 §4).
 *
 * Append-only, and there is deliberately no `update`: money is absent
 * from this model on the condition that sessions are written from the
 * very first real class (03 §5), and a record that can be edited later
 * is not the record that condition assumes.
 */
export interface Sessions {
  record(session: SessionRecord): Promise<void>;
  forStudent(studentId: ProfileId): Promise<readonly SessionRecord[]>;
  forTutor(tutorId: ProfileId): Promise<readonly SessionRecord[]>;
}
