/**
 * Who is making this request.
 *
 * The one place route handlers ask that question, so that no route
 * invents its own answer. It is deliberately not in features/access:
 * every feature needs it, which is the same reason config.ts is here.
 *
 * Authorisation is *not* here. This says who someone is; whether they
 * may do a thing is a domain decision, taken by the caller against
 * rules in features/*​/domain. Conflating the two is how RLS ends up
 * looking like the security model (02 §3c).
 */
import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearedCookie,
  isSecureOrigin,
  sessionCookie,
} from "@/features/access/domain/session";
import {
  authUserFor,
  ensureProfile,
  refreshSession,
  rolesOf,
} from "@/features/access/adapters/supabase/identity";
import { publicOrigin } from "@/server/config";
import type { Profile, Role } from "@/server/ports";

export interface Viewer {
  profile: Profile;
  roles: ReadonlySet<Role>;
}

export async function setSessionCookies(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  const options = sessionCookie(isSecureOrigin(publicOrigin()));
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, tokens.accessToken, options);
  jar.set(REFRESH_COOKIE, tokens.refreshToken, options);
}

export async function clearSessionCookies(): Promise<void> {
  const options = clearedCookie(isSecureOrigin(publicOrigin()));
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, "", options);
  jar.set(REFRESH_COOKIE, "", options);
}

/**
 * The signed-in viewer, or null.
 *
 * Null is an ordinary answer, not an error: most routes are reachable
 * while signed out, and the role gate exists precisely because "signed
 * in with nothing chosen" is a state a profile can sit in indefinitely.
 *
 * The access token is short-lived and the session is a month, so an
 * expired access token is the normal case rather than a failure. It is
 * refreshed silently and the new pair written back.
 */
export async function currentViewer(): Promise<Viewer | null> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;

  let authUser = accessToken ? await authUserFor(accessToken) : null;

  if (!authUser && refreshToken) {
    const refreshed = await refreshSession(refreshToken);
    if (refreshed) {
      await setSessionCookies(refreshed);
      authUser = await authUserFor(refreshed.accessToken);
    }
  }

  if (!authUser) return null;

  const profile = await ensureProfile(authUser.id, authUser.email);
  return { profile, roles: await rolesOf(profile.id) };
}
