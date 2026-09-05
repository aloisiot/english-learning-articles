/**
 * What a student may take.
 *
 * Only slots of approved tutors reach here — the visibility gate is in
 * the query (04 §2), so an unapproved tutor's prepared week exists and
 * is simply never listed.
 */
import { bookableSlots } from "@/features/scheduling/adapters/supabase/slots";
import { When } from "@/features/scheduling/ui/when";
import { requireViewer } from "@/server/session";

export const dynamic = "force-dynamic";

const PROBLEM: Record<string, string> = {
  taken: "Somebody else took that time while you were deciding. Here is what is left.",
  gone: "That time is no longer available.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ problem?: string }>;
}) {
  const { profile } = await requireViewer();
  const { problem } = await searchParams;
  const slots = await bookableSlots(new Date());

  return (
    <main className="page">
      <h1>Book a class</h1>
      <p className="muted">Times are shown in {profile.timezone}.</p>

      {problem && PROBLEM[problem] && <p className="error">{PROBLEM[problem]}</p>}

      {slots.length === 0 ? (
        <p className="muted">
          No times are open at the moment. Tutors add them as they go.
        </p>
      ) : (
        <ul className="rows">
          {slots.map((slot) => (
            <li key={slot.id} className="row">
              <div>
                <strong>
                  <When instant={slot.startsAt} timeZone={profile.timezone} withZone />
                </strong>
                <p className="hint">
                  {slot.tutorName} · {slot.durationMinutes} minutes
                </p>
              </div>
              <form method="post" action="/class/api/bookings/request">
                <input type="hidden" name="slot_id" value={slot.id} />
                <button type="submit">Request</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
