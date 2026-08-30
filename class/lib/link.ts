/**
 * Signed class links — the security boundary of phase 1.
 *
 * There is no database and no account system yet, so a link *is* the
 * authorisation: it carries the Daily room name, an expiry and — when
 * the class is about one — an article slug, and an HMAC over all of them
 * proves the class app minted it.
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

import { secretsMatch } from "./secret";

/** What a class link carries, and all it carries. */
export interface ClassLinkPayload {
  /**
   * Article the class is about, as its `site/content` filename stem.
   *
   * Optional: a class does not have to be about an article. The field is
   * left out of the payload entirely rather than set to an empty string,
   * so "no article" has one representation on the wire and not two.
   */
  slug?: string;
  /** Daily room name, derived rather than stored — see ./room.ts. */
  room: string;
  /** Expiry, epoch seconds. The link is dead *at* this second. */
  exp: number;
}

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
} as const;

export type VerifyFailureReason = (typeof REASON)[keyof typeof REASON];

export type VerifyResult =
  | { ok: true; payload: ClassLinkPayload }
  | { ok: false; reason: VerifyFailureReason };

export interface VerifyOptions {
  /** Epoch seconds to judge expiry against. Defaults to the real clock. */
  now?: number;
  /**
   * When given, the payload's room must equal it — so a valid link for
   * one class cannot be replayed at another class's URL.
   */
  expectedRoom?: string;
}

function isValidPayload(value: unknown): value is ClassLinkPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  // An absent slug is a class with no article. A present one still has
  // to be a non-empty string: an empty slug would be a third spelling of
  // "no article", and the whole point of omitting the field is that
  // there is only one.
  if (candidate.slug !== undefined) {
    if (typeof candidate.slug !== "string" || candidate.slug === "") {
      return false;
    }
  }
  if (typeof candidate.room !== "string" || candidate.room === "") return false;
  // Number.isFinite is false for non-numbers too, so this one check
  // covers a missing exp, a string exp, and the Infinity that
  // JSON.parse produces from an overflowing literal like 1e999.
  if (!Number.isFinite(candidate.exp)) return false;
  return true;
}

/** Serialise a payload to the URL-safe half of a token. */
export function encodePayload(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

/**
 * Inverse of `encodePayload`, returning `null` rather than throwing for
 * anything that is not a well-formed payload.
 */
export function decodePayload(encoded: string): ClassLinkPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  return isValidPayload(parsed) ? parsed : null;
}

/** The HMAC half of a token, over the already-encoded payload. */
export function signEncoded(encoded: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(encoded, "utf8")
    .digest("base64url");
}

/** Mint a token for `payload`. The inverse of `verifyToken`. */
export function signPayload(
  payload: ClassLinkPayload,
  secret: string,
): string {
  const encoded = encodePayload(payload);
  return `${encoded}.${signEncoded(encoded, secret)}`;
}

/**
 * Verify a token and return its payload.
 *
 * `token` is `unknown` because it arrives from a URL or a JSON body,
 * where no annotation is a guarantee.
 */
export function verifyToken(
  token: unknown,
  secret: string,
  options: VerifyOptions = {},
): VerifyResult {
  const { now = Math.floor(Date.now() / 1000), expectedRoom } = options;

  if (typeof token !== "string") return { ok: false, reason: REASON.MALFORMED };
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: REASON.MALFORMED };
  }

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: REASON.MALFORMED };

  const [encoded, provided] = parts as [string, string];
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
