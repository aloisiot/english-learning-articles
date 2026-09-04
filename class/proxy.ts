/**
 * Keeping the session alive, in the one place that is allowed to.
 *
 * This is Next 16's `proxy` convention, which replaced `middleware` —
 * same position in the request, renamed because "middleware" kept being
 * read as the Express kind. It runs on the Node.js runtime, which is not
 * configurable here and happens to be what the Supabase client wants.
 *
 * Next only permits cookies to be written from a Route Handler, a Server
 * Action, or here. Refreshing used to happen inside
 * currentViewer(), which pages call — so the first time an access token
 * expired, every page threw "Cookies can only be modified in a Server
 * Action or Route Handler" and returned a 500. It worked for exactly one
 * token lifetime, which is the worst possible way for it to be wrong.
 *
 * So refresh lives here. The proxy runs before the page, can write to
 * the response, and can also hand the refreshed cookie to the request
 * the page is about to see — which is why the request's own cookie jar
 * is updated as well as the response's. Without that, the page would
 * render this request with the token that was already dead.
 *
 * The decision to refresh is taken locally, by reading the token's own
 * expiry, so this does not put a network round trip in front of every
 * page. See needsRefresh.
 */
import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearedCookie,
  isSecureOrigin,
  needsRefresh,
  sessionCookie,
} from "@/features/access/domain/session";
import { refreshSession } from "@/features/access/adapters/supabase/identity";
import { publicOrigin } from "@/server/config";

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Nobody is signed in, or the token is still good. Either way, nothing
  // to do — and no call to the provider.
  if (!refreshToken || !needsRefresh(accessToken, new Date())) {
    return NextResponse.next();
  }

  const secure = isSecureOrigin(publicOrigin());
  const refreshed = await refreshSession(refreshToken);

  if (!refreshed) {
    // The refresh token is spent or revoked. Clearing both cookies turns
    // "signed in with a dead session" into "signed out", which the gate
    // already knows how to handle. Leaving them would loop: every request
    // would try to refresh, fail, and be treated as signed in anyway.
    const response = NextResponse.next();
    const cleared = clearedCookie(secure);
    response.cookies.set(ACCESS_COOKIE, "", cleared);
    response.cookies.set(REFRESH_COOKIE, "", cleared);
    return response;
  }

  // The page about to render reads the request, not the response, so the
  // new tokens have to be put on both.
  request.cookies.set(ACCESS_COOKIE, refreshed.accessToken);
  request.cookies.set(REFRESH_COOKIE, refreshed.refreshToken);

  const response = NextResponse.next({ request });
  const options = sessionCookie(secure);
  response.cookies.set(ACCESS_COOKIE, refreshed.accessToken, options);
  response.cookies.set(REFRESH_COOKIE, refreshed.refreshToken, options);

  return response;
}

export const config = {
  // Everything except Next's own assets and the favicon. Refresh has to
  // happen on page loads, not only on the API routes, because a page is
  // usually what a returning user asks for first.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
