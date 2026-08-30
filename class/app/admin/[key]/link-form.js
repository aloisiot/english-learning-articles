"use client";

/**
 * Generate a class link.
 *
 * The secret is held in component state and sent with each submission —
 * never stored, never exchanged for a session. Reloading the page loses
 * it, which is the intended cost of not having one
 * (research/video-calls/07-two-app-architecture.md §7).
 */
import { useCallback, useState } from "react";

/** Must match `basePath` in next.config.mjs — see call-client.js. */
const LINKS_ENDPOINT = "/class/api/links";

const DEFAULT_DURATION = 30;

export default function LinkForm() {
  const [secret, setSecret] = useState("");
  const [slug, setSlug] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const submit = useCallback(
    async (event) => {
      event.preventDefault();
      setPending(true);
      setError(null);
      setResult(null);

      try {
        // The teacher types a wall-clock time in their own timezone; the
        // browser resolves it to an instant here, so nothing after this
        // line has to think about timezones at all.
        const startsAt = Math.floor(new Date(startsAtLocal).getTime() / 1000);

        const response = await fetch(LINKS_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            secret,
            slug,
            startsAt,
            durationMinutes: Number(durationMinutes),
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "That secret was not accepted."
              : response.status === 429
                ? "Too many attempts. Wait a minute and try again."
                : (body.error ?? "Could not generate a link."),
          );
        }

        setResult(body);
      } catch (cause) {
        setError(cause.message ?? "Could not generate a link.");
      } finally {
        setPending(false);
      }
    },
    [secret, slug, startsAtLocal, durationMinutes],
  );

  return (
    <main className="admin">
      <h1>Generate a class link</h1>

      <form onSubmit={submit}>
        <label>
          Admin secret
          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            autoComplete="off"
            required
          />
        </label>

        <label>
          Article slug
          <input
            type="text"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="2026-08-13-the-deal-that-ended-it"
            required
          />
        </label>

        <label>
          Starts at (your local time)
          <input
            type="datetime-local"
            value={startsAtLocal}
            onChange={(event) => setStartsAtLocal(event.target.value)}
            required
          />
        </label>

        <label>
          Length (minutes)
          <input
            type="number"
            min="1"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate link"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <section className="result">
          <h2>Link</h2>
          <p className="link">{result.url}</p>
          <dl>
            <dt>Room</dt>
            <dd>{result.room}</dd>
            <dt>Link expires</dt>
            <dd>{new Date(result.expiresAt * 1000).toLocaleString()}</dd>
          </dl>
        </section>
      ) : null}
    </main>
  );
}
