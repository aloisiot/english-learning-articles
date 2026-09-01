import { describe, expect, it } from "vitest";

import {
  GENERIC_SCREEN_SHARE_ERROR,
  describeScreenShareError,
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
