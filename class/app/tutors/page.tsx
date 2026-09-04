/**
 * The owner's queue.
 *
 * Approval gates visibility, not slot creation (04 §2), so this screen
 * says what an unapproved tutor can already do — otherwise "pending"
 * reads as "blocked" and someone goes looking for a problem.
 */
import { redirect } from "next/navigation";

import { isBookable, mayApproveTutors } from "@/features/access/domain/approval";
import { allTutors } from "@/features/access/adapters/supabase/tutors";
import { requireViewer } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function TutorsPage() {
  const { roles } = await requireViewer();
  if (!mayApproveTutors(roles)) redirect("/dashboard");

  const tutors = await allTutors();
  const waiting = tutors.filter((t) => !isBookable(t.settings));
  const approved = tutors.filter((t) => isBookable(t.settings));

  return (
    <main className="page">
      <h1>Tutors</h1>

      <h2>Waiting for approval</h2>
      {waiting.length === 0 ? (
        <p className="muted">Nobody is waiting.</p>
      ) : (
        <ul className="rows">
          {waiting.map((tutor) => (
            <li key={tutor.profileId} className="row">
              <div>
                <strong>{tutor.displayName}</strong>
                <span className="muted"> · {tutor.email}</span>
                <p className="hint">
                  They can already prepare slots. Students will not see them
                  until you approve.
                </p>
              </div>
              <form method="post" action="/class/api/tutors/approve">
                <input type="hidden" name="tutor_id" value={tutor.profileId} />
                <button type="submit">Approve</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2>Approved</h2>
      {approved.length === 0 ? (
        <p className="muted">None yet.</p>
      ) : (
        <ul className="rows">
          {approved.map((tutor) => (
            <li key={tutor.profileId} className="row">
              <div>
                <strong>{tutor.displayName}</strong>
                <span className="muted"> · {tutor.email}</span>
                <p className="hint">
                  Approved{" "}
                  {tutor.settings.approvedAt?.toISOString().slice(0, 10)} ·{" "}
                  {tutor.settings.requiresBookingApproval
                    ? "vets each booking"
                    : "accepts bookings automatically"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
