/** The session record, on the far side of the port. Append-only. */
import { serviceClient } from "@/features/access/adapters/supabase/client";
import type { SessionDraft } from "@/features/scheduling/domain/session-record";
import type { ProfileId } from "@/server/ports";

export interface SessionRow {
  id: string;
  tutorName: string;
  studentName: string;
  scheduledStart: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  outcome: string;
}

interface Raw {
  id: string;
  tutor_name: string;
  student_name: string;
  scheduled_start: string;
  actual_start: string | null;
  actual_end: string | null;
  outcome: string;
}

const COLUMNS =
  "id, tutor_name, student_name, scheduled_start, actual_start, actual_end, outcome";

function toSession(raw: Raw): SessionRow {
  return {
    id: raw.id,
    tutorName: raw.tutor_name,
    studentName: raw.student_name,
    scheduledStart: new Date(raw.scheduled_start),
    actualStart: raw.actual_start ? new Date(raw.actual_start) : null,
    actualEnd: raw.actual_end ? new Date(raw.actual_end) : null,
    outcome: raw.outcome,
  };
}

/**
 * Write the record, once.
 *
 * `ignoreDuplicates` against the one-per-booking index rather than a
 * read-then-write: a class happened once however many times the browser
 * reports that it ended, and the second report must not amend the first.
 * There is no update path anywhere in this file, deliberately.
 */
export async function recordSession(draft: SessionDraft): Promise<void> {
  const { error } = await serviceClient()
    .from("session")
    .upsert(
      {
        booking_id: draft.bookingId,
        tutor_id: draft.tutorId,
        student_id: draft.studentId,
        tutor_name: draft.tutorName,
        student_name: draft.studentName,
        scheduled_start: draft.scheduledStart.toISOString(),
        actual_start: draft.actualStart?.toISOString() ?? null,
        actual_end: draft.actualEnd?.toISOString() ?? null,
        outcome: draft.outcome,
      },
      { onConflict: "booking_id", ignoreDuplicates: true },
    );

  if (error) throw new Error(error.message);
}

export async function sessionsFor(
  profileId: ProfileId,
): Promise<readonly SessionRow[]> {
  const { data, error } = await serviceClient()
    .from("session")
    .select(COLUMNS)
    .or(`student_id.eq.${profileId},tutor_id.eq.${profileId}`)
    .order("scheduled_start", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toSession(row as Raw));
}
