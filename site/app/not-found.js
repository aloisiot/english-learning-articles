import Link from "next/link";

/*
  Without this file Next.js falls back to its built-in 404, which injects
  its own `body { color: #000; background: #fff }`. That overrides the
  theme tokens in globals.css — so the page rendered light and off-palette
  even in dark mode, and no amount of CSS elsewhere could reach it.
  Defining not-found.js replaces the default component and its styles
  entirely, and the page then inherits the layout like any other route.

  Under `output: "export"` this is what becomes out/404.html.
*/

export const metadata = {
  title: "Page not found",
  // A 404 has nothing worth indexing, and shouldn't dilute search results
  // for real articles.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <h1 className="page-title">Page not found</h1>

      <p className="empty-note">
        This address doesn&rsquo;t match an article. It may have been moved, or
        the link may be incomplete.
      </p>

      <p className="empty-note">
        Try the <Link href="/search/">search page</Link>, or start again from{" "}
        <Link href="/">all articles</Link>.
      </p>

      <Link href="/" className="back">
        ← All articles
      </Link>
    </>
  );
}
