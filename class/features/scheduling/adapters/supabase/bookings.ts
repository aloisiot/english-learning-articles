/** Bookings, on the far side of the port. */
import { serviceClient } from "@/features/access/adapters/supabase/client";
import type { ProfileId } from "@/server/ports";

export interface BookingRow {
  id: string;
  slotId: string;
  studentId: ProfileId;
  studentName: string;
  tutorId: ProfileId;
  tutorName: string;
  status: string;
  startsAt: Date;
  durationMinutes: number;
}

interface RawBooking {
  id: string;
  slot_id: string;
  student_id: string;
  status: string;
  student?: { display_name: string } | null;
  slot?: {
    starts_at: string;
    duration_minutes: number;
    tutor_id: string;
    profile?: { display_name: string } | null;
  } | null;
}

const COLUMNS = `
  id, slot_id, student_id, status,
  student:student_id (display_name),
  slot:slot_id (starts_at, duration_minutes, tutor_id, profile:tutor_id (display_name))
`;

function toBooking(raw: RawBooking): BookingRow {
  return {
    id: raw.id,
    slotId: raw.slot_id,
    studentId: raw.student_id,
    studentName: raw.student?.display_name ?? "",
    tutorId: raw.slot?.tutor_id ?? "",
    tutorName: raw.slot?.profile?.display_name ?? "",
    status: raw.status,
    startsAt: new Date(raw.slot?.starts_at ?? 0),
    durationMinutes: raw.slot?.duration_minutes ?? 0,
  };
}

/**
 * Claim a slot and record the request.
 *
 * The slot update carries `.eq("status", "open")` so that two students
 * clicking at once cannot both succeed: the second updates no rows and
 * is told the slot is gone. The database's partial unique index on
 * booking is the belt to this braces — either alone would do, and having
 * both means a future caller that forgets one is still safe.
 */
export async function requestBooking(
  slotId: string,
  studentId: ProfileId,
  bookingStatus: string,
  slotStatus: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: "taken" }> {
  const db = serviceClient();

  const claimed = await db
    .from("slot")
    .update({ status: slotStatus })
    .eq("id", slotId)
    .eq("status", "open")
    .select("id");

  if (claimed.error || (claimed.data ?? []).length === 0) {
    return { ok: false, reason: "taken" };
  }

  const created = await db
    .from("booking")
    .insert({
      slot_id: slotId,
      student_id: studentId,
      status: bookingStatus,
      decided_at: bookingStatus === "confirmed" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (created.error) {
    // Put the slot back rather than leaving it held by nothing.
    await db.from("slot").update({ status: "open" }).eq("id", slotId);
    return { ok: false, reason: "taken" };
  }

  return { ok: true, id: created.data.id };
}

export async function bookingById(id: string): Promise<BookingRow | null> {
  const { data, error } = await serviceClient()
    .from("booking")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toBooking(data as unknown as RawBooking) : null;
}

export async function decideBooking(
  bookingId: string,
  slotId: string,
  bookingStatus: string,
  slotStatus: string,
): Promise<void> {
  const db = serviceClient();

  const { error } = await db
    .from("booking")
    .update({ status: bookingStatus, decided_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  await db.from("slot").update({ status: slotStatus }).eq("id", slotId);
}

export async function cancelBooking(
  bookingId: string,
  slotId: string,
  slotStatus: string,
): Promise<void> {
  const db = serviceClient();

  const { error } = await db
    .from("booking")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .in("status", ["pending", "confirmed"]);

  if (error) throw new Error(error.message);

  await db.from("slot").update({ status: slotStatus }).eq("id", slotId);
}

export async function bookingsForStudent(
  studentId: ProfileId,
): Promise<readonly BookingRow[]> {
  const { data, error } = await serviceClient()
    .from("booking")
    .select(COLUMNS)
    .eq("student_id", studentId)
    .order("requested_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toBooking(row as unknown as RawBooking));
}

/** Every booking against this tutor's slots. */
export async function bookingsForTutor(
  tutorId: ProfileId,
): Promise<readonly BookingRow[]> {
  const slots = await serviceClient()
    .from("slot")
    .select("id")
    .eq("tutor_id", tutorId);

  if (slots.error) throw new Error(slots.error.message);
  const ids = (slots.data ?? []).map((row) => row.id);
  if (ids.length === 0) return [];

  const { data, error } = await serviceClient()
    .from("booking")
    .select(COLUMNS)
    .in("slot_id", ids)
    .order("requested_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toBooking(row as unknown as RawBooking));
}
