/**
 * The Daily REST calls phase 3 makes, as data rather than as requests.
 *
 * Building the request and interpreting the response are pure functions
 * here; the module that actually calls `fetch` (class/server/daily.ts)
 * holds nothing but the I/O. That split is what lets the interesting
 * parts — which room properties are set, and what counts as success —
 * be asserted without a network or a mock of one.
 *
 * **Unverified against Daily's API reference.** The response shapes below
 * are the documented ones as understood at the time of writing, and the
 * "room already exists" case in particular is inferred rather than
 * observed (register item 6 in research/video-calls/09-sources.md). They
 * are written to fail closed: anything not recognised is an error, not a
 * silent success.
 */

export const DAILY_API_BASE = "https://api.daily.co/v1";

export const DAILY_ERROR = {
  ALREADY_EXISTS: "already-exists",
  UNAUTHORIZED: "unauthorized",
  UNEXPECTED: "unexpected",
} as const;

export type DailyErrorReason = (typeof DAILY_ERROR)[keyof typeof DAILY_ERROR];

/** A request described as data, for class/server/daily.ts to send. */
export interface DailyRequest {
  url: string;
  method: "POST";
  headers: Record<string, string>;
  body: string;
}

export type CreateRoomResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: DailyErrorReason };

export type MeetingTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: DailyErrorReason };

export interface CreateRoomInput {
  roomName: string;
  expiresAt: number;
  apiKey: unknown;
}

export interface MeetingTokenInput extends CreateRoomInput {
  isOwner?: boolean;
}

function authHeaders(apiKey: unknown): Record<string, string> {
  if (typeof apiKey !== "string" || apiKey === "") {
    throw new TypeError("a Daily API key is required");
  }
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };
}

/**
 * The public URL a participant joins, for a room this app did not just
 * create and so has no `url` from. Daily serves every room of a domain
 * at `https://<domain>.daily.co/<room>`.
 */
export function buildRoomUrl(domain: unknown, roomName: string): string {
  if (typeof domain !== "string" || domain === "") {
    throw new TypeError("a Daily domain is required");
  }
  return `https://${domain}.daily.co/${roomName}`;
}

/**
 * Create the class's room, lazily, on the first join.
 *
 * `exp` is the mitigation research/video-calls/03 §6 asked for: Daily has
 * no hard spend cap, so a room that is never explicitly closed must be
 * able to close itself. `eject_at_room_exp` makes that binding on
 * participants rather than advisory.
 *
 * Everything else is off. Phase 3 is a call that connects and nothing
 * more — chat and screen sharing arrive in phase 5, and turning them on
 * early would mean shipping UI this phase deliberately excludes.
 */
export function buildCreateRoomRequest({
  roomName,
  expiresAt,
  apiKey,
}: CreateRoomInput): DailyRequest {
  return {
    url: `${DAILY_API_BASE}/rooms`,
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        exp: expiresAt,
        eject_at_room_exp: true,
        max_participants: 2,
        enable_chat: false,
        enable_screenshare: false,
      },
    }),
  };
}

/**
 * Mint the short-lived token that admits one participant to one room.
 *
 * The room is private, so this token is the only way in — which is what
 * makes a leaked Daily room URL useless on its own.
 */
export function buildMeetingTokenRequest({
  roomName,
  expiresAt,
  apiKey,
  isOwner = false,
}: MeetingTokenInput): DailyRequest {
  return {
    url: `${DAILY_API_BASE}/meeting-tokens`,
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        exp: expiresAt,
        is_owner: isOwner,
      },
    }),
  };
}

/**
 * Classify a room-creation response.
 *
 * A room that already exists is a success, not a failure: rooms are
 * derived from the link rather than stored, so the second person to join
 * a class necessarily finds the first person's room already there.
 */
export function interpretCreateRoomResponse(
  status: number,
  body: unknown,
): CreateRoomResult {
  if (status === 200) return { ok: true, created: true };

  const info = (body as { info?: unknown } | null | undefined)?.info;
  if (status === 400 && typeof info === "string") {
    if (/already exists/i.test(info)) {
      return { ok: true, created: false };
    }
  }

  if (status === 401 || status === 403) {
    return { ok: false, reason: DAILY_ERROR.UNAUTHORIZED };
  }

  return { ok: false, reason: DAILY_ERROR.UNEXPECTED };
}

/** Pull the token out of a meeting-token response, or say why not. */
export function interpretMeetingTokenResponse(
  status: number,
  body: unknown,
): MeetingTokenResult {
  const token = (body as { token?: unknown } | null | undefined)?.token;
  if (status === 200 && typeof token === "string" && token !== "") {
    return { ok: true, token };
  }

  if (status === 401 || status === 403) {
    return { ok: false, reason: DAILY_ERROR.UNAUTHORIZED };
  }

  return { ok: false, reason: DAILY_ERROR.UNEXPECTED };
}
