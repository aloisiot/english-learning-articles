/**
 * Supabase, on the far side of the Identity port.
 *
 * Thin on purpose: every branch worth arguing about lives in
 * features/access/domain/. What is here is the network call and the
 * shape change, and both are things a test would have to mock — which is
 * the signal that they are the right things to have left out of the
 * domain rather than the wrong things to leave untested.
 */
import type { VerificationType } from "@/features/access/domain/sign-in";
import type { Profile, ProfileId, Role } from "@/server/ports";

import { anonClient, serviceClient } from "./client";

/** Email a link that signs the visitor in. Sign-up is the same act. */
export async function sendSignInLink(
  email: string,
  callbackUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await anonClient().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl },
  });

  return error ? { ok: false, error: error.message } : { ok: true };
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Turn the token hash from a clicked link into a session.
 *
 * `verifyOtp` with a token hash rather than the PKCE code exchange,
 * because the hash arrives in the query string where a server can read
 * it. The implicit flow puts it in the URL fragment, which never reaches
 * the server at all — the reason this needs the email template to use
 * {{ .TokenHash }}.
 */
export async function verifyMagicLink(
  tokenHash: string,
  type: VerificationType,
): Promise<
  { ok: true; tokens: SessionTokens } | { ok: false; error: string }
> {
  const { data, error } = await anonClient().auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) return { ok: false, error: error.message };
  if (!data.session) return { ok: false, error: "no session returned" };

  return {
    ok: true,
    tokens: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  };
}

/** Exchange a refresh token for a fresh pair. */
export async function refreshSession(
  refreshToken: string,
): Promise<SessionTokens | null> {
  const { data, error } = await anonClient().auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) return null;

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

/** The identity provider's user id behind an access token, or null. */
export async function authUserFor(
  accessToken: string,
): Promise<{ id: string; email: string } | null> {
  const { data, error } = await anonClient().auth.getUser(accessToken);
  if (error || !data.user) return null;

  return { id: data.user.id, email: data.user.email ?? "" };
}

/**
 * Our profile for their user, created on first sight.
 *
 * Sign-up and sign-in being the same act (01 §3) means there is no
 * separate registration to hang this on: the first time a verified
 * inbox appears, it gets a profile. The display name starts as the local
 * part of the address because the role gate is the next screen and
 * asking for a name before that would put a form in front of the one
 * screen every user has to pass through.
 */
export async function ensureProfile(
  authUserId: string,
  email: string,
): Promise<Profile> {
  const db = serviceClient();

  const existing = await db
    .from("profile")
    .select("id, auth_user_id, display_name, email, timezone")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);

  if (existing.data) {
    return {
      id: existing.data.id,
      authUserId: existing.data.auth_user_id,
      displayName: existing.data.display_name,
      email: existing.data.email,
      timezone: existing.data.timezone,
    };
  }

  const created = await db
    .from("profile")
    .insert({
      auth_user_id: authUserId,
      email,
      display_name: email.split("@")[0] ?? "",
    })
    .select("id, auth_user_id, display_name, email, timezone")
    .single();

  if (created.error) throw new Error(created.error.message);

  return {
    id: created.data.id,
    authUserId: created.data.auth_user_id,
    displayName: created.data.display_name,
    email: created.data.email,
    timezone: created.data.timezone,
  };
}

/** Every role this profile holds. Empty is an ordinary answer. */
export async function rolesOf(
  profileId: ProfileId,
): Promise<ReadonlySet<Role>> {
  const { data, error } = await serviceClient()
    .from("profile_role")
    .select("role")
    .eq("profile_id", profileId);

  if (error) throw new Error(error.message);

  return new Set((data ?? []).map((row) => row.role as Role));
}

/** Give a profile a role. Idempotent — a role is held or it is not. */
export async function grantRole(
  profileId: ProfileId,
  role: Role,
): Promise<void> {
  const { error } = await serviceClient()
    .from("profile_role")
    .upsert({ profile_id: profileId, role }, { onConflict: "profile_id,role" });

  if (error) throw new Error(error.message);
}

/** Update the parts of a profile its owner may change. */
export async function updateProfile(
  profileId: ProfileId,
  fields: { displayName?: string; timezone?: string },
): Promise<void> {
  const patch: Record<string, string> = {};
  if (fields.displayName !== undefined) patch.display_name = fields.displayName;
  if (fields.timezone !== undefined) patch.timezone = fields.timezone;
  if (Object.keys(patch).length === 0) return;

  const { error } = await serviceClient()
    .from("profile")
    .update(patch)
    .eq("id", profileId);

  if (error) throw new Error(error.message);
}
