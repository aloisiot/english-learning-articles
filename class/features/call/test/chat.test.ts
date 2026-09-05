import { describe, expect, it } from "vitest";

import {
  CHAT_MESSAGE_TYPE,
  MAX_CHAT_TEXT,
  buildChatPayload,
  parseChatPayload,
} from "../domain/chat";

describe("buildChatPayload", () => {
  it("tags the message so it cannot be read as another kind", () => {
    expect(buildChatPayload("hello")).toEqual({
      type: CHAT_MESSAGE_TYPE,
      text: "hello",
    });
  });

  it("trims, so a stray space is not sent as content", () => {
    expect(buildChatPayload("  hello  ")?.text).toBe("hello");
  });

  const nothingToSend: Array<[string, unknown]> = [
    ["an empty string", ""],
    ["only whitespace", "   \n\t "],
    ["undefined", undefined],
    ["null", null],
    ["a number", 7],
    ["an object", { text: "hello" }],
  ];

  it.each(nothingToSend)("returns null for %s", (_label, value) => {
    expect(buildChatPayload(value)).toBeNull();
  });

  it("accepts a message exactly at the limit", () => {
    expect(buildChatPayload("a".repeat(MAX_CHAT_TEXT))).not.toBeNull();
  });

  it("refuses a message past the limit rather than truncating it", () => {
    // Truncating would send something the sender did not write.
    expect(buildChatPayload("a".repeat(MAX_CHAT_TEXT + 1))).toBeNull();
  });
});

describe("parseChatPayload", () => {
  it("reads what buildChatPayload writes", () => {
    const payload = buildChatPayload("hello");

    expect(parseChatPayload(payload)).toBe("hello");
  });

  /*
    Everything below arrives from another participant's browser over
    sendAppMessage. None of it is guaranteed by the transport, so the
    whole point of this function is that it fails closed.
  */
  const rejected: Array<[string, unknown]> = [
    ["undefined", undefined],
    ["null", null],
    ["a string", "hello"],
    ["a number", 7],
    ["an array", [{ type: CHAT_MESSAGE_TYPE, text: "hello" }]],
    ["an object with no type", { text: "hello" }],
    ["another app-message kind", { type: "cursor", text: "hello" }],
    ["a non-string text", { type: CHAT_MESSAGE_TYPE, text: 7 }],
    ["a missing text", { type: CHAT_MESSAGE_TYPE }],
    ["an empty text", { type: CHAT_MESSAGE_TYPE, text: "" }],
    ["a whitespace-only text", { type: CHAT_MESSAGE_TYPE, text: "  " }],
    [
      "a text past the limit",
      { type: CHAT_MESSAGE_TYPE, text: "a".repeat(MAX_CHAT_TEXT + 1) },
    ],
  ];

  it.each(rejected)("returns null for %s", (_label, value) => {
    expect(parseChatPayload(value)).toBeNull();
  });

  it("ignores extra fields rather than passing them through", () => {
    // A peer cannot smuggle a name in: the display name is read from
    // Daily's participant record, and only the text survives this.
    const hostile = {
      type: CHAT_MESSAGE_TYPE,
      text: "hello",
      name: "The Teacher",
    };

    expect(parseChatPayload(hostile)).toBe("hello");
  });
});
