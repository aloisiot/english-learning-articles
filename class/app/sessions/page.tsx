import { sessionsFor } from "@/features/scheduling/adapters/supabase/sessions";
import { When } from "@/features/scheduling/ui/when";
import { requireViewer } from "@/server/session";

export const dynamic = "force-dynamic";

const OUTCOME_WORDS: Record<string, string> = {
  completed: "Held",
  student_cancelled: "Cancelled by the student",
  student_no_show: "Student did not arrive",
  tutor_cancelled: "Cancelled by the tutor",
  technical_failure: "Did not happen — technical problem",
};

export default async function SessionsPage() {
  const { profile } = await requireViewer();
  const sessions = await sessionsFor(profile.id);

  return (
    <main className="page">
      <h1>Past classes</h1>

      {sessions.length === 0 ? (
        <p className="muted">Nothing yet.</p>
      ) : (
        <ul className="rows">
          {sessions.map((session) => (
            <li key={session.id} className="row">
              <div>
                <strong>
                  <When instant={session.scheduledStart} timeZone={profile.timezone} />
                </strong>
                <p className="hint">
                  {session.tutorName} taught {session.studentName} ·{" "}
                  {OUTCOME_WORDS[session.outcome] ?? session.outcome}
                  {session.actualStart && session.actualEnd && (
                    <>
                      {" "}
                      ·{" "}
                      {Math.round(
                        (session.actualEnd.getTime() -
                          session.actualStart.getTime()) /
                          60000,
                      )}{" "}
                      minutes
                    </>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
