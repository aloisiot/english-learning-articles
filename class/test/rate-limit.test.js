import { describe, expect, it } from "vitest";

import {
  DEFAULT_LIMIT,
  DEFAULT_WINDOW_SECONDS,
  rateLimit,
} from "../lib/rate-limit.js";

const NOW = 1_800_000_000;
const KEY = "203.0.113.7";

/** Run `count` attempts at the same instant, returning the last result. */
function attempts(count, { key = KEY, now = NOW, options } = {}) {
  let state;
  let result;
  for (let i = 0; i < count; i++) {
    result = rateLimit(state, key, now, options);
    state = result.state;
  }
  return result;
}

describe("rateLimit", () => {
  it("allows the first attempt from a cold start", () => {
    const result = rateLimit(undefined, KEY, NOW);

    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);
  });

  it("allows exactly the limit within one window", () => {
    expect(attempts(DEFAULT_LIMIT).allowed).toBe(true);
  });

  it("blocks the attempt after the limit", () => {
    const result = attempts(DEFAULT_LIMIT + 1);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("counts down the attempts left", () => {
    expect(rateLimit(undefined, KEY, NOW).remaining).toBe(DEFAULT_LIMIT - 1);
    expect(attempts(2).remaining).toBe(DEFAULT_LIMIT - 2);
  });

  it("lets attempts age out of the window", () => {
    const exhausted = attempts(DEFAULT_LIMIT + 1);
    expect(exhausted.allowed).toBe(false);

    const later = rateLimit(
      exhausted.state,
      KEY,
      NOW + DEFAULT_WINDOW_SECONDS + 1,
    );

    expect(later.allowed).toBe(true);
  });

  it("holds the block for the rest of the window", () => {
    const exhausted = attempts(DEFAULT_LIMIT + 1);

    const stillInside = rateLimit(exhausted.state, KEY, NOW + 1);

    expect(stillInside.allowed).toBe(false);
    expect(stillInside.retryAfter).toBeGreaterThanOrEqual(1);
  });

  it("counts each key separately", () => {
    const exhausted = attempts(DEFAULT_LIMIT + 1);

    const other = rateLimit(exhausted.state, "198.51.100.4", NOW);

    expect(other.allowed).toBe(true);
  });

  it("honours a custom limit and window", () => {
    const options = { limit: 2, windowSeconds: 10 };

    expect(attempts(2, { options }).allowed).toBe(true);
    expect(attempts(3, { options }).allowed).toBe(false);
  });

  // Without this the limiter would accumulate one entry per address that
  // ever touched the page, on an instance that may live for days.
  it("forgets keys once their attempts have aged out", () => {
    const first = rateLimit(undefined, KEY, NOW);
    expect(first.state.size).toBe(1);

    const later = rateLimit(
      first.state,
      "198.51.100.4",
      NOW + DEFAULT_WINDOW_SECONDS + 1,
    );

    expect(later.state.has(KEY)).toBe(false);
    expect(later.state.size).toBe(1);
  });

  it("never reports a retryAfter below one second", () => {
    // An attempt on the very edge of ageing out would otherwise round to
    // a zero-second retry, which reads as "try now" and immediately fails.
    const exhausted = attempts(DEFAULT_LIMIT + 1);

    const edge = rateLimit(
      exhausted.state,
      KEY,
      NOW + DEFAULT_WINDOW_SECONDS - 0.5,
    );

    expect(edge.allowed).toBe(false);
    expect(edge.retryAfter).toBe(1);
  });
});
