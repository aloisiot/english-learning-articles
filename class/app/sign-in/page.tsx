import { redirect } from "next/navigation";

import { SIGN_IN_FAILURE, safeReturnTo } from "@/features/access/domain/sign-in";
import SignInForm from "@/features/access/ui/sign-in-form";
import { currentViewer } from "@/server/session";

export const dynamic = "force-dynamic";

const PROBLEM: Record<string, string> = {
  [SIGN_IN_FAILURE.MALFORMED]:
    "That link was incomplete. Mail clients sometimes break long links across lines — ask for a fresh one below.",
  [SIGN_IN_FAILURE.EXPIRED]:
    "That link has already been used, or it expired. Links work once. Ask for a new one below.",
  [SIGN_IN_FAILURE.UNAVAILABLE]:
    "Something went wrong on our side, not yours. Try again in a moment.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ problem?: string; return_to?: string }>;
}) {
  const { problem, return_to } = await searchParams;
  const returnTo = safeReturnTo(return_to);

  if (await currentViewer()) redirect(returnTo);

  return (
    <main className="page page-narrow">
      <h1>Sign in</h1>

      {problem && PROBLEM[problem] && (
        <p className="error">{PROBLEM[problem]}</p>
      )}

      <SignInForm returnTo={returnTo} />
    </main>
  );
}
