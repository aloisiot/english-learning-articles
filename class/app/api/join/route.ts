/**
 * Get into a class: a Daily room, and a token to enter it.
 *
 * **Two ways in, and both stay.** 04 §5 predicted this shape exactly.
 *
 * A *booking* is the normal path now that accounts exist. The endpoint
 * asks whether this logged-in person is party to a confirmed booking
 * whose slot starts about now — which is what makes attendance a fact
 * rather than a guess, and is the reason the session record and accounts
 * had to arrive together.
 *
 * A *signed link* remains the only way to run a class for someone
 * without an account: a trial lesson with a tutor being courted from
 * another platform, which is this platform's founding use case. It is
 * not deprecated and should not be deleted.
 *
 * Whichever way in, the proof is re-checked here rather than trusted
 * from the page that rendered the button: the page's check decides what
 * a visitor is *shown*, this one decides what they are *given*, and only
 * the second is a security boundary.
 */
import { buildRoomUrl } from "@/features/call/domain/daily-request";
import { verifyToken } from "@/features/access/domain/link";
import { classWindow, deriveRoomName } from "@/features/scheduling/domain/room";
import { mayJoin } from "@/features/scheduling/domain/join-window";
import { bookingById } from "@/features/scheduling/adapters/supabase/bookings";
import { dailyApiKey, dailyDomain, linkSecret } from "@/server/config";
import { ensureRoom, mintMeetingToken } from "@/features/call/adapters/daily";
import { currentViewer } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: { token?: unknown; bookingId?: unknown };
  try {
    body = (await request.json()) as { token?: unknown; bookingId?: unknown };
  } catch {
    return Response.json({ error: "malformed" }, { status: 400 });
  }

  const admitted =
    typeof body.bookingId === "string"
      ? await admitByBooking(body.bookingId)
      : admitByLink(body.token);

  const resolved = await admitted;
  if (!resolved.ok) {
    // One status for every rejection, on both paths: a caller learning
    // *why* it failed learns something about links or bookings it does
    // not hold.
    return Response.json({ error: "not-valid" }, { status: 403 });
  }

  const { room, exp } = resolved;
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

type Admission = { ok: true; room: string; exp: number } | { ok: false };

/** The signed link. Unchanged, and staying. */
function admitByLink(token: unknown): Admission {
  const verified = verifyToken(token, linkSecret());
  if (!verified.ok) return { ok: false };

  return { ok: true, room: verified.payload.room, exp: verified.payload.exp };
}

/**
 * The booking. The session check sits exactly where the signature check
 * sits on the other path, which is 04 §5's "the token path survives with
 * a session check where the signature check is" read the other way
 * round.
 *
 * The room name is derived rather than stored, by the same function the
 * signed links already use, so a class has one room whichever way its
 * two participants got in.
 */
async function admitByBooking(bookingId: string): Promise<Admission> {
  const viewer = await currentViewer();
  if (!viewer) return { ok: false };

  const booking = await bookingById(bookingId);
  if (!booking) return { ok: false };

  const decision = mayJoin(
    {
      status: booking.status,
      studentId: booking.studentId,
      tutorId: booking.tutorId,
      startsAt: booking.startsAt,
      durationMinutes: booking.durationMinutes,
    },
    viewer.profile.id,
    new Date(),
  );
  if (!decision.ok) return { ok: false };

  const startsAtSeconds = Math.floor(booking.startsAt.getTime() / 1000);
  const { expiresAt } = classWindow({
    startsAt: startsAtSeconds,
    durationMinutes: booking.durationMinutes,
  });

  return {
    ok: true,
    room: deriveRoomName({ slug: booking.id, startsAt: startsAtSeconds }),
    exp: expiresAt,
  };
}
