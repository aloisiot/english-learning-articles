/**
 * Mint a class link. The admin half of phase 1's small, deliberate auth
 * surface (research/video-calls/07-two-app-architecture.md §7).
 *
 * Three things guard it, and none of them is a session: an unguessable
 * path on the page that posts here, a shared secret re-checked on every
 * submission, and a rate limit. Statelessness is the point — there is
 * nothing to steal from this endpoint but the secret itself, and nothing
 * it issues that outlives the request.
 */
import { signPayload } from "@/features/access/domain/link";
import { rateLimit, type RateLimitState } from "@/features/access/domain/rate-limit";
import { classWindow, deriveRoomName } from "@/features/scheduling/domain/room";
import { secretsMatch } from "@/features/access/domain/secret";
import { adminSecret, linkSecret, publicOrigin } from "@/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Per-instance, and therefore partial: a serverless platform may run
 * several of these at once, and each counts on its own. See the note in
 * features/access/domain/rate-limit.ts — this is adequate against a script pointed at
 * one URL and weak against a distributed attacker, which is the trade
 * phase 1 accepts for having nowhere shared to count.
 */
let attempts: RateLimitState | undefined;

interface LinkRequestBody {
  secret?: unknown;
  /** Optional: a class need not be about an article. */
  slug?: unknown;
  startsAt?: unknown;
  durationMinutes?: unknown;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request): Promise<Response> {
  const limited = rateLimit(attempts, clientKey(request), Date.now() / 1000);
  attempts = limited.state;
  if (!limited.allowed) {
    return Response.json(
      { error: "rate-limited" },
      { status: 429, headers: { "retry-after": String(limited.retryAfter) } },
    );
  }

  let input: LinkRequestBody;
  try {
    input = (await request.json()) as LinkRequestBody;
  } catch {
    return Response.json({ error: "malformed" }, { status: 400 });
  }

  if (!secretsMatch(input?.secret, adminSecret())) {
    return Response.json({ error: "not-authorised" }, { status: 401 });
  }

  const { slug, startsAt, durationMinutes } = input ?? {};

  // The article is optional — not every class is about one. A blank
  // field posts an empty string, which is normalised away here so that
  // everything downstream sees either a real slug or nothing at all.
  const article =
    typeof slug === "string" && slug.trim() !== "" ? slug.trim() : undefined;

  let window;
  let room: string;
  try {
    window = classWindow({ startsAt, durationMinutes });
    room = deriveRoomName({ slug: article, startsAt });
  } catch (error) {
    // classWindow and deriveRoomName throw on anything unusable, which
    // here is a form-validation failure rather than a server fault.
    const message =
      error instanceof Error ? error.message : "invalid class details";
    return Response.json({ error: message }, { status: 400 });
  }

  const token = signPayload(
    // Spread rather than `slug: article`: an explicit `undefined` would
    // survive into JSON.stringify as a missing key anyway, but writing
    // it this way makes the "absent, not empty" rule visible at the one
    // place the payload is built.
    { ...(article === undefined ? {} : { slug: article }), room, exp: window.expiresAt },
    linkSecret(),
  );

  return Response.json({
    url: `${publicOrigin()}/class/j/${token}`,
    room,
    endsAt: window.endsAt,
    expiresAt: window.expiresAt,
  });
}
