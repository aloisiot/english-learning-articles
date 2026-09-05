/**
 * The one screen every user passes through exactly once, which is why
 * the privacy notice sits beside it (01 §2).
 *
 * Two plain forms and no JavaScript, which is a correction rather than a
 * simplification. This was a client component that disabled both buttons
 * in onSubmit to show a "Setting up…" state. React flushes state
 * synchronously for discrete events, so the buttons were disabled before
 * the browser serialised the form — and a disabled control is not a
 * successful control, so the `role` the button carried was never sent.
 * The gate silently bounced back to itself.
 *
 * A hidden input would survive that, but disabling the *submitter*
 * during its own click can cancel the submission outright in some
 * browsers, so the affordance is dropped rather than made more clever.
 * Double-submitting is harmless here: granting a role is an upsert, and
 * the second POST lands on the dashboard like the first.
 */
export default function RoleChoice() {
  return (
    <div className="choices">
      <form method="post" action="/class/api/choose-role">
        <input type="hidden" name="role" value="student" />
        <button type="submit">
          <span className="choice-title">I am here to learn</span>
          <span className="choice-body">
            Book a class with a tutor and join it from your dashboard.
          </span>
        </button>
      </form>

      <form method="post" action="/class/api/choose-role">
        <input type="hidden" name="role" value="tutor" />
        <button type="submit">
          <span className="choice-title">I am here to teach</span>
          <span className="choice-body">
            Open the times you are available and decide who books them. A new
            tutor is not shown to students until the owner has approved them,
            so you can set everything up while that happens.
          </span>
        </button>
      </form>
    </div>
  );
}
