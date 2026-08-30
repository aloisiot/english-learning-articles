/**
 * Deployment configuration for the articles site.
 *
 * TypeScript rather than JSON for exactly one reason: the class app's
 * host has to differ per environment. vercel.json is static — Vercel's
 * routing layer reads it from the repo, so a rewrite destination there
 * can only ever be a literal, and pointing a preview of this site at a
 * preview of the class app would mean editing a committed file. A
 * vercel.ts is evaluated at build time and can read the environment, so
 * the destination becomes something each Vercel environment sets for
 * itself.
 *
 * `import type` is deliberate. The types come from @vercel/config, but
 * nothing is imported at runtime, so evaluating this file cannot fail on
 * module resolution — the one new way a config file could break that a
 * JSON file could not.
 */
import type { VercelConfig } from "@vercel/config/v1";

/**
 * The class app's host for this environment, e.g. `class.example.com` or
 * `english-learning-class.vercel.app`.
 *
 * Throwing rather than defaulting is the whole point of doing this in
 * code. An unset variable interpolated into a template string yields
 * `https://undefined/class/:path*`, which is a perfectly valid config
 * that fails at the edge on every request to /class — a broken deploy
 * that looks like a successful one. Failing here fails the build
 * instead, which is where a missing variable should be noticed. This
 * mirrors `required()` in class/server/config.ts, for the same reason.
 *
 * A scheme or trailing slash is stripped rather than rejected: the value
 * is typed into a dashboard field by hand, `https://` is the obvious
 * thing to paste, and being strict about it would fail a build over
 * something unambiguous.
 */
function classAppDomain(): string {
  const value = process.env.CLASS_APP_DOMAIN;

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      "CLASS_APP_DOMAIN is not set. It is the class app's host for this " +
        "environment — the Vercel project's domain, without a scheme, e.g. " +
        "english-learning-class.vercel.app. Set it on the site project in " +
        "Vercel (Settings -> Environment Variables) for every environment " +
        "that serves /class, and in site/.env.local for local builds. " +
        "Without it the /class rewrite has nowhere to point.",
    );
  }

  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

export const config: VercelConfig = {
  // Not a framework Vercel builds — `npm run build` produces a static
  // export and Vercel is told to deploy the folder.
  framework: null,
  outputDirectory: "out",
  buildCommand: "npm run build",

  // The lockfile lives at the repo root now that site/, class/ and lib/
  // are npm workspaces, so the install has to run from there even though
  // this project's Root Directory is site/
  // (research/video-calls/07-two-app-architecture.md §5).
  installCommand: "cd .. && npm ci",

  trailingSlash: true,

  // The class app is a separate Vercel project reached through this
  // rewrite, which is what keeps both apps on one domain without the
  // dynamic app sitting in the request path of every article page
  // (research/video-calls/07-two-app-architecture.md §4). The class app
  // sets basePath: "/class" so its own routes line up with this source.
  rewrites: [
    {
      source: "/class/:path*",
      destination: `https://${classAppDomain()}/class/:path*`,
    },
  ],
};
