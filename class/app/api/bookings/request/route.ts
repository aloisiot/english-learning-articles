import { NextResponse } from "next/server";

import { tutorSettings } from "@/features/access/adapters/supabase/tutors";
import { isBookable, bookingStartsPending } from "@/features/access/domain/approval";
import { mayRequest, requestOutcome } from "@/features/scheduling/domain/booking";
import { requestBooking } from "@/features/scheduling/adapters/supabase/bookings";
import { slotById } from "@/features/scheduling/adapters/supabase/slots";
import { isTakeable, type SlotStatus } from "@/features/scheduling/domain/slot";
import { requireViewer } from "@/server/session";

export async function POST(request: Request) {
  const { profile } = await requireViewer();

  const form = await request.formData();
  const slotId = form.get("slot_id");
  const back = (problem: string) =>
    NextResponse.redirect(new URL(`/class/book?problem=${problem}`, request.url), {
      status: 303,
    });

  if (typeof slotId !== "string") return back("gone");

  const slot = await slotById(slotId);
  if (!slot) return back("gone");
  if (!isTakeable(slot.status as SlotStatus)) return back("taken");
  if (!mayRequest(slot.status as SlotStatus)) return back("taken");

  // The visibility gate, re-checked server-side: the listing filtered on
  // it, but the slot id came from the client.
  const settings = await tutorSettings(slot.tutorId);
  if (!settings || !isBookable(settings)) return back("gone");

  const outcome = requestOutcome(bookingStartsPending(settings));
  const claimed = await requestBooking(
    slotId,
    profile.id,
    outcome.booking,
    outcome.slot,
  );

  if (!claimed.ok) return back("taken");

  return NextResponse.redirect(new URL("/class/dashboard", request.url), {
    status: 303,
  });
}
