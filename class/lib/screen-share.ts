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
