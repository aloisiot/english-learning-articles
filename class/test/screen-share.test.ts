import { describe, expect, it } from "vitest";

import {
  GENERIC_SCREEN_SHARE_ERROR,
  describeScreenShareError,
  shouldYieldScreenShare,
  type LocalScreenShare,
} from "../lib/screen-share";

describe("describeScreenShareError", () => {
  it("explains the failure that had no UI at all", () => {
    // The message daily-js actually produced, verbatim.
    const described = describeScreenShareError(
      "not starting screenshare: enable_screenshare is false",
    );

    expect(described).not.toBeNull();
    expect(described).toContain("turned off for this class room");
  });

  it("explains it even when the message also looks like a cancellation", () => {
    // A configuration fault is not a choice, so it outranks the silence
    // rule however the rest of the message is worded.
    expect(
      describeScreenShareError("permission denied: enable_screenshare is false"),
    ).toContain("turned off for this class room");
  });

  const cancellations: Array<[string, string]> = [
    ["a denied permission", "NotAllowedError: Permission denied"],
    ["a bare NotAllowedError", "NotAllowedError"],
    ["an explicit cancel", "The user cancelled the request"],
    ["an abort", "AbortError: The operation was aborted"],
    ["a dismissed picker", "The picker was dismissed"],
    ["Safari's phrasing", "The request is not allowed by the user agent"],
  ];

  it.each(cancellations)("says nothing about %s", (_label, message) => {
    // Someone who thought better of sharing does not need to be told
    // they failed at something.
    expect(describeScreenShareError(message)).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(describeScreenShareError("PERMISSION DENIED")).toBeNull();
  });

  it("names an unsupported browser", () => {
    expect(describeScreenShareError("getDisplayMedia is not supported")).toBe(
      "This browser cannot share a screen.",
    );
  });

  const unknown: Array<[string, unknown]> = [
    ["an unrecognised message", "something else went wrong"],
    ["an empty message", ""],
    ["only whitespace", "   "],
    ["undefined", undefined],
    ["null", null],
    ["a number", 500],
    ["an object", { errorMsg: "nope" }],
  ];

  it.each(unknown)("falls back to a visible message for %s", (_l, message) => {
    // Failing towards silence would recreate the original bug, so
    // anything unrecognised is still shown.
    expect(describeScreenShareError(message)).toBe(GENERIC_SCREEN_SHARE_ERROR);
  });
});

describe("shouldYieldScreenShare", () => {
  const ME = "session-aaa";
  const THEM = "session-zzz";
  const NOW = 1_800_000_000_000;

  const local = (over: Partial<LocalScreenShare> = {}): LocalScreenShare => ({
    localSessionId: ME,
    sharing: true,
    startedAt: NOW - 60_000,
    knownAtStart: [],
    ...over,
  });

  it("does nothing when this client is not sharing", () => {
    expect(
      shouldYieldScreenShare(local({ sharing: false }), [THEM], NOW),
    ).toBe(false);
  });

  it("does nothing when nobody else is sharing", () => {
    expect(shouldYieldScreenShare(local(), [], NOW)).toBe(false);
  });

  it("yields to a share that started after this one", () => {
    // The case the whole rule exists for: A is up, B starts, A stops.
    expect(shouldYieldScreenShare(local(), [THEM], NOW)).toBe(true);
  });

  it("does not yield to a share that was already up", () => {
    // The other half of the same moment, seen from B: the only remote
    // share predates its own, so B keeps presenting.
    expect(
      shouldYieldScreenShare(local({ knownAtStart: [THEM] }), [THEM], NOW),
    ).toBe(false);
  });

  it("leaves exactly one sharer when two start together", () => {
    // Neither can tell who was first, so both would yield and nobody
    // would be presenting. Session ids break it identically on both.
    const justNow = NOW - 200;
    const lower = shouldYieldScreenShare(
      { localSessionId: ME, sharing: true, startedAt: justNow, knownAtStart: [] },
      [THEM],
      NOW,
    );
    const higher = shouldYieldScreenShare(
      { localSessionId: THEM, sharing: true, startedAt: justNow, knownAtStart: [] },
      [ME],
      NOW,
    );

    expect([lower, higher]).toEqual([true, false]);
  });

  it("applies the plain rule once the window has passed", () => {
    // Outside the window the newcomer is unambiguous, so the id
    // tie-break must not keep a stale share alive.
    expect(
      shouldYieldScreenShare(
        { localSessionId: THEM, sharing: true, startedAt: NOW - 5_000, knownAtStart: [] },
        [ME],
        NOW,
      ),
    ).toBe(true);
  });

  it("yields when the start time is unusable", () => {
    // Unknown timing falls back to the plain rule rather than guessing.
    for (const startedAt of [null, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(shouldYieldScreenShare(local({ startedAt }), [THEM], NOW)).toBe(
        true,
      );
    }
  });

  it("ignores remote shares it already knew about while yielding to a new one", () => {
    expect(
      shouldYieldScreenShare(
        local({ knownAtStart: ["session-old"] }),
        ["session-old", THEM],
        NOW,
      ),
    ).toBe(true);
  });
});
