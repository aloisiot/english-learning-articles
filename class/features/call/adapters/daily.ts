/**
 * The only place in the app that talks to Daily over the network.
 *
 * Everything interesting about these calls — which room properties are
 * set, what counts as success — lives in the pure features/call/domain/daily-request.ts
 * and is tested there. What is left here is the `fetch` itself, which is
 * exactly the part a unit test could only assert against its own mock
 * (research/video-calls/08-implementation-plan.md, "What unit tests can
 * and cannot cover").
 */
import {
  buildCreateRoomRequest,
  buildMeetingTokenRequest,
  interpretCreateRoomResponse,
  interpretMeetingTokenResponse,
  type CreateRoomInput,
  type CreateRoomResult,
  type DailyRequest,
  type MeetingTokenInput,
  type MeetingTokenResult,
} from "@/features/call/domain/daily-request";

async function send({
  url,
  method,
  headers,
  body,
}: DailyRequest): Promise<{ status: number; body: unknown }> {
  const response = await fetch(url, { method, headers, body });

  // Daily answers JSON on both success and error, but a gateway in front
  // of it may not. A non-JSON body is passed on as undefined and the
  // interpreters treat it as unexpected rather than throwing here.
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    parsed = undefined;
  }

  return { status: response.status, body: parsed };
}

/**
 * Create the class's room if it is not already there.
 *
 * Lazy by design: with no database, the room's existence *is* the record
 * that a class started, and the second participant to arrive finds the
 * first one's room.
 */
export async function ensureRoom(
  input: CreateRoomInput,
): Promise<CreateRoomResult> {
  const { status, body } = await send(buildCreateRoomRequest(input));
  return interpretCreateRoomResponse(status, body);
}

/** Mint the short-lived token that admits one participant to one room. */
export async function mintMeetingToken(
  input: MeetingTokenInput,
): Promise<MeetingTokenResult> {
  const { status, body } = await send(buildMeetingTokenRequest(input));
  return interpretMeetingTokenResponse(status, body);
}
