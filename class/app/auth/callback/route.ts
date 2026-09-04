/**
 * Where a clicked magic link lands.
 *
 * The token hash arrives in the query string, which is why the email
 * template has to use {{ .TokenHash }}: the implicit flow puts it in the
 * URL fragment, and a fragment never reaches a server.
 */
import { NextResponse } from "next/server";

import {
  SIGN_IN_FAILURE,
  classifySignInFailure,
  safeReturnTo,
} from "@/features/access/domain/sign-in";
import { verifyMagicLink } from "@/features/access/adapters/supabase/identity";
import { setSessionCookies } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const returnTo = safeReturnTo(url.searchParams.get("return_to"));

  const failed = (reason: string) =>
    NextResponse.redirect(
      new URL(`/class/sign-in?problem=${reason}`, url.origin),
    );

  if (!tokenHash) return failed(SIGN_IN_FAILURE.MALFORMED);

  const verified = await verifyMagicLink(tokenHash);
  if (!verified.ok) return failed(classifySignInFailure(verified.error));

  await setSessionCookies(verified.tokens);

  return NextResponse.redirect(new URL(`/class${returnTo}`, url.origin));
}
