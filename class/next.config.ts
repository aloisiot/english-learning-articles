import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served at /class on the articles site's domain via the
  // site/microfrontends.json routing (see research/video-calls/07-two-app-architecture.md
  // §4). This has to line up with that rewrite's source path so the
  // app's own routes and asset paths resolve correctly.
  basePath: "/class",

  // As in site/next.config.mjs: the shared package is TypeScript source
  // compiled by each consumer, not a build. See lib/README.md.
  transpilePackages: ["@english-learning/lib"],
};

export default nextConfig;
