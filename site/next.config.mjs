/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static output — every page is pre-rendered HTML at build time.
  // Good for SEO (crawlers see complete content, no JS execution needed)
  // and lets Pagefind index the built HTML later.
  output: "export",

  // Emit articles/<slug>/index.html rather than articles/<slug>.html, so
  // Pagefind reports clean result URLs like /articles/<slug>/.
  trailingSlash: true,
};

export default nextConfig;
