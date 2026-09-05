import { NextResponse } from "next/server";

import { maySetUpSlots } from "@/features/access/domain/approval";
import {
  DEFAULT_DURATION_MINUTES,
  instantFromLocal,
  isOpenable,
} from "@/features/scheduling/domain/slot";
import { openSlot } from "@/features/scheduling/adapters/supabase/slots";
import { requireViewer } from "@/server/session";

export async function POST(request: Request) {
  const { profile, roles } = await requireViewer();
  if (!maySetUpSlots(roles)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const form = await request.formData();
  const local = String(form.get("local_datetime") ?? "");
  const duration =
    Number(form.get("duration_minutes")) || DEFAULT_DURATION_MINUTES;

  const startsAt = instantFromLocal(local, profile.timezone);
  const back = (problem: string) =>
    NextResponse.redirect(
      new URL(`/class/teach/slots?problem=${problem}`, request.url),
      { status: 303 },
    );

  if (!startsAt) return back("unreadable");
  if (!isOpenable(startsAt, new Date())) return back("past");

  const opened = await openSlot(profile.id, startsAt, duration);
  if (!opened.ok) return back("duplicate");

  return NextResponse.redirect(new URL("/class/teach/slots", request.url), {
    status: 303,
  });
}
