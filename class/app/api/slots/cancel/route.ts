import { NextResponse } from "next/server";

import { maySetUpSlots } from "@/features/access/domain/approval";
import { cancelSlot } from "@/features/scheduling/adapters/supabase/slots";
import { requireViewer } from "@/server/session";

export async function POST(request: Request) {
  const { profile, roles } = await requireViewer();
  if (!maySetUpSlots(roles)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const form = await request.formData();
  const slotId = form.get("slot_id");
  if (typeof slotId === "string") {
    // Scoped to this tutor in the query itself, so a forged slot id
    // belonging to someone else matches nothing.
    await cancelSlot(slotId, profile.id);
  }

  return NextResponse.redirect(new URL("/class/teach/slots", request.url), {
    status: 303,
  });
}
