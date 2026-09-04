import { redirect } from "next/navigation";

import { isBookable, maySetUpSlots } from "@/features/access/domain/approval";
import { ensureTutorSettings } from "@/features/access/adapters/supabase/tutors";
import { requireViewer } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function TeachPage() {
  const { profile, roles } = await requireViewer();
  if (!maySetUpSlots(roles)) redirect("/dashboard");

  const settings = await ensureTutorSettings(profile.id);

  return (
    <main className="page">
      <h1>Teaching</h1>

      {!isBookable(settings) && (
        <div className="panel">
          <h2>Waiting for approval</h2>
          <p className="hint">
            You can set everything up now — open slots, change how bookings
            work. Students will not see you until the owner approves your
            account, and everything you have prepared becomes visible the
            moment they do.
          </p>
        </div>
      )}

      <h2>Bookings</h2>
      <form method="post" action="/class/api/teach/settings" className="stack">
        <label className="inline">
          <input
            type="checkbox"
            name="requires_booking_approval"
            defaultChecked={settings.requiresBookingApproval}
          />
          Let me approve each booking before it is confirmed
        </label>
        <p className="hint">
          With this off, any open slot is booked the moment a student takes
          it. With it on, a request holds the slot until you answer — so
          answer promptly, or that time goes unused.
        </p>
        <button type="submit">Save</button>
      </form>
    </main>
  );
}
