import { describe, expect, it } from "vitest";

import { secretsMatch } from "../lib/secret.js";

describe("secretsMatch", () => {
  it("matches a secret against itself", () => {
    expect(secretsMatch("correct horse battery", "correct horse battery")).toBe(
      true,
    );
  });

  it("rejects a different secret of the same length", () => {
    expect(secretsMatch("aaaaaaaa", "aaaaaaab")).toBe(false);
  });

  it("rejects secrets of different lengths without throwing", () => {
    // The naive implementation hands unequal-length buffers straight to
    // timingSafeEqual, which throws. Hashing first is what makes this
    // an ordinary false.
    expect(secretsMatch("short", "considerably longer")).toBe(false);
  });

  // The important one: an unset environment variable and a missing form
  // field are both `undefined`, and a `String()`-coercing implementation
  // would call that a match — leaving a misconfigured deploy with no
  // admin auth at all.
  it.each([
    ["both undefined", undefined, undefined],
    ["both null", null, null],
    ["undefined against a real secret", undefined, "real-secret"],
    ["a real secret against undefined", "real-secret", undefined],
    ["both empty strings", "", ""],
    ["an empty string against a real secret", "", "real-secret"],
    ["a real secret against an empty string", "real-secret", ""],
    ["numbers that would coerce alike", 1234, "1234"],
    ["objects", {}, {}],
  ])("never matches %s", (_label, a, b) => {
    expect(secretsMatch(a, b)).toBe(false);
  });
});
