/**
 * The chat wire format, as pure functions over untrusted data.
 *
 * Chat rides on Daily's `sendAppMessage`, which is a peer-to-peer
 * broadcast: whatever the other participant's browser sends arrives here
 * as an arbitrary JSON value. Nothing about it is guaranteed by the
 * transport, so `parseChatPayload` treats it exactly like a URL token —
 * validate the shape, return null rather than throw, and never hand a
 * half-checked object to React.
 *
 * **A message carries no name.** The sender's display name is read from
 * Daily's own participant record at the receiving end rather than from
 * the message body, which is what stops one participant from sending a
 * message that appears to come from the other. The wire format has no
 * field for it precisely so that it cannot be trusted by accident.
 *
 * There is no history: `sendAppMessage` reaches whoever is in the room at
 * the time, and phase 1 has no database to keep anything in. Someone who
 * joins late sees an empty chat, which is the honest consequence of the
 * stateless design rather than a bug.
 */

/** Discriminator, so a future app-message kind cannot be read as chat. */
export const CHAT_MESSAGE_TYPE = "chat-message";

/**
 * Longest message accepted, in characters, in either direction.
 *
 * Daily documents a size limit on app messages and drops anything over
 * it; a long message would therefore fail silently at the transport
 * rather than visibly in the UI. This cap is well inside that limit so
 * the failure is ours to show.
 */
export const MAX_CHAT_TEXT = 2_000;

export interface ChatPayload {
  type: typeof CHAT_MESSAGE_TYPE;
  text: string;
}

/**
 * Turn typed input into a payload, or null if there is nothing to send.
 *
 * Whitespace-only input is "nothing to send" rather than an error: it is
 * what an accidental Enter produces, and the sensible response is to do
 * nothing at all.
 */
export function buildChatPayload(text: unknown): ChatPayload | null {
  if (typeof text !== "string") return null;

  const trimmed = text.trim();
  if (trimmed === "" || trimmed.length > MAX_CHAT_TEXT) return null;

  return { type: CHAT_MESSAGE_TYPE, text: trimmed };
}

/**
 * Read an incoming app message, returning its text or null.
 *
 * The same limits are applied on the way in as on the way out. A peer
 * that ignores them is not trusted to have been our own code.
 */
export function parseChatPayload(data: unknown): string | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }

  const candidate = data as Record<string, unknown>;
  if (candidate.type !== CHAT_MESSAGE_TYPE) return null;
  if (typeof candidate.text !== "string") return null;

  const trimmed = candidate.text.trim();
  if (trimmed === "" || trimmed.length > MAX_CHAT_TEXT) return null;

  return trimmed;
}
