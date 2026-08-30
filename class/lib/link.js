/**
 * Signed class links — the security boundary of phase 1.
 *
 * There is no database and no account system yet, so a link *is* the
 * authorisation: it carries the article slug, the Daily room name and an
 * expiry, and an HMAC over all three proves the class app minted it.
 * See research/video-calls/07-two-app-architecture.md §7.
 *
 * The whole module is pure — no I/O, no clock of its own beyond a
 * caller-supplied `now` — because that is what lets the rules below be
 * asserted directly rather than through a route handler.
 *
 * Two ordering decisions worth stating, since both are security-relevant
 * rather than stylistic:
 *
 * - **The signature is checked before the payload is parsed.** Decoding
 *   first would mean running JSON.parse over bytes an attacker chose.
 *   A tampered payload therefore reports `BAD_SIGNATURE`, not
 *   `MALFORMED`, which is also the more honest description of it.
 * - **Every failure returns a reason rather than throwing.** Malformed,
 *   empty and oversized input are ordinary answers here, not exceptions:
 *   this function is reached directly from a URL, so it has to fail
 *   closed on anything at all.
 */
import { createHmac } from "node:crypto";
import { secretsMatch } from "./secret.js";

/**
 * Longest token accepted before it is rejected unread. A legitimate
 * token is well under 200 characters; this only exists so a multi-
 * megabyte URL cannot be turned into HMAC work.
 */
export const MAX_TOKEN_LENGTH = 512;

export const REASON = {
  MALFORMED: "malformed",
  BAD_SIGNATURE: "bad-signature",
  EXPIRED: "expired",
  ROOM_MISMATCH: "room-mismatch",
};

function isValidPayload(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  if (typeof value.slug !== "string" || value.slug === "") return false;
  if (typeof value.room !== "string" || value.room === "") return false;
  // Number.isFinite is false for non-numbers too, so this one check
  // covers a missing exp, a string exp, and the Infinity that
  // JSON.parse produces from an overflowing literal like 1e999.
  if (!Number.isFinite(value.exp)) return false;
  return true;
}

/** Serialise a payload to the URL-safe half of a token. */
export function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

/**
 * Inverse of `encodePayload`, returning `null` rather than throwing for
 * anything that is not a well-formed payload.
 */
export function decodePayload(encoded) {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  return isValidPayload(parsed) ? parsed : null;
}

/** The HMAC half of a token, over the already-encoded payload. */
export function signEncoded(encoded, secret) {
  return createHmac("sha256", secret).update(encoded, "utf8").digest("base64url");
}

/** Mint a token for `payload`. The inverse of `verifyToken`. */
export function signPayload(payload, secret) {
  const encoded = encodePayload(payload);
  return `${encoded}.${signEncoded(encoded, secret)}`;
}

/**
 * Verify a token and return its payload.
 *
 * @param token         the `<payload>.<signature>` string from the URL
 * @param secret        the signing secret
 * @param options.now   epoch seconds to judge expiry against; a link is
 *                      expired *at* its expiry second, not one after it
 * @param options.expectedRoom
 *                      when given, the payload's room must equal it, so
 *                      a valid link for one class cannot be replayed at
 *                      another class's URL
 * @returns `{ ok: true, payload }` or `{ ok: false, reason }`
 */
export function verifyToken(token, secret, options = {}) {
  const { now = Math.floor(Date.now() / 1000), expectedRoom } = options;

  if (typeof token !== "string") return { ok: false, reason: REASON.MALFORMED };
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: REASON.MALFORMED };
  }

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: REASON.MALFORMED };

  const [encoded, provided] = parts;
  if (encoded === "" || provided === "") {
    return { ok: false, reason: REASON.MALFORMED };
  }

  if (!secretsMatch(provided, signEncoded(encoded, secret))) {
    return { ok: false, reason: REASON.BAD_SIGNATURE };
  }

  // Only now is the payload trusted enough to parse. Reaching this and
  // still failing means something signed with the real secret was
  // itself malformed, which is a bug on the minting side rather than an
  // attack — but it still fails closed.
  const payload = decodePayload(encoded);
  if (payload === null) return { ok: false, reason: REASON.MALFORMED };

  if (payload.exp <= now) return { ok: false, reason: REASON.EXPIRED };

  if (expectedRoom !== undefined && payload.room !== expectedRoom) {
    return { ok: false, reason: REASON.ROOM_MISMATCH };
  }

  return { ok: true, payload };
}
