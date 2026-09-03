import Link from "next/link";

import { REASON, verifyToken, type VerifyFailureReason } from "@/lib/link";
import { linkSecret } from "@/server/config";

import CallClient from "@/features/call/ui/call-client";

// The token is in the URL and the secret is read per request, so there
// is nothing here to prerender.
export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verified = verifyToken(token, linkSecret());

  if (!verified.ok) {
    return <LinkProblem reason={verified.reason} />;
  }

  return <CallClient token={token} slug={verified.payload.slug} />;
}

/**
 * An expired link is named as expired, everything else is one message.
 *
 * The distinction is worth making: only someone holding a genuinely
 * signed link can see "this class is over", so it tells an attacker
 * nothing, and it saves a student who is simply late from thinking the
 * link was mistyped.
 */
function LinkProblem({ reason }: { reason: VerifyFailureReason }) {
  const expired = reason === REASON.EXPIRED;

  return (
    <main className="notice">
      <h1>{expired ? "This class has ended" : "This link is not valid"}</h1>
      <p>
        {expired
          ? "The link for a class stops working shortly after the class finishes. Ask for a new one for your next class."
          : "Check that you copied the whole link. If it still does not work, ask for a new one."}
      </p>
      <p>
        <Link href="/">Back to the class app</Link>
      </p>
    </main>
  );
}
