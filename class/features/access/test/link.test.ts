import { describe, expect, it } from "vitest";

import {
  MAX_TOKEN_LENGTH,
  REASON,
  decodePayload,
  encodePayload,
  signEncoded,
  signPayload,
  verifyToken,
  type ClassLinkPayload,
} from "../domain/link";

const SECRET = "a-signing-secret-for-tests";
const OTHER_SECRET = "a-different-signing-secret";

/** An arbitrary fixed instant, so nothing here depends on the real clock. */
const NOW = 1_800_000_000;

function payload(overrides: Partial<ClassLinkPayload> = {}): ClassLinkPayload {
  return {
    slug: "2026-08-13-the-deal-that-ended-it",
    room: "the-deal-that-ended-4f2a9c1b83",
    exp: NOW + 600,
    ...overrides,
  };
}

describe("signPayload / verifyToken round trip", () => {
  it("returns the original payload for a token it minted", () => {
    const original = payload();

    const result = verifyToken(signPayload(original, SECRET), SECRET, {
      now: NOW,
    });

    expect(result).toEqual({ ok: true, payload: original });
  });

  it("falls back to the real clock when no `now` is supplied", () => {
    const token = signPayload(
      payload({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      SECRET,
    );

    expect(verifyToken(token, SECRET).ok).toBe(true);
  });
});

describe("tampering", () => {
  it("rejects a payload edited after signing", () => {
    const original = payload();
    const signature = signPayload(original, SECRET).split(".")[1];
    const forged = `${encodePayload({ ...original, room: "somewhere-else" })}.${signature}`;

    expect(verifyToken(forged, SECRET, { now: NOW })).toEqual({
      ok: false,
      reason: REASON.BAD_SIGNATURE,
    });
  });

  it("rejects an edited signature", () => {
    const [encoded, signature] = signPayload(payload(), SECRET).split(".") as [
      string,
      string,
    ];
    const flipped =
      signature.slice(0, -1) + (signature.endsWith("A") ? "B" : "A");

    expect(verifyToken(`${encoded}.${flipped}`, SECRET, { now: NOW })).toEqual({
      ok: false,
      reason: REASON.BAD_SIGNATURE,
    });
  });

  it("rejects a token signed with a different secret", () => {
    const token = signPayload(payload(), OTHER_SECRET);

    expect(verifyToken(token, SECRET, { now: NOW })).toEqual({
      ok: false,
      reason: REASON.BAD_SIGNATURE,
    });
  });
});

describe("expiry", () => {
  it("accepts a link one second before it expires", () => {
    const token = signPayload(payload({ exp: NOW + 1 }), SECRET);

    expect(verifyToken(token, SECRET, { now: NOW }).ok).toBe(true);
  });

  // The boundary is deliberately exclusive: a link is dead *at* its
  // expiry second, not one second after it.
  it("rejects a link at the exact expiry second", () => {
    const token = signPayload(payload({ exp: NOW }), SECRET);

    expect(verifyToken(token, SECRET, { now: NOW })).toEqual({
      ok: false,
      reason: REASON.EXPIRED,
    });
  });

  it("rejects a link past its expiry", () => {
    const token = signPayload(payload({ exp: NOW - 1 }), SECRET);

    expect(verifyToken(token, SECRET, { now: NOW })).toEqual({
      ok: false,
      reason: REASON.EXPIRED,
    });
  });
});

describe("room binding", () => {
  it("accepts a link at the room it was minted for", () => {
    const token = signPayload(payload({ room: "room-a" }), SECRET);

    const result = verifyToken(token, SECRET, {
      now: NOW,
      expectedRoom: "room-a",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects a valid link replayed at another room's URL", () => {
    const token = signPayload(payload({ room: "room-a" }), SECRET);

    expect(
      verifyToken(token, SECRET, { now: NOW, expectedRoom: "room-b" }),
    ).toEqual({ ok: false, reason: REASON.ROOM_MISMATCH });
  });
});

describe("failing closed", () => {
  const malformed: Array<[string, unknown]> = [
    ["undefined", undefined],
    ["null", null],
    ["a number", 12345],
    ["an object", {}],
    ["the empty string", ""],
    ["a string with no separator", "no-separator-here"],
    ["a string with too many separators", "one.two.three"],
    ["an empty payload half", ".c2lnbmF0dXJl"],
    ["an empty signature half", "cGF5bG9hZA=="],
    ["an oversized token", `${"a".repeat(MAX_TOKEN_LENGTH + 1)}.sig`],
  ];

  it.each(malformed)("rejects %s without throwing", (_label, token) => {
    expect(verifyToken(token, SECRET, { now: NOW })).toEqual({
      ok: false,
      reason: REASON.MALFORMED,
    });
  });

  it("rejects a correctly signed payload that is not a valid payload", () => {
    // Reaching this means the minting side produced nonsense, not that
    // anyone forged anything — it still has to fail rather than pass a
    // half-formed payload to a caller.
    const encoded = Buffer.from("not json at all", "utf8").toString("base64url");
    const token = `${encoded}.${signEncoded(encoded, SECRET)}`;

    expect(verifyToken(token, SECRET, { now: NOW })).toEqual({
      ok: false,
      reason: REASON.MALFORMED,
    });
  });
});

describe("decodePayload", () => {
  it("round-trips a valid payload", () => {
    expect(decodePayload(encodePayload(payload()))).toEqual(payload());
  });

  const invalid: Array<[string, string]> = [
    ["undecodable bytes", "!!!!not-base64!!!!"],
    ["valid JSON that is not an object", encodePayload(42)],
    ["null", encodePayload(null)],
    ["an array", encodePayload([1, 2, 3])],
    ["a non-string slug", encodePayload({ slug: 1, room: "r", exp: NOW })],
    // Not the same as an absent slug: "no article" is spelled by leaving
    // the field out, so an empty one is a payload this app never mints.
    ["an empty slug", encodePayload({ slug: "", room: "r", exp: NOW })],
    ["a missing room", encodePayload({ slug: "s", exp: NOW })],
    ["a non-string room", encodePayload({ slug: "s", room: 1, exp: NOW })],
    ["an empty room", encodePayload({ slug: "s", room: "", exp: NOW })],
    ["a missing exp", encodePayload({ slug: "s", room: "r" })],
    ["a non-numeric exp", encodePayload({ slug: "s", room: "r", exp: "soon" })],
  ];

  it.each(invalid)("returns null for %s", (_label, encoded) => {
    expect(decodePayload(encoded)).toBeNull();
  });

  it("accepts a payload with no slug, for a class with no article", () => {
    const withoutSlug = { room: "r", exp: NOW };

    expect(decodePayload(encodePayload(withoutSlug))).toEqual(withoutSlug);
  });

  it("returns null for an exp that JSON overflows to Infinity", () => {
    // 1e999 has no finite double, so JSON.parse yields Infinity — which
    // would otherwise be an expiry that never arrives.
    const encoded = Buffer.from(
      '{"slug":"s","room":"r","exp":1e999}',
      "utf8",
    ).toString("base64url");

    expect(decodePayload(encoded)).toBeNull();
  });
});
