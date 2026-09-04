import { NextResponse } from "next/server";

import {
  cancellationOutcome,
  mayCancel,
  type BookingStatus,
} from "@/features/scheduling/domain/booking";
import {
  bookingById,
  cancelBooking,
} from "@/features/scheduling/adapters/supabase/bookings";
import { requireViewer } from "@/server/session";

export async function POST(request: Request) {
  const { profile } = await requireViewer();

  const form = await request.formData();
  const bookingId = form.get("booking_id");

  const back = () =>
    NextResponse.redirect(new URL("/class/dashboard", request.url), {
      status: 303,
    });

  if (typeof bookingId !== "string") return back();

  const booking = await bookingById(bookingId);
  if (!booking) return back();

  // Either party may walk away, and nobody else.
  const isParty =
    booking.studentId === profile.id || booking.tutorId === profile.id;
  if (!isParty) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  if (!mayCancel(booking.status as BookingStatus, booking.startsAt, new Date())) {
    return back();
  }

  await cancelBooking(booking.id, booking.slotId, cancellationOutcome().slot);

  return back();
}
