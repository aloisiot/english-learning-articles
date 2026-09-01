/**
 * Deployment configuration for the articles site.
 *
 * **The rewrite destination is a literal, and has to be.**
 *
 * This file previously computed it from a `CLASS_APP_DOMAIN` environment
 * variable, so that a preview of this site could point at a preview of
 * the class app. That does not work, and the way it failed is worth
 * recording so it is not tried again the same way.
 *
 * Vercel validates this config *before* the build starts — the failed
 * deployment has no build log at all, only:
 *
 *   The `vercel.ts` schema validation failed with the following message:
 *   `rewrites[0]` missing required property `destination`
 *
 * Every literal field below passed that validation. The single computed
 * one resolved to `undefined` and was dropped, which is what "missing"
 * means here. So the config is read in a phase that does not run the
 * file the way Node would, and a destination assembled at that point
 * cannot be relied on.
 *
 * The cost of getting this wrong was high, and it was a design mistake
 * rather than bad luck. The computation deliberately *threw* when the
 * variable was absent, on the reasoning that a loud build failure beats
 * a silent `https://undefined/class/:path*`. That reasoning was wrong in
 * one direction it did not consider: the failure mode it produced was a
 * failed production deploy, and production was rolled back to a commit
 * from before the rewrite existed — so /class served a 404 for as long
 * as nobody noticed. A wrong-but-valid destination breaks /class; an
 * invalid config breaks the entire site's ability to deploy.
 *
 * If per-environment destinations are wanted later, the thing to
 * establish first — on a preview branch, where a failed build costs
 * nothing — is whether *any* value from the environment survives config
 * validation. Vercel's `relatedProjects` is the built-in answer to the
 * same problem and is the better thing to try.
 */
import type { VercelConfig } from "@vercel/config/v1";

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
      // Written out rather than assembled from a constant. Validation
      // rejected the one value this file computed, and with the site's
      // deploys blocked there is no reason to find out experimentally
      // how much evaluation the validator does. It is the class
      // project's stable production domain — its own <name>.vercel.app,
      // not a deployment URL, which changes on every push.
      destination: "https://english-learning-class.vercel.app/class/:path*",
    },
  ],
};
