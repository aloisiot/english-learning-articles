/** Slots and bookings, on the far side of the port. */
import { serviceClient } from "@/features/access/adapters/supabase/client";
import type { ProfileId } from "@/server/ports";

export interface SlotRow {
  id: string;
  tutorId: ProfileId;
  tutorName: string;
  startsAt: Date;
  durationMinutes: number;
  status: string;
}

interface RawSlot {
  id: string;
  tutor_id: string;
  starts_at: string;
  duration_minutes: number;
  status: string;
  profile?: { display_name: string } | null;
}

const SLOT_COLUMNS =
  "id, tutor_id, starts_at, duration_minutes, status, profile:tutor_id (display_name)";

function toSlot(raw: RawSlot): SlotRow {
  return {
    id: raw.id,
    tutorId: raw.tutor_id,
    tutorName: raw.profile?.display_name ?? "",
    startsAt: new Date(raw.starts_at),
    durationMinutes: raw.duration_minutes,
    status: raw.status,
  };
}

export async function openSlot(
  tutorId: ProfileId,
  startsAt: Date,
  durationMinutes: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await serviceClient().from("slot").insert({
    tutor_id: tutorId,
    starts_at: startsAt.toISOString(),
    duration_minutes: durationMinutes,
  });

  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function slotsOfTutor(
  tutorId: ProfileId,
  from: Date,
): Promise<readonly SlotRow[]> {
  const { data, error } = await serviceClient()
    .from("slot")
    .select(SLOT_COLUMNS)
    .eq("tutor_id", tutorId)
    .gte("starts_at", from.toISOString())
    .neq("status", "cancelled")
    .order("starts_at");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toSlot(row as unknown as RawSlot));
}

/**
 * Open slots a student may take.
 *
 * The join through tutor_settings is where 04 §2's visibility gate
 * actually bites — an unapproved tutor's slots exist and are simply
 * never returned here.
 */
export async function bookableSlots(from: Date): Promise<readonly SlotRow[]> {
  const approved = await serviceClient()
    .from("tutor_settings")
    .select("profile_id")
    .not("approved_at", "is", null);

  if (approved.error) throw new Error(approved.error.message);

  const ids = (approved.data ?? []).map((row) => row.profile_id);
  if (ids.length === 0) return [];

  const { data, error } = await serviceClient()
    .from("slot")
    .select(SLOT_COLUMNS)
    .in("tutor_id", ids)
    .eq("status", "open")
    .gte("starts_at", from.toISOString())
    .order("starts_at");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toSlot(row as unknown as RawSlot));
}

export async function slotById(id: string): Promise<SlotRow | null> {
  const { data, error } = await serviceClient()
    .from("slot")
    .select(SLOT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toSlot(data as unknown as RawSlot) : null;
}

export async function setSlotStatus(
  slotId: string,
  status: string,
): Promise<void> {
  const { error } = await serviceClient()
    .from("slot")
    .update({ status })
    .eq("id", slotId);

  if (error) throw new Error(error.message);
}

export async function cancelSlot(
  slotId: string,
  tutorId: ProfileId,
): Promise<void> {
  const { error } = await serviceClient()
    .from("slot")
    .update({ status: "cancelled" })
    .eq("id", slotId)
    .eq("tutor_id", tutorId);

  if (error) throw new Error(error.message);
}
