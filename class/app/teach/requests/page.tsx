/**
 * Pending requests, first and loudest.
 *
 * 04 §4 accepts the dead-slot cost of holding a slot while a tutor
 * decides, on the condition that this screen makes the decision hard to
 * miss — that is the free mitigation, and the only one implemented.
 */
import { redirect } from "next/navigation";

import { maySetUpSlots } from "@/features/access/domain/approval";
import { bookingsForTutor } from "@/features/scheduling/adapters/supabase/bookings";
import { isAwaitingTutor, type BookingStatus } from "@/features/scheduling/domain/booking";
import { When } from "@/features/scheduling/ui/when";
import { requireViewer } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const { profile, roles } = await requireViewer();
  if (!maySetUpSlots(roles)) redirect("/dashboard");

  const bookings = await bookingsForTutor(profile.id);
  const waiting = bookings.filter((b) => isAwaitingTutor(b.status as BookingStatus));
  const settled = bookings.filter((b) => !isAwaitingTutor(b.status as BookingStatus));

  return (
    <main className="page">
      <h1>Requests</h1>

      {waiting.length === 0 ? (
        <p className="muted">Nothing waiting on you.</p>
      ) : (
        <>
          <p className="hint">
            Each of these is holding a time that nobody else can take until
            you answer. Declining puts it straight back.
          </p>
          <ul className="rows">
            {waiting.map((booking) => (
              <li key={booking.id} className="row">
                <div>
                  <strong>{booking.studentName}</strong>
                  <p className="hint">
                    <When instant={booking.startsAt} timeZone={profile.timezone} withZone />{" "}
                    · {booking.durationMinutes} minutes
                  </p>
                </div>
                <div className="row-actions">
                  <form method="post" action="/class/api/bookings/decide">
                    <input type="hidden" name="booking_id" value={booking.id} />
                    <input type="hidden" name="decision" value="confirm" />
                    <button type="submit">Accept</button>
                  </form>
                  <form method="post" action="/class/api/bookings/decide">
                    <input type="hidden" name="booking_id" value={booking.id} />
                    <input type="hidden" name="decision" value="decline" />
                    <button type="submit">Decline</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Settled</h2>
      {settled.length === 0 ? (
        <p className="muted">Nothing yet.</p>
      ) : (
        <ul className="rows">
          {settled.map((booking) => (
            <li key={booking.id} className="row">
              <div>
                <strong>{booking.studentName}</strong>
                <p className="hint">
                  <When instant={booking.startsAt} timeZone={profile.timezone} /> ·{" "}
                  {booking.status}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
