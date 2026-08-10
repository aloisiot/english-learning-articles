import Link from "next/link";

/**
 * One entry in an article list — the shared layout behind both the
 * homepage's full article list and the search page's results list.
 * The two only ever differed in *where* the data comes from (front
 * matter read at build time vs. a Pagefind search result resolved in
 * the browser), never in how an entry should look, so that layout
 * lives here once instead of twice.
 *
 * `href` takes a Next.js internal path (rendered via `<Link>`) unless
 * `external` is set, in which case it's rendered as a plain `<a>` —
 * search results are plain URL strings from Pagefind, not routes.
 *
 * Excerpt: `excerptHtml` takes precedence when present (search results
 * arrive pre-highlighted with `<mark>` from Pagefind, so they need
 * `dangerouslySetInnerHTML`); otherwise `excerpt` is rendered as plain
 * text. Neither is required — an entry can be title + meta only.
 *
 * `meta` is a flat array of already-formatted strings (date, topic,
 * grammar point, level, …) rendered as the usual `.meta` spans; the
 * caller decides which fields apply and in what order, since the
 * homepage and search page don't always have the same fields on hand.
 */
export default function ArticleSummary({
  href,
  title,
  excerpt,
  excerptHtml,
  coverImage,
  coverImageAlt,
  meta = [],
  external = false,
}) {
  return (
    <li className={coverImage ? "article-summary has-cover" : "article-summary"}>
      {coverImage && (
        <img
          className="article-summary-cover"
          src={coverImage}
          alt={coverImageAlt ?? ""}
        />
      )}
      <div className="article-summary-body">
        <h2>
          {external ? (
            <a href={href}>{title}</a>
          ) : (
            <Link href={href}>{title}</Link>
          )}
        </h2>

        {excerptHtml ? (
          <p
            className="search-excerpt"
            dangerouslySetInnerHTML={{ __html: excerptHtml }}
          />
        ) : (
          excerpt && <p>{excerpt}</p>
        )}

        {meta.length > 0 && (
          <div className="meta">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
