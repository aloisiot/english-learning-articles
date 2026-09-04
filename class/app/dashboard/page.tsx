import Link from "next/link";

import { mayApproveTutors, maySetUpSlots } from "@/features/access/domain/approval";
import { bookingsForStudent, bookingsForTutor } from "@/features/scheduling/adapters/supabase/bookings";
import { isAwaitingTutor, type BookingStatus } from "@/features/scheduling/domain/booking";
import { isJoinable } from "@/features/scheduling/domain/join-window";
import { When } from "@/features/scheduling/ui/when";
import { requireViewer } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { profile, roles } = await requireViewer();
  const now = new Date();

  const isTutor = maySetUpSlots(roles);
  const mine = await bookingsForStudent(profile.id);
  const teaching = isTutor ? await bookingsForTutor(profile.id) : [];

  const upcoming = [...mine, ...teaching]
    .filter((b) => b.status === "confirmed" && b.startsAt.getTime() > now.getTime() - 3600_000)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const waitingOnMe = teaching.filter((b) =>
    isAwaitingTutor(b.status as BookingStatus),
  );

  return (
    <main className="page">
      <h1>Hello, {profile.displayName}</h1>

      {waitingOnMe.length > 0 && (
        <p className="error">
          {waitingOnMe.length} booking
          {waitingOnMe.length === 1 ? " is" : "s are"} waiting on you, holding
          time nobody else can take. <Link href="/teach/requests">Answer them</Link>.
        </p>
      )}

      <h2>Next classes</h2>
      {upcoming.length === 0 ? (
        <p className="muted">Nothing booked.</p>
      ) : (
        <ul className="rows">
          {upcoming.map((booking) => {
            const joinable = isJoinable(
              {
                status: booking.status,
                studentId: booking.studentId,
                tutorId: booking.tutorId,
                startsAt: booking.startsAt,
                durationMinutes: booking.durationMinutes,
              },
              now,
            );

            return (
              <li key={booking.id} className="row">
                <div>
                  <strong>
                    <When instant={booking.startsAt} timeZone={profile.timezone} withZone />
                  </strong>
                  <p className="hint">
                    {booking.studentId === profile.id
                      ? `with ${booking.tutorName}`
                      : `with ${booking.studentName}`}{" "}
                    · {booking.durationMinutes} minutes
                  </p>
                </div>
                <div className="row-actions">
                  {joinable ? (
                    <Link className="button" href={`/room/${booking.id}`}>
                      Join
                    </Link>
                  ) : (
                    <form method="post" action="/class/api/bookings/cancel">
                      <input type="hidden" name="booking_id" value={booking.id} />
                      <button type="submit">Cancel</button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <nav className="links">
        <Link href="/book">Book a class</Link>
        <Link href="/sessions">Past classes</Link>
        {isTutor && <Link href="/teach/slots">Your times</Link>}
        {isTutor && <Link href="/teach/requests">Requests</Link>}
        {isTutor && <Link href="/teach">Teaching settings</Link>}
        {mayApproveTutors(roles) && <Link href="/tutors">Tutors</Link>}
      </nav>

      <form method="post" action="/class/api/auth/sign-out">
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
