import { describe, expect, it } from "vitest";

import {
  ACCESS_COOKIE,
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
