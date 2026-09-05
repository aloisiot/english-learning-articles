/**
 * Constant-time secret comparison.
 *
 * Used by both halves of phase 1's auth surface: verifying a link's HMAC
 * signature, and checking the admin page's shared secret on every
 * submission. Kept in its own module so there is exactly one comparison
 * to audit, and so the tests can assert which primitive it reaches for
 * (timing itself is not unit-testable — see
 * research/video-calls/08-implementation-plan.md, phase 3).
 *
 * Two deliberate choices:
 *
 * 1. **Anything that is not a non-empty string fails immediately.** The
 *    tempting shape — coerce both sides with `String()` and compare —
 *    turns an unset `process.env.CLASS_ADMIN_SECRET` and a missing form
 *    field into `undefined` on both sides, which then *match*. A
 *    misconfigured deploy would silently have no admin auth at all.
 *    Rejecting non-strings and empty strings closes that. These checks
 *    look at type and emptiness, never at content, so they leak nothing
 *    about the real secret.
 * 2. **Both sides are hashed before comparison.** `timingSafeEqual`
 *    throws on unequal lengths, and the length check needed to avoid
 *    that would leak the secret's length through timing. Hashing first
 *    makes every comparison exactly 32 bytes whatever the inputs were.
 *
 * The parameters are `unknown` rather than `string` on purpose: every
 * caller is handing over something off the wire or out of the
 * environment, and a type annotation is not a runtime guarantee.
 */
import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * True when `a` and `b` are the same non-empty string, compared in
 * constant time with respect to their contents.
 */
export function secretsMatch(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a === "" || b === "") return false;
  return timingSafeEqual(digest(a), digest(b));
}
