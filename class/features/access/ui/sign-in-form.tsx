"use client";

/**
 * One field, because there is one credential.
 *
 * The success message is deliberately the same whether or not the
 * address is known: this form is unauthenticated, and a screen that
 * distinguishes them tells anyone who asks which addresses have
 * accounts.
 */
import { useState, type FormEvent } from "react";

type State = "idle" | "sending" | "sent" | "invalid" | "failed";

export default function SignInForm({ returnTo }: { returnTo: string }) {
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    try {
      const body = new FormData();
      body.set("email", email);
      body.set("return_to", returnTo);

      const response = await fetch("/class/api/auth/sign-in", {
        method: "POST",
        body,
      });

      setState(response.ok ? "sent" : "invalid");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <div className="panel">
        <h2>Check your email</h2>
        <p>
          If <strong>{email}</strong> can receive mail, a sign-in link is on
          its way. It works once, and it expires.
        </p>
        <p className="muted">
          Nothing arrived? It may be in spam, or the address may have a typo.{" "}
          <button type="button" className="link-button" onClick={() => setState("idle")}>
            Try another address
          </button>
        </p>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit}>
      <label>
        Email
        <input
          type="email"
          name="email"
          value={email}
          autoComplete="email"
          autoFocus
          required
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      {state === "invalid" && (
        <p className="error">That does not look like an email address.</p>
      )}
      {state === "failed" && (
        <p className="error">
          Could not reach the server. Check your connection and try again.
        </p>
      )}

      <button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Email me a link"}
      </button>

      <p className="hint">
        No password. Signing in and signing up are the same thing here — if
        you have not used this before, the link creates your account.
      </p>
    </form>
  );
}
