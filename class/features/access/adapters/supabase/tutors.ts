/** Tutor settings and the owner's approval, on the far side of the port. */
import type { TutorSettings } from "@/features/access/domain/approval";
import type { ProfileId } from "@/server/ports";

import { serviceClient } from "./client";

const COLUMNS =
  "profile_id, requires_booking_approval, approved_at, approved_by";

interface Row {
  profile_id: string;
  requires_booking_approval: boolean;
  approved_at: string | null;
  approved_by: string | null;
}

function toSettings(row: Row): TutorSettings {
  return {
    profileId: row.profile_id,
    requiresBookingApproval: row.requires_booking_approval,
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    approvedBy: row.approved_by,
  };
}

export async function tutorSettings(
  profileId: ProfileId,
): Promise<TutorSettings | null> {
  const { data, error } = await serviceClient()
    .from("tutor_settings")
    .select(COLUMNS)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toSettings(data as Row) : null;
}

/** Created when the role is chosen, so a new tutor has settings to edit. */
export async function ensureTutorSettings(
  profileId: ProfileId,
): Promise<TutorSettings> {
  const { data, error } = await serviceClient()
    .from("tutor_settings")
    .upsert({ profile_id: profileId }, { onConflict: "profile_id" })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return toSettings(data as Row);
}

export async function setBookingApproval(
  profileId: ProfileId,
  required: boolean,
): Promise<void> {
  const { error } = await serviceClient()
    .from("tutor_settings")
    .update({ requires_booking_approval: required })
    .eq("profile_id", profileId);

  if (error) throw new Error(error.message);
}

/**
 * Record the owner's approval.
 *
 * The `is null` filter is the no-op from shouldRecordApproval expressed
 * where it also holds against a concurrent second approval — two owners
 * clicking at once must not move the timestamp either.
 */
export async function approveTutor(
  profileId: ProfileId,
  approvedBy: ProfileId,
): Promise<void> {
  const { error } = await serviceClient()
    .from("tutor_settings")
    .update({ approved_at: new Date().toISOString(), approved_by: approvedBy })
    .eq("profile_id", profileId)
    .is("approved_at", null);

  if (error) throw new Error(error.message);
}

export interface TutorListing {
  profileId: ProfileId;
  displayName: string;
  email: string;
  settings: TutorSettings;
}

/** Every tutor, approved or not — the owner's queue. */
export async function allTutors(): Promise<readonly TutorListing[]> {
  const { data, error } = await serviceClient()
    .from("tutor_settings")
    .select(`${COLUMNS}, profile:profile_id (display_name, email)`)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const typed = row as unknown as Row & {
      profile: { display_name: string; email: string } | null;
    };
    return {
      profileId: typed.profile_id,
      displayName: typed.profile?.display_name ?? "",
      email: typed.profile?.email ?? "",
      settings: toSettings(typed),
    };
  });
}
