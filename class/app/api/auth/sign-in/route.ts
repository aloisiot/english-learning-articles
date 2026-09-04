/**
 * Ask for a magic link. Sign-up and sign-in are the same act (01 §3).
 *
 * The response never says whether the address is known. That is not
 * politeness — an endpoint that answers differently for a registered
 * address is an account-enumeration oracle, and this one is unauthenticated.
 */
import { NextResponse } from "next/server";

import {
  callbackUrl,
  isPlausibleEmail,
  normaliseEmail,
  safeReturnTo,
} from "@/features/access/domain/sign-in";
import { sendSignInLink } from "@/features/access/adapters/supabase/identity";
import { publicOrigin } from "@/server/config";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = normaliseEmail(form.get("email"));
  const returnTo = safeReturnTo(form.get("return_to"));

  if (!isPlausibleEmail(email)) {
    return NextResponse.json(
      { ok: false, reason: "invalid_email" },
      { status: 400 },
    );
  }

  const sent = await sendSignInLink(
    email,
    callbackUrl(publicOrigin(), returnTo),
  );

  if (!sent.ok) {
    // Logged, not returned: the caller learns only that it was accepted.
    console.error("sign-in link failed:", sent.error);
  }

  return NextResponse.json({ ok: true });
}
