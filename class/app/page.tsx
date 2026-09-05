import Link from "next/link";
import { redirect } from "next/navigation";

import { GATE, gateFor } from "@/features/access/domain/role-gate";
import { currentViewer } from "@/server/session";

export const dynamic = "force-dynamic";

/**
 * The front door, which now has two kinds of caller.
 *
 * It used to say only "classes are joined through the link you were
 * sent", which was true when a signed link was the only way in. Sign-in
 * returns people here — the callback's default return-to is "/" — so a
 * signed-in user was landing on a page that told them to go and find an
 * email, with nothing to click.
 *
 * So it forwards rather than explains: the gate decides, exactly as it
 * does everywhere else, and the answer is the same one requireViewer
 * would give. What is left is for people who arrive with no session,
 * including everyone holding a signed link, whose route is elsewhere and
 * needs no account at all.
 */
export default async function ClassHome() {
  const viewer = await currentViewer();

  switch (gateFor(viewer?.roles ?? null)) {
    case GATE.ALLOWED:
      redirect("/dashboard");
    case GATE.CHOOSE_ROLE:
      redirect("/choose-role");
    default:
      break;
  }

  return (
    <main className="page page-narrow">
      <h1>Class</h1>
      <p>
        If you have a class booked, sign in to join it. If somebody sent you
        a link to a class, open that link instead — it needs no account.
      </p>
      <p>
        <Link className="button" href="/sign-in">
          Sign in
        </Link>
      </p>
    </main>
  );
}
