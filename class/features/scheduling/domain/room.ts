/**
 * Room-name derivation and the arithmetic of a class's time window.
 *
 * Both are pure, and both exist as their own module for the same reason:
 * they are the rules a class link encodes, so they are worth asserting
 * directly rather than through whatever route happens to call them.
 *
 * On the time arithmetic: **every value here is epoch seconds, UTC.**
 * That is the entire defence against the two cases the plan calls out —
 * a class that crosses midnight and one that crosses a DST boundary.
 * Neither is a special case when the arithmetic never sees a wall clock;
 * both become one if a local date is ever reconstructed in between.
 * Formatting to a human's timezone is a rendering concern and stays out
 * of this module.
 *
 * Inputs are typed as `unknown` and validated at runtime, because both
 * functions sit directly behind a JSON request body.
 */
import { createHash } from "node:crypto";

/** The standard class length — see docs/class-structure.md. */
export const DEFAULT_CLASS_MINUTES = 30;

/**
 * How long past the end of a class a link and its room stay alive.
 *
 * Daily's room expiry ejects everyone the moment it passes, so setting
 * it to the exact class end would cut off a class that ran thirty
 * seconds long mid-sentence. The grace is deliberately short: the point
 * of setting the expiry at all is that a forgotten room self-destructs
 * rather than billing quietly (research/video-calls/03 §6).
 */
export const DEFAULT_GRACE_MINUTES = 10;

/** Hex characters of digest appended to a room name. */
const DIGEST_LENGTH = 10;

/**
 * Conservative cap on the whole room name. Daily documents a limit on
 * room names that this stays well inside; the exact figure was not
 * verified against Daily's API reference, so the cap is chosen to be
 * obviously safe rather than maximal.
 */
const MAX_ROOM_NAME_LENGTH = 40;
const MAX_SLUG_PART = MAX_ROOM_NAME_LENGTH - DIGEST_LENGTH - 1;

/** The three instants a class link depends on, all epoch seconds. */
export interface ClassWindow {
  startsAt: number;
  endsAt: number;
  expiresAt: number;
}

export interface DeriveRoomNameInput {
  /** Omitted, or empty, for a class that is not about an article. */
  slug?: unknown;
  startsAt?: unknown;
}

export interface ClassWindowInput {
  startsAt?: unknown;
  durationMinutes?: unknown;
  graceMinutes?: unknown;
}

function assertFinite(name: string, value: unknown): asserts value is number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number of epoch seconds`);
  }
}

function assertMinutes(
  name: string,
  value: unknown,
  { allowZero }: { allowZero: boolean },
): asserts value is number {
  if (!Number.isFinite(value) || (value as number) < 0 || (!allowZero && value === 0)) {
    throw new RangeError(
      `${name} must be a ${allowZero ? "non-negative" : "positive"} number of minutes`,
    );
  }
}

/**
 * Reduce an article slug to the characters Daily accepts in a room name:
 * lowercase letters, digits and dashes.
 */
function slugPart(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_PART)
    .replace(/-+$/, "");
}

/**
 * An article slug as the digest sees it: the empty string when there is
 * no article.
 *
 * A class does not have to be about an article, so an absent slug is an
 * ordinary input rather than a fault. An empty string means the same
 * thing as an absent one — it is what a blank field in the admin form
 * submits, and treating the two differently would derive two rooms for
 * what a teacher set up as one class.
 */
function articleSlug(slug: unknown): string {
  if (slug === undefined || slug === null) return "";
  if (typeof slug !== "string") {
    throw new TypeError("slug must be a string when given");
  }
  return slug;
}

/**
 * The Daily room name for a class, derived rather than stored — there is
 * no database in phase 1, so the same class must always produce the same
 * name and two different classes must never collide.
 *
 * The digest is taken over the slug and start time separated by a NUL,
 * which no slug can contain, so `{slug: "a-b", startsAt: 1}` cannot
 * collide with `{slug: "a", startsAt: "b-1"}`.
 *
 * The separator is written as the escape `\0` rather than as a literal
 * NUL byte in this file. They are the same character at run time, and
 * they have to be: changing it would move every existing class to a
 * different room. The escape is preferable only because a raw NUL makes
 * git treat this source file as binary, so it stops showing diffs for
 * it — which is how an earlier change to this line went unreviewed.
 *
 * A class with no article digests the empty string before the NUL. No
 * real slug reduces to that, so article and non-article classes cannot
 * collide either.
 */
export function deriveRoomName({ slug, startsAt }: DeriveRoomNameInput): string {
  const article = articleSlug(slug);
  assertFinite("startsAt", startsAt);

  const digest = createHash("sha256")
    .update(`${article}\0${startsAt}`, "utf8")
    .digest("hex")
    .slice(0, DIGEST_LENGTH);

  const prefix = slugPart(article);
  // A slug of nothing but punctuation reduces to an empty prefix, and so
  // does no slug at all; the digest alone is still unique, it just needs
  // to stay a legal name.
  return prefix === "" ? `class-${digest}` : `${prefix}-${digest}`;
}

/**
 * The three instants a class link depends on, from its start and length.
 */
export function classWindow({
  startsAt,
  durationMinutes = DEFAULT_CLASS_MINUTES,
  graceMinutes = DEFAULT_GRACE_MINUTES,
}: ClassWindowInput): ClassWindow {
  assertFinite("startsAt", startsAt);
  assertMinutes("durationMinutes", durationMinutes, { allowZero: false });
  assertMinutes("graceMinutes", graceMinutes, { allowZero: true });

  const endsAt = startsAt + durationMinutes * 60;
  return { startsAt, endsAt, expiresAt: endsAt + graceMinutes * 60 };
}
