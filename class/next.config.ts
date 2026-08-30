import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served at /class on the articles site's domain via the
  // site/vercel.json rewrite (see research/video-calls/07-two-app-architecture.md
  // §4). This has to line up with that rewrite's source path so the
  // app's own routes and asset paths resolve correctly.
  basePath: "/class",
};

export default nextConfig;
