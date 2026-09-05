import { describe, expect, it } from "vitest";

import {
  DAILY_API_BASE,
  DAILY_ERROR,
  buildCreateRoomRequest,
  buildMeetingTokenRequest,
  buildRoomUrl,
  interpretCreateRoomResponse,
  interpretMeetingTokenResponse,
} from "../domain/daily-request";

const API_KEY = "daily-api-key-for-tests";
const ROOM = "the-deal-that-ended-4f2a9c1b83";
const EXPIRES_AT = 1_800_002_400;

describe("buildCreateRoomRequest", () => {
  const request = buildCreateRoomRequest({
    roomName: ROOM,
    expiresAt: EXPIRES_AT,
    apiKey: API_KEY,
  });
  const body = JSON.parse(request.body) as {
    name: string;
    privacy: string;
    properties: Record<string, unknown>;
  };

  it("posts to the rooms endpoint with the API key", () => {
    expect(request.url).toBe(`${DAILY_API_BASE}/rooms`);
    expect(request.method).toBe("POST");
    expect(request.headers.authorization).toBe(`Bearer ${API_KEY}`);
    expect(request.headers["content-type"]).toBe("application/json");
  });

  it("names the room and keeps it private", () => {
    expect(body.name).toBe(ROOM);
    expect(body.privacy).toBe("private");
  });

  // The mitigation research/video-calls/03 §6 asked for: Daily has no hard
  // spend cap, so a room nobody closes has to close itself.
  it("sets an expiry that ejects anyone still in the room", () => {
    expect(body.properties.exp).toBe(EXPIRES_AT);
    expect(body.properties.eject_at_room_exp).toBe(true);
  });

  it("allows screen sharing, which the room and not the browser gates", () => {
    // With this false, daily-js refuses locally — "not starting
    // screenshare: enable_screenshare is false" — and the browser is
    // never asked, so no permission prompt appears to explain it.
    expect(body.properties.enable_screenshare).toBe(true);
  });

  it("leaves Daily's own chat off, since this app does not use it", () => {
    // Chat here is sendAppMessage, which this property does not govern.
    expect(body.properties.enable_chat).toBe(false);
  });

  it("keeps the room to the two people a class has", () => {
    expect(body.properties.max_participants).toBe(2);
  });

  const badKeys: Array<[string, unknown]> = [
    ["a missing key", undefined],
    ["an empty key", ""],
    ["a non-string key", 1234],
  ];

  it.each(badKeys)(
    "throws for %s rather than sending an unauthenticated request",
    (_label, apiKey) => {
      expect(() =>
        buildCreateRoomRequest({
          roomName: ROOM,
          expiresAt: EXPIRES_AT,
          apiKey,
        }),
      ).toThrow(TypeError);
    },
  );
});

describe("buildMeetingTokenRequest", () => {
  function properties(isOwner?: boolean) {
    const request = buildMeetingTokenRequest({
      roomName: ROOM,
      expiresAt: EXPIRES_AT,
      apiKey: API_KEY,
      ...(isOwner === undefined ? {} : { isOwner }),
    });
    return {
      request,
      body: JSON.parse(request.body) as {
        properties: Record<string, unknown>;
      },
    };
  }

  it("scopes the token to one room and one expiry", () => {
    const { request, body } = properties();

    expect(request.url).toBe(`${DAILY_API_BASE}/meeting-tokens`);
    expect(request.method).toBe("POST");
    expect(body.properties.room_name).toBe(ROOM);
    expect(body.properties.exp).toBe(EXPIRES_AT);
  });

  it("mints a non-owner token by default", () => {
    expect(properties().body.properties.is_owner).toBe(false);
  });

  it("mints an owner token when asked", () => {
    expect(properties(true).body.properties.is_owner).toBe(true);
  });

  it("throws without an API key", () => {
    expect(() =>
      buildMeetingTokenRequest({
        roomName: ROOM,
        expiresAt: EXPIRES_AT,
        apiKey: undefined,
      }),
    ).toThrow(TypeError);
  });
});

describe("buildRoomUrl", () => {
  it("builds the public join URL for a domain and room", () => {
    expect(buildRoomUrl("my-domain", ROOM)).toBe(
      `https://my-domain.daily.co/${ROOM}`,
    );
  });

  const badDomains: Array<[string, unknown]> = [
    ["a missing domain", undefined],
    ["an empty domain", ""],
    ["a non-string domain", 42],
  ];

  it.each(badDomains)("throws for %s", (_label, domain) => {
    expect(() => buildRoomUrl(domain, ROOM)).toThrow(TypeError);
  });
});

describe("interpretCreateRoomResponse", () => {
  it("treats a fresh room as created", () => {
    expect(interpretCreateRoomResponse(200, { name: ROOM })).toEqual({
      ok: true,
      created: true,
    });
  });

  // Rooms are derived from the link rather than stored, so the second
  // person to join necessarily finds the first person's room already
  // there. That is the normal path, not an error.
  it("treats an existing room as success", () => {
    expect(
      interpretCreateRoomResponse(400, {
        error: "invalid-request-error",
        info: `a room named ${ROOM} already exists`,
      }),
    ).toEqual({ ok: true, created: false });
  });

  const unauthorized: Array<[string, number, unknown]> = [
    ["a 401", 401, {}],
    ["a 403", 403, {}],
  ];

  it.each(unauthorized)("reports %s as unauthorized", (_label, status, body) => {
    expect(interpretCreateRoomResponse(status, body)).toEqual({
      ok: false,
      reason: DAILY_ERROR.UNAUTHORIZED,
    });
  });

  const unexpected: Array<[string, number, unknown]> = [
    ["a 400 with an unrelated message", 400, { info: "name is too long" }],
    ["a 400 with no info at all", 400, {}],
    ["a 400 with a non-string info", 400, { info: 5 }],
    ["a 500", 500, {}],
    ["a missing body", 500, undefined],
    ["a null body", 500, null],
  ];

  it.each(unexpected)("fails closed on %s", (_label, status, body) => {
    expect(interpretCreateRoomResponse(status, body)).toEqual({
      ok: false,
      reason: DAILY_ERROR.UNEXPECTED,
    });
  });
});

describe("interpretMeetingTokenResponse", () => {
  it("returns the minted token", () => {
    expect(interpretMeetingTokenResponse(200, { token: "abc.def.ghi" })).toEqual(
      { ok: true, token: "abc.def.ghi" },
    );
  });

  const unauthorized: Array<[string, number, unknown]> = [
    ["a 401", 401, {}],
    ["a 403", 403, {}],
  ];

  it.each(unauthorized)("reports %s as unauthorized", (_label, status, body) => {
    expect(interpretMeetingTokenResponse(status, body)).toEqual({
      ok: false,
      reason: DAILY_ERROR.UNAUTHORIZED,
    });
  });

  const unexpected: Array<[string, number, unknown]> = [
    ["a 200 with no token", 200, {}],
    ["a 200 with an empty token", 200, { token: "" }],
    ["a 200 with a non-string token", 200, { token: 5 }],
    ["a 200 with no body", 200, undefined],
    ["a 200 with a null body", 200, null],
    ["a 500", 500, {}],
  ];

  it.each(unexpected)("fails closed on %s", (_label, status, body) => {
    expect(interpretMeetingTokenResponse(status, body)).toEqual({
      ok: false,
      reason: DAILY_ERROR.UNEXPECTED,
    });
  });
});
