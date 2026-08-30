/**
 * Turn a signed class link into a Daily room and a token to enter it.
 *
 * The link is verified again here rather than trusted from the page that
 * rendered the button: the page's check decides what a visitor is shown,
 * this one decides what they are given, and only the second is a
 * security boundary.
 */
import { verifyToken } from "@/lib/link.js";
import { buildRoomUrl } from "@/lib/daily-request.js";
import { dailyApiKey, dailyDomain, linkSecret } from "@/server/config.js";
import { ensureRoom, mintMeetingToken } from "@/server/daily.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let token;
  try {
    ({ token } = await request.json());
  } catch {
    return Response.json({ error: "malformed" }, { status: 400 });
  }

  const verified = verifyToken(token, linkSecret());
  if (!verified.ok) {
    // One status for every rejection: a caller learning *why* a link
    // failed learns something about links it does not hold.
    return Response.json({ error: "not-valid" }, { status: 403 });
  }

  const { room, exp } = verified.payload;
  const apiKey = dailyApiKey();

  // The room dies when the link does, which is what stops a forgotten
  // room billing quietly (research/video-calls/03 §6).
  const created = await ensureRoom({
    roomName: room,
    expiresAt: exp,
    apiKey,
  });
  if (!created.ok) {
    return Response.json({ error: "room-unavailable" }, { status: 502 });
  }

  const minted = await mintMeetingToken({
    roomName: room,
    expiresAt: exp,
    apiKey,
  });
  if (!minted.ok) {
    return Response.json({ error: "token-unavailable" }, { status: 502 });
  }

  return Response.json({
    roomUrl: buildRoomUrl(dailyDomain(), room),
    meetingToken: minted.token,
  });
}
