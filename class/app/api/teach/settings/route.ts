import { NextResponse } from "next/server";

import { maySetUpSlots } from "@/features/access/domain/approval";
import { setBookingApproval } from "@/features/access/adapters/supabase/tutors";
import { requireViewer } from "@/server/session";

export async function POST(request: Request) {
  const { profile, roles } = await requireViewer();
  if (!maySetUpSlots(roles)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const form = await request.formData();
  await setBookingApproval(
    profile.id,
    form.get("requires_booking_approval") !== null,
  );

  return NextResponse.redirect(new URL("/class/teach", request.url), {
    status: 303,
  });
}
