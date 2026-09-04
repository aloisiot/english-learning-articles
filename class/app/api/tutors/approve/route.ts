import { NextResponse } from "next/server";

import {
  mayApproveTutors,
  shouldRecordApproval,
} from "@/features/access/domain/approval";
import {
  approveTutor,
  tutorSettings,
} from "@/features/access/adapters/supabase/tutors";
import { requireViewer } from "@/server/session";

export async function POST(request: Request) {
  const { profile, roles } = await requireViewer();

  // Authorisation in server code, before any query. RLS would not have
  // caught this: the app holds the service-role key (02 §3c).
  if (!mayApproveTutors(roles)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const form = await request.formData();
  const tutorId = form.get("tutor_id");
  if (typeof tutorId !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const settings = await tutorSettings(tutorId);
  if (shouldRecordApproval(settings)) {
    await approveTutor(tutorId, profile.id);
  }

  return NextResponse.redirect(new URL("/class/tutors", request.url), {
    status: 303,
  });
}
