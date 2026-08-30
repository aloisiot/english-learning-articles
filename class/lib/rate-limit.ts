/**
 * A sliding-window rate limiter, as a pure function over its own state.
 *
 * The admin page is a shared secret reachable from the internet, so the
 * secret has to be expensive to guess by volume as well as by length
 * (research/video-calls/07-two-app-architecture.md §7). This is that
 * limit, kept pure so the window arithmetic can be tested against a
 * supplied clock instead of a real one.
 *
 * State is passed in and a new state is returned rather than held in a
 * module-level variable, which is what makes it testable — and it also
 * makes the one real limitation obvious rather than hidden: the caller
 * holds the state, so on a serverless platform the limit is per warm
 * instance, not global. That is weak protection against a distributed
 * attacker and adequate protection against a script pointed at one URL.
 * A real limit needs somewhere shared to count, which phase 1 has
 * deliberately not got.
 */

/** Attempts allowed per window, per key. */
export const DEFAULT_LIMIT = 5;

/** Window length in seconds. */
export const DEFAULT_WINDOW_SECONDS = 60;

/** Epoch seconds of each attempt still inside the window, by key. */
export type RateLimitState = Map<string, number[]>;

export interface RateLimitOptions {
  limit?: number;
  windowSeconds?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the oldest attempt ages out; `0` when allowed. */
  retryAfter: number;
  state: RateLimitState;
}

/**
 * Record an attempt for `key` and say whether it is allowed.
 *
 * @param state previous state, or `undefined` to start fresh
 * @param key   what to count against — an IP, usually
 * @param now   epoch seconds
 */
export function rateLimit(
  state: RateLimitState | undefined,
  key: string,
  now: number,
  options: RateLimitOptions = {},
): RateLimitResult {
  const { limit = DEFAULT_LIMIT, windowSeconds = DEFAULT_WINDOW_SECONDS } =
    options;

  const cutoff = now - windowSeconds;
  const next: RateLimitState = new Map();

  // Carry forward only what is still inside the window. Dropping empty
  // keys as we go is what stops a long-lived instance accumulating one
  // entry per address that ever touched the page.
  for (const [existingKey, times] of state ?? new Map<string, number[]>()) {
    const live = times.filter((t: number) => t > cutoff);
    if (live.length > 0) next.set(existingKey, live);
  }

  const times = next.get(key) ?? [];

  if (times.length >= limit) {
    next.set(key, times);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((times[0] as number) - cutoff)),
      state: next,
    };
  }

  next.set(key, [...times, now]);
  return {
    allowed: true,
    remaining: limit - times.length - 1,
    retryAfter: 0,
    state: next,
  };
}
