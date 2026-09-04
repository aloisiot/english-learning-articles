import { redirect } from "next/navigation";

import { isBookable, maySetUpSlots } from "@/features/access/domain/approval";
import { ensureTutorSettings } from "@/features/access/adapters/supabase/tutors";
import { slotsOfTutor } from "@/features/scheduling/adapters/supabase/slots";
import SlotForm from "@/features/scheduling/ui/slot-form";
import { When } from "@/features/scheduling/ui/when";
import { requireViewer } from "@/server/session";

export const dynamic = "force-dynamic";

const PROBLEM: Record<string, string> = {
  unreadable: "That date and time could not be read. Please pick it again.",
  past: "That time has already passed.",
  duplicate: "You have already opened that time.",
};

export default async function SlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ problem?: string }>;
}) {
  const { profile, roles } = await requireViewer();
  if (!maySetUpSlots(roles)) redirect("/dashboard");

  const { problem } = await searchParams;
  const settings = await ensureTutorSettings(profile.id);
  const slots = await slotsOfTutor(profile.id, new Date());

  return (
    <main className="page">
      <h1>Your times</h1>

      {!isBookable(settings) && (
        <p className="hint">
          You are not approved yet, so students cannot see these. Open them
          anyway — they appear the moment approval lands.
        </p>
      )}

      {problem && PROBLEM[problem] && <p className="error">{PROBLEM[problem]}</p>}

      <SlotForm timeZone={profile.timezone} />

      <h2>Open and booked</h2>
      {slots.length === 0 ? (
        <p className="muted">Nothing opened yet.</p>
      ) : (
        <ul className="rows">
          {slots.map((slot) => (
            <li key={slot.id} className="row">
              <div>
                <strong>
                  <When instant={slot.startsAt} timeZone={profile.timezone} withZone />
                </strong>
                <p className="hint">
                  {slot.durationMinutes} minutes · {slot.status}
                </p>
              </div>
              {slot.status === "open" && (
                <form method="post" action="/class/api/slots/cancel">
                  <input type="hidden" name="slot_id" value={slot.id} />
                  <button type="submit">Withdraw</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
