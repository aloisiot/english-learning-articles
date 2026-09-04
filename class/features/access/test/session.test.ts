import { describe, expect, it } from "vitest";

import {
  ACCESS_COOKIE,
  REFRESH_SKEW_SECONDS,
  accessTokenExpiry,
  needsRefresh,
  REFRESH_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  clearedCookie,
  isSecureOrigin,
  sessionCookie,
} from "../domain/session";

describe("cookie names", () => {
  it("keeps the two tokens in separate cookies", () => {
    expect(ACCESS_COOKIE).not.toBe(REFRESH_COOKIE);
  });
});

describe("SESSION_MAX_AGE_SECONDS", () => {
  it("is one month, as 01 §4 requires", () => {
    // Pinned to the requirement, not recomputed from the expression.
    expect(SESSION_MAX_AGE_SECONDS).toBe(2592000);
  });
});

describe("sessionCookie", () => {
  it("is not readable from JavaScript", () => {
    expect(sessionCookie(true).httpOnly).toBe(true);
  });

  it("is scoped to the class app, not the whole domain", () => {
    // The articles site shares the domain and has no business
    // receiving a session cookie.
    expect(sessionCookie(true).path).toBe("/class");
  });

  it("is lax rather than strict, so a link from a mail client works", () => {
    // strict withholds cookies on a top-level navigation from another
    // site, which is exactly what clicking a magic link is.
    expect(sessionCookie(true).sameSite).toBe("lax");
  });

  it("is secure over HTTPS", () => {
    expect(sessionCookie(true).secure).toBe(true);
  });

  it("is not secure without it, so localhost does not silently fail", () => {
    expect(sessionCookie(false).secure).toBe(false);
  });

  it("defaults to the full session lifetime", () => {
    expect(sessionCookie(true).maxAge).toBe(SESSION_MAX_AGE_SECONDS);
  });

  it("accepts a shorter life when the caller wants one", () => {
    expect(sessionCookie(true, 60).maxAge).toBe(60);
  });
});

describe("clearedCookie", () => {
  it("expires immediately, which is how a cookie is deleted", () => {
    expect(clearedCookie(true).maxAge).toBe(0);
  });

  it("keeps the same path, or the browser would not match it", () => {
    expect(clearedCookie(true).path).toBe(sessionCookie(true).path);
  });
});

describe("isSecureOrigin", () => {
  it.each(["https://example.com", "https://x.vercel.app"])(
    "reads %s as secure",
    (origin) => {
      expect(isSecureOrigin(origin)).toBe(true);
    },
  );

  it.each(["http://localhost:3000", "http://example.com"])(
    "reads %s as insecure",
    (origin) => {
      expect(isSecureOrigin(origin)).toBe(false);
    },
  );
});

/*
  A JWT with the payload we care about. Signed with nothing, because
  nothing here trusts the signature — see accessTokenExpiry. Built by
  hand rather than with a library so the test does not depend on the same
  encoder the code does.
*/
function tokenExpiringAt(exp: number | null): string {
  const b64url = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const payload = exp === null ? { sub: "abc" } : { sub: "abc", exp };
  return `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.sig`;
}

describe("accessTokenExpiry", () => {
  it("reads exp out of a token", () => {
    expect(accessTokenExpiry(tokenExpiringAt(1789000000))).toBe(1789000000);
  });

  it("survives base64url padding of every length", () => {
    // The payload length decides how much "=" padding is needed, and
    // getting that wrong fails on some tokens and not others.
    for (const exp of [1, 12, 123, 1234, 12345, 123456, 1234567, 12345678]) {
      expect(accessTokenExpiry(tokenExpiringAt(exp))).toBe(exp);
    }
  });

  const unreadable: Array<[string, string | undefined]> = [
    ["undefined", undefined],
    ["an empty string", ""],
    ["something that is not a JWT", "not-a-token"],
    ["only two segments", "header.payload"],
    ["four segments", "a.b.c.d"],
    ["a payload that is not base64", "header.!!!!.sig"],
  ];

  it.each(unreadable)("returns null for %s", (_label, token) => {
    expect(accessTokenExpiry(token)).toBeNull();
  });

  it("returns null for a token carrying no exp", () => {
    expect(accessTokenExpiry(tokenExpiringAt(null))).toBeNull();
  });

  /*
    A payload is only *conventionally* a JSON object. Valid base64 of
    valid JSON that happens not to be one parses cleanly and then has no
    claims to read, so both shapes are checked rather than assumed.
  */
  it.each([
    ["a bare number", "123"],
    ["a bare string", '"nope"'],
    ["JSON null, which is typeof object", "null"],
    ["an array", "[1,2,3]"],
  ])("returns null for a payload that is %s", (_label, json) => {
    const payload = btoa(json)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    expect(accessTokenExpiry(`header.${payload}.sig`)).toBeNull();
  });

  it("returns null when exp is not a number", () => {
    const payload = btoa(JSON.stringify({ exp: "soon" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    expect(accessTokenExpiry(`header.${payload}.sig`)).toBeNull();
  });
});

describe("needsRefresh", () => {
  const now = new Date("2026-09-04T12:00:00Z");
  const nowSeconds = Math.floor(now.getTime() / 1000);

  it("leaves a token with plenty of life alone", () => {
    expect(needsRefresh(tokenExpiringAt(nowSeconds + 3600), now)).toBe(false);
  });

  it("refreshes one that has already expired", () => {
    expect(needsRefresh(tokenExpiringAt(nowSeconds - 1), now)).toBe(true);
  });

  /*
    The margin exists so a request arriving in a token's last moments does
    not pass this check and then fail against the provider — a race that
    only appears under load and reads as a random logout.
  */
  it("refreshes one inside the margin, before it actually expires", () => {
    expect(REFRESH_SKEW_SECONDS).toBe(60);
    expect(needsRefresh(tokenExpiringAt(nowSeconds + 30), now)).toBe(true);
  });

  it("treats the margin boundary as needing refresh", () => {
    expect(needsRefresh(tokenExpiringAt(nowSeconds + 60), now)).toBe(true);
  });

  it("leaves one a second beyond the margin alone", () => {
    expect(needsRefresh(tokenExpiringAt(nowSeconds + 61), now)).toBe(false);
  });

  it.each([undefined, "", "garbage"])(
    "refreshes when the token is %s, since asking is the right move",
    (token) => {
      expect(needsRefresh(token, now)).toBe(true);
    },
  );

  it("honours a caller's own margin", () => {
    expect(needsRefresh(tokenExpiringAt(nowSeconds + 120), now, 300)).toBe(true);
  });
});
