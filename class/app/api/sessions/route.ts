/**
 * Record what happened, when a class ends.
 *
 * Append-only, and written from the browser that was in the room —
 * which is the only place that knows whether the other person actually
 * arrived. That makes it a report rather than an observation, so the
 * server re-derives everything it can: who the parties are and when the
 * class was scheduled come from the booking, not from the request body.
 * Only attendance and the real times are taken on trust, because only
 * the room saw them.
 */
import { NextResponse } from "next/server";

import { draftSession } from "@/features/scheduling/domain/session-record";
import { bookingById } from "@/features/scheduling/adapters/supabase/bookings";
import { recordSession } from "@/features/scheduling/adapters/supabase/sessions";
import { requireViewer } from "@/server/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { profile } = await requireViewer();

  let body: {
    bookingId?: unknown;
    studentArrived?: unknown;
    tutorArrived?: unknown;
    startedAt?: unknown;
    endedAt?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof body.bookingId !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const booking = await bookingById(body.bookingId);
  if (!booking) return NextResponse.json({ ok: false }, { status: 404 });

  // Only somebody who was actually in the class may report on it.
  const isParty =
    booking.studentId === profile.id || booking.tutorId === profile.id;
  if (!isParty) return NextResponse.json({ ok: false }, { status: 403 });

  const instant = (value: unknown): Date | null =>
    typeof value === "string" && !Number.isNaN(Date.parse(value))
      ? new Date(value)
      : null;

  await recordSession(
    draftSession({
      bookingId: booking.id,
      tutorId: booking.tutorId,
      studentId: booking.studentId,
      tutorName: booking.tutorName,
      studentName: booking.studentName,
      scheduledStart: booking.startsAt,
      attendance: {
        studentArrived: body.studentArrived === true,
        tutorArrived: body.tutorArrived === true,
        startedAt: instant(body.startedAt),
        endedAt: instant(body.endedAt),
      },
    }),
  );

  return NextResponse.json({ ok: true });
}
