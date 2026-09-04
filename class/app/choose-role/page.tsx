import { redirect } from "next/navigation";

import RoleChoice from "@/features/access/ui/role-choice";
import { GATE, gateFor } from "@/features/access/domain/role-gate";
import { currentViewer } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function ChooseRolePage() {
  const viewer = await currentViewer();
  const decision = gateFor(viewer?.roles ?? null);

  if (decision === GATE.SIGN_IN) redirect("/sign-in");
  if (decision === GATE.ALLOWED) redirect("/dashboard");

  return (
    <main className="page page-narrow">
      <h1>How will you use this?</h1>
      <p>
        This decides what you see. You are not locked in — if you teach and
        learn here, you can hold both.
      </p>

      <RoleChoice />

      {/*
        The privacy notice lives here because this is the one screen every
        user passes through exactly once, before doing anything (01 §2).
      */}
      <section className="notice-block">
        <h2>What is kept about you</h2>
        <p className="hint">
          Your email address, a display name, and your timezone — that is
          all. No age, no country, no photograph, no payment details. Your
          email is used to sign you in and nothing else.
        </p>
        <p className="hint">
          A record is kept of each class: who taught, who attended, when it
          was scheduled, when it started and ended, and how it finished.
          That record is what the platform is for, and it is kept after a
          class the way an invoice would be.
        </p>
        <p className="hint">
          Video and audio are not recorded. Chat messages are not stored —
          they exist only between the browsers in the call.
        </p>
      </section>
    </main>
  );
}
