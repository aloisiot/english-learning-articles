"use client";

/**
 * The one screen every user passes through exactly once, which is why
 * the privacy notice is on it (01 §2).
 */
import { useState } from "react";

export default function RoleChoice() {
  const [pending, setPending] = useState<string | null>(null);

  return (
    <form
      method="post"
      action="/class/api/choose-role"
      onSubmit={(event) => {
        const chosen = (event.nativeEvent as SubmitEvent).submitter;
        setPending(chosen instanceof HTMLButtonElement ? chosen.value : null);
      }}
    >
      <div className="choices">
        <button type="submit" name="role" value="student" disabled={pending !== null}>
          <span className="choice-title">I am here to learn</span>
          <span className="choice-body">
            Book a class with a tutor and join it from your dashboard.
          </span>
          {pending === "student" && <span className="muted">Setting up…</span>}
        </button>

        <button type="submit" name="role" value="tutor" disabled={pending !== null}>
          <span className="choice-title">I am here to teach</span>
          <span className="choice-body">
            Open the times you are available and decide who books them. A new
            tutor is not shown to students until the owner has approved them,
            so you can set everything up while that happens.
          </span>
          {pending === "tutor" && <span className="muted">Setting up…</span>}
        </button>
      </div>
    </form>
  );
}
