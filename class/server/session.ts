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
import { redirect } from "next/navigation";

import { GATE, gateFor } from "@/features/access/domain/role-gate";
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
 * **Read-only, deliberately.** This is called from pages, and Next
 * forbids writing cookies from a Server Component. An earlier version
 * refreshed here and wrote the new pair back, which worked until the
 * first access token expired and then made every page a 500. Refreshing
 * is the proxy's job now (class/proxy.ts), which runs first and is
 * allowed to write — so by the time this reads the jar, the token in it
 * is already current.
 */
export async function currentViewer(): Promise<Viewer | null> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const authUser = await authUserFor(accessToken);
  if (!authUser) return null;

  const profile = await ensureProfile(authUser.id, authUser.email);
  return { profile, roles: await rolesOf(profile.id) };
}

/**
 * The single enforcement point for "nothing else in the app is
 * reachable" (01 §2).
 *
 * Every gated page and route calls this and nothing else decides it. The
 * decision itself is `gateFor`, which is pure and tested; what is here
 * is the redirect, which is the part a test would have to mock.
 *
 * It returns a Viewer rather than a boolean so that a caller physically
 * cannot forget to use the result — the profile it needs and the check
 * it must pass arrive together.
 */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await currentViewer();

  switch (gateFor(viewer?.roles ?? null)) {
    case GATE.SIGN_IN:
      redirect("/sign-in");
    // falls through to the redirect's never return
    case GATE.CHOOSE_ROLE:
      redirect("/choose-role");
    default:
      // gateFor only returns ALLOWED when a viewer exists.
      return viewer as Viewer;
  }
}
