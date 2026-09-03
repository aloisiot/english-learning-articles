/**
 * Turning a screen-share failure into something worth showing a teacher.
 *
 * This module exists because of a failure that was invisible: the room
 * had `enable_screenshare: false`, daily-js refused locally with a
 * perfectly clear message, and the UI showed nothing at all — the button
 * simply did not appear to do anything. The message was in the console,
 * which is not where a teacher mid-class is looking.
 *
 * The reason there was no UI is real, though, and shapes this: **a
 * cancelled picker and a genuine failure arrive through the same event.**
 * Someone who opens the picker and thinks better of it does not want to
 * be told they failed at something. So the rule is to stay silent when
 * the message looks like a cancellation and speak up otherwise, which is
 * the opposite of the usual default and deliberate.
 *
 * **The strings matched below are not from Daily's documentation.** They
 * are the shapes browsers and daily-js are observed to produce, and the
 * matching is therefore a heuristic. It fails in the safe direction: an
 * unrecognised message produces the generic sentence rather than
 * silence, so a new failure mode is still visible.
 */

/** Said when nothing more specific is known. */
export const GENERIC_SCREEN_SHARE_ERROR = "Screen sharing could not start.";

/**
 * Phrases that mean "the person decided not to", in the messages a
 * cancelled `getDisplayMedia` produces. Lowercased before matching.
 */
const CANCELLED = [
  "permission denied",
  "notallowederror",
  "cancel",
  "aborted",
  "dismissed",
  "the request is not allowed",
];

/**
 * A sentence to show, or `null` to say nothing.
 *
 * `null` means the failure was the person's own choice — there is
 * nothing to report and a message would be noise.
 */
export function describeScreenShareError(errorMsg: unknown): string | null {
  if (typeof errorMsg !== "string" || errorMsg.trim() === "") {
    return GENERIC_SCREEN_SHARE_ERROR;
  }

  const message = errorMsg.toLowerCase();

  // Checked before the cancellation list: this one is a configuration
  // fault rather than a choice, and it is the failure that prompted this
  // module. It must never be swallowed.
  if (message.includes("enable_screenshare")) {
    return "Screen sharing is turned off for this class room. A room made before sharing was switched on keeps the old setting until it expires.";
  }

  if (message.includes("not supported") || message.includes("notsupported")) {
    return "This browser cannot share a screen.";
  }

  if (CANCELLED.some((phrase) => message.includes(phrase))) return null;

  return GENERIC_SCREEN_SHARE_ERROR;
}

/* ------------------------------------------------------------------ */

/**
 * Only one screen is shared at a time, and the newcomer wins.
 *
 * A client cannot stop somebody else's screen share — the meeting tokens
 * this app mints are not owner tokens, deliberately. So "the first one
 * stops" has to be the first one stopping *itself*, decided locally from
 * state Daily already synchronises. No new message type is involved,
 * which matters: a rule carried by an app message would be lost exactly
 * when the message was.
 *
 * The decision rests on one local fact — **which remote screens were
 * already up when my own share started**. A remote share that was
 * present then is older than mine and is not my problem. One that
 * appears afterwards is the newcomer, and I yield to it.
 *
 * That is asymmetric on purpose, and it is what makes exactly one client
 * yield: when A is sharing and B starts, A sees a share that was not
 * there before and stops, while B sees only a share that predates its
 * own and does nothing.
 */

/**
 * How close two starts have to be before they count as simultaneous.
 *
 * Inside this window neither side can tell who was first — each sees the
 * other as the newcomer, and both would yield, which leaves nobody
 * sharing. That is the one failure worth engineering against, because it
 * is the one where the person who wanted to present ends up with
 * nothing.
 */
export const SIMULTANEOUS_START_MS = 1500;

export interface LocalScreenShare {
  /** This participant's own session id. */
  localSessionId: string;
  /** Whether this client is currently sharing. */
  sharing: boolean;
  /** When this client's share started, epoch ms; `null` if not sharing. */
  startedAt: number | null;
  /** Remote session ids already sharing at the moment it started. */
  knownAtStart: readonly string[];
}

/**
 * Whether this client should stop its own screen share.
 *
 * `remoteSharers` is every *other* participant currently sharing.
 */
export function shouldYieldScreenShare(
  local: LocalScreenShare,
  remoteSharers: readonly string[],
  now: number,
): boolean {
  if (!local.sharing) return false;

  const newcomers = remoteSharers.filter(
    (id) => !local.knownAtStart.includes(id),
  );
  if (newcomers.length === 0) return false;

  // A start time that is missing or in the future cannot be reasoned
  // about, so fall back to the plain rule: a newcomer appeared, yield.
  const startedAt = local.startedAt;
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) return true;

  const simultaneous = now - startedAt < SIMULTANEOUS_START_MS;
  if (!simultaneous) return true;

  // Both sides see the other as the newcomer, so the rule above would
  // stop both. Session ids break the tie the same way on both clients —
  // whoever sorts lower yields — so exactly one survives.
  return newcomers.every((id) => local.localSessionId < id);
}
