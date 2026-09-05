import { NextResponse } from "next/server";

import {
  decisionOutcome,
  isDecidable,
  mayDecide,
  type BookingStatus,
} from "@/features/scheduling/domain/booking";
import {
  bookingById,
  decideBooking,
} from "@/features/scheduling/adapters/supabase/bookings";
import { requireViewer } from "@/server/session";

export async function POST(request: Request) {
  const { profile } = await requireViewer();

  const form = await request.formData();
  const bookingId = form.get("booking_id");
  const confirmed = form.get("decision") === "confirm";

  const back = () =>
    NextResponse.redirect(new URL("/class/teach/requests", request.url), {
      status: 303,
    });

  if (typeof bookingId !== "string") return back();

  const booking = await bookingById(bookingId);
  if (!booking) return back();

  // Only the tutor whose slot it is, and only once.
  if (!mayDecide(booking.tutorId, profile.id)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  if (!isDecidable(booking.status as BookingStatus)) return back();

  const outcome = decisionOutcome(confirmed);
  await decideBooking(booking.id, booking.slotId, outcome.booking, outcome.slot);

  return back();
}
