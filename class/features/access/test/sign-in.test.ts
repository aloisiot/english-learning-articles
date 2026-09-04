import { describe, expect, it } from "vitest";

import {
  DEFAULT_RETURN_TO,
  DEFAULT_VERIFICATION_TYPE,
  VERIFICATION_TYPES,
  SIGN_IN_FAILURE,
  callbackUrl,
  classifySignInFailure,
  isPlausibleEmail,
  normaliseEmail,
  safeReturnTo,
  verificationType,
} from "../domain/sign-in";

describe("normaliseEmail", () => {
  it.each([
    ["  Aloisio@Example.COM  ", "aloisio@example.com"],
    ["already@lower.com", "already@lower.com"],
    ["\tTabbed@x.co\n", "tabbed@x.co"],
  ])("normalises %s", (raw, expected) => {
    expect(normaliseEmail(raw)).toBe(expected);
  });

  it.each([undefined, null, 7, {}, []])("returns empty for %s", (raw) => {
    expect(normaliseEmail(raw)).toBe("");
  });
});

describe("isPlausibleEmail", () => {
  const plausible = [
    "a@b.co",
    "aloisio@example.com",
    "first.last+tag@sub.example.co.uk",
    "x@x.x",
  ];

  it.each(plausible)("accepts %s", (email) => {
    expect(isPlausibleEmail(email)).toBe(true);
  });

  const implausible: Array<[string, string]> = [
    ["an empty string", ""],
    ["no at sign", "example.com"],
    ["two at signs", "a@b@c.com"],
    ["nothing before the at", "@example.com"],
    ["no dot in the domain", "a@localhost"],
    ["a leading dot in the domain", "a@.example.com"],
    ["a trailing dot in the domain", "a@example.com."],
    ["an internal space", "a b@example.com"],
    ["a pasted sentence", "please email me at a@example.com thanks"],
  ];

  it.each(implausible)("rejects %s", (_label, email) => {
    expect(isPlausibleEmail(email)).toBe(false);
  });

  it("rejects an address longer than the RFC maximum", () => {
    // 254 is the limit; this is 255.
    const long = `${"a".repeat(245)}@example.com`;
    expect(long.length).toBe(257);
    expect(isPlausibleEmail(long)).toBe(false);
  });

  it("accepts one exactly at the maximum", () => {
    const local = "a".repeat(254 - "@example.com".length);
    const email = `${local}@example.com`;
    expect(email.length).toBe(254);
    expect(isPlausibleEmail(email)).toBe(true);
  });
});

describe("safeReturnTo", () => {
  it.each(["/", "/dashboard", "/dashboard?tab=slots", "/j/abc#chat"])(
    "keeps the app-relative path %s",
    (path) => {
      expect(safeReturnTo(path)).toBe(path);
    },
  );

  /*
    Each of these is a way out of the site, and the reason this function
    exists rather than a startsWith("/") check inline.
  */
  const escapes: Array<[string, unknown]> = [
    ["a protocol-relative URL", "//evil.example"],
    ["an absolute URL", "https://evil.example/x"],
    ["a scheme buried in a path", "/x?next=javascript://evil"],
    ["a backslash, read as a slash by some parsers", "/\\evil.example"],
    ["a bare backslash pair", "\\\\evil.example"],
    ["a relative path", "dashboard"],
    ["an empty string", ""],
    ["undefined", undefined],
    ["a number", 7],
  ];

  it.each(escapes)("falls back for %s", (_label, raw) => {
    expect(safeReturnTo(raw)).toBe(DEFAULT_RETURN_TO);
  });

  it("uses a caller's fallback when one is given", () => {
    expect(safeReturnTo("//evil.example", "/sign-in")).toBe("/sign-in");
  });
});

describe("classifySignInFailure", () => {
  it.each([
    "Token has expired or is invalid",
    "Email link is invalid or has expired",
    "EXPIRED",
  ])("reads %s as expired", (message) => {
    expect(classifySignInFailure(message)).toBe(SIGN_IN_FAILURE.EXPIRED);
  });

  it.each(["fetch failed", "500 Internal Server Error", "", "rate limited"])(
    "reads %s as unavailable",
    (message) => {
      expect(classifySignInFailure(message)).toBe(SIGN_IN_FAILURE.UNAVAILABLE);
    },
  );

  it.each([undefined, null, 7, {}])(
    "reads the non-string %s as unavailable",
    (message) => {
      expect(classifySignInFailure(message)).toBe(SIGN_IN_FAILURE.UNAVAILABLE);
    },
  );
});

describe("callbackUrl", () => {
  const ORIGIN = "https://example.com";

  it("points at the class app's callback on the site's own origin", () => {
    expect(callbackUrl(ORIGIN, "/dashboard")).toBe(
      "https://example.com/class/auth/callback?return_to=%2Fdashboard",
    );
  });

  it("carries the return-to through the inbox", () => {
    const url = new URL(callbackUrl(ORIGIN, "/j/abc"));
    expect(url.searchParams.get("return_to")).toBe("/j/abc");
  });

  it("refuses to carry an escape in the return-to", () => {
    const url = new URL(callbackUrl(ORIGIN, "https://evil.example"));
    expect(url.searchParams.get("return_to")).toBe(DEFAULT_RETURN_TO);
  });

  it("ignores the deployment's own origin in favour of the one given", () => {
    // /class is reached through the microfrontends routing, so a URL
    // built from this app's own deployment would bypass it entirely.
    expect(callbackUrl("https://class-app.vercel.app", "/")).toContain(
      "https://class-app.vercel.app/class/auth/callback",
    );
  });
});

describe("verificationType", () => {
  /*
    Supabase picks a template from *why* the mail went out: a first-time
    address gets "Confirm signup", a known one gets "Magic Link", and the
    link carries which in its type. Hard-coding one worked until the very
    first new user — which is how this was found, on the first real
    sign-up attempt.
  */
  it.each(VERIFICATION_TYPES)("passes %s through", (type) => {
    expect(verificationType(type)).toBe(type);
  });

  it("accepts the signup type a brand-new address produces", () => {
    expect(verificationType("signup")).toBe("signup");
  });

  it.each(["", "SIGNUP", "sms", "phone_change", "../evil", undefined, null, 7, {}])(
    "falls back to the generic type for %s",
    (raw) => {
      expect(verificationType(raw)).toBe(DEFAULT_VERIFICATION_TYPE);
    },
  );

  it("defaults to the generic rather than to what this app happens to send", () => {
    // "email" covers signup and sign-in both; defaulting to "magiclink"
    // would reintroduce exactly the bug this replaced.
    expect(DEFAULT_VERIFICATION_TYPE).toBe("email");
  });
});
