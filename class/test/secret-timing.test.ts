/**
 * Timing itself is not unit-testable, so the plan's requirement — "assert
 * the function used" — is taken literally here: this file proves that the
 * comparison reaches `crypto.timingSafeEqual` and does not fall back to
 * `===` on some path. It lives apart from secret.test.ts because mocking
 * node:crypto is file-scoped, and the behavioural tests should run
 * against the real primitive.
 */
import { describe, expect, it, vi } from "vitest";

const timingSafeEqualSpy = vi.hoisted(() => vi.fn());

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  return {
    ...actual,
    timingSafeEqual: (...args: Parameters<typeof actual.timingSafeEqual>) => {
      timingSafeEqualSpy(...args);
      return actual.timingSafeEqual(...args);
    },
  };
});

const { secretsMatch } = await import("../lib/secret");

describe("secretsMatch timing safety", () => {
  it("compares through crypto.timingSafeEqual, over equal-length digests", () => {
    timingSafeEqualSpy.mockClear();

    expect(secretsMatch("a-secret", "a-secret")).toBe(true);
    expect(timingSafeEqualSpy).toHaveBeenCalledTimes(1);

    const [left, right] = timingSafeEqualSpy.mock.calls[0] as [
      Buffer,
      Buffer,
    ];
    // SHA-256 digests: fixed width whatever the inputs were, which is the
    // property that keeps the secret's *length* from leaking too.
    expect(left).toHaveLength(32);
    expect(right).toHaveLength(32);
  });

  it("still uses it when the secrets differ in length", () => {
    timingSafeEqualSpy.mockClear();

    expect(secretsMatch("short", "very much longer")).toBe(false);

    expect(timingSafeEqualSpy).toHaveBeenCalledTimes(1);
    const [left, right] = timingSafeEqualSpy.mock.calls[0] as [Buffer, Buffer];
    expect(left).toHaveLength(32);
    expect(right).toHaveLength(32);
  });

  it("short-circuits before it for input that is not a usable secret", () => {
    timingSafeEqualSpy.mockClear();

    expect(secretsMatch(undefined, undefined)).toBe(false);

    expect(timingSafeEqualSpy).not.toHaveBeenCalled();
  });
});
