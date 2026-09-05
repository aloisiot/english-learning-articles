/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static output — every page is pre-rendered HTML at build time.
  // Good for SEO (crawlers see complete content, no JS execution needed)
  // and lets Pagefind index the built HTML later.
  output: "export",

  // Emit articles/<slug>/index.html rather than articles/<slug>.html, so
  // Pagefind reports clean result URLs like /articles/<slug>/.
  trailingSlash: true,

  // The shared workspace package ships TypeScript source rather than a
  // build, so Next has to compile it. It arrives through a symlink and is
  // otherwise indistinguishable from a published dependency, which Next
  // would leave alone. See lib/README.md.
  transpilePackages: ["@english-learning/lib"],
};

export default nextConfig;
