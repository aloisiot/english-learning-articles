/**
 * A class entered from the dashboard, by someone with an account.
 *
 * The sibling of app/j/[token], which is entered by someone without one.
 * Both render the same call; what differs is the proof they carry, and
 * both are re-checked by /api/join rather than trusted from here — this
 * page decides what is shown, that endpoint decides what is given.
 */
import Link from "next/link";
import { redirect } from "next/navigation";

import CallClient from "@/features/call/ui/call-client";
import { bookingById } from "@/features/scheduling/adapters/supabase/bookings";
import { JOIN_REFUSAL, mayJoin } from "@/features/scheduling/domain/join-window";
import { requireViewer } from "@/server/session";

export const dynamic = "force-dynamic";

const EXPLAIN: Record<string, string> = {
  [JOIN_REFUSAL.NOT_YOURS]: "This is not one of your classes.",
  [JOIN_REFUSAL.NOT_CONFIRMED]:
    "This class is not confirmed yet. Your tutor has not answered the request.",
  [JOIN_REFUSAL.TOO_EARLY]:
    "This class has not started yet. The room opens ten minutes before.",
  [JOIN_REFUSAL.TOO_LATE]: "This class is over.",
};

export default async function RoomPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const { profile } = await requireViewer();

  const booking = await bookingById(bookingId);
  if (!booking) redirect("/dashboard");

  const decision = mayJoin(
    {
      status: booking.status,
      studentId: booking.studentId,
      tutorId: booking.tutorId,
      startsAt: booking.startsAt,
      durationMinutes: booking.durationMinutes,
    },
    profile.id,
    new Date(),
  );

  if (!decision.ok) {
    return (
      <main className="page page-narrow">
        <h1>Not now</h1>
        <p>{EXPLAIN[decision.reason]}</p>
        <p>
          <Link href="/dashboard">Back to your classes</Link>
        </p>
      </main>
    );
  }

  return (
    <CallClient
      bookingId={booking.id}
      slug={
        decision.role === "student"
          ? `with ${booking.tutorName}`
          : `with ${booking.studentName}`
      }
    />
  );
}
