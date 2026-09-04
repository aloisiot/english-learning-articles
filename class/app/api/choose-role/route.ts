/**
 * The gate's only write.
 *
 * Owner is not accepted here — see isSelfAssignable. A self-granted owner
 * role would let a stranger approve themselves as a tutor, which is the
 * one privilege boundary the platform has.
 */
import { NextResponse } from "next/server";

import { isSelfAssignable } from "@/features/access/domain/role-gate";
import { grantRole } from "@/features/access/adapters/supabase/identity";
import { ensureTutorSettings } from "@/features/access/adapters/supabase/tutors";
import { currentViewer } from "@/server/session";

export async function POST(request: Request) {
  const viewer = await currentViewer();
  if (!viewer) {
    return NextResponse.redirect(new URL("/class/sign-in", request.url), {
      status: 303,
    });
  }

  const form = await request.formData();
  const role = form.get("role");

  if (!isSelfAssignable(role)) {
    return NextResponse.redirect(new URL("/class/choose-role", request.url), {
      status: 303,
    });
  }

  await grantRole(viewer.profile.id, role);

  // A tutor with no settings row has nothing to edit and nothing for the
  // owner to approve, so the row is part of becoming a tutor rather than
  // something created lazily on first visit to a settings page.
  if (role === "tutor") await ensureTutorSettings(viewer.profile.id);

  return NextResponse.redirect(new URL("/class/dashboard", request.url), {
    status: 303,
  });
}
