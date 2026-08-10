import Link from "next/link";
import {
  getAllArticles,
  getArticle,
  getSeriesArticles,
  getSeriesMeta,
} from "@/lib/articles";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Pre-render one static page per article at build time. */
export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  return {
    title: article.title,
    description: article.summary,
    keywords: article.keywords,
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  const keywords = article.keywords ?? [];
  // Only articles that carry a `series` field get the sidebar — a plain
  // article has no series-navigation UI at all, not even an empty one.
  const seriesArticles = article.series ? getSeriesArticles(article.series) : [];
  // content/series.json is the source of truth for the title; the
  // series_title fallback covers a series that predates the registry.
  const seriesTitle = article.series
    ? getSeriesMeta(article.series).title ?? article.series_title ?? article.series
    : null;

  const articleEl = (
    // data-pagefind-body scopes indexing to this element, so site
    // navigation and footer text never pollute search results.
    <article data-pagefind-body>
      {/*
        Pagefind reads these attributes from the built HTML at index time.
        They are invisible to readers but drive filtering and sorting:
          - filters let the search page narrow by topic/grammar/level/keyword/series
          - the date sort tag enables "newest first" ordering
        Every article must carry the sort tag: pages missing it are excluded
        entirely from results whenever that sort is applied.
      */}
      <div
        hidden
        data-pagefind-sort={`date:${article.date}`}
        data-pagefind-meta={`summary:${article.summary}`}
      />
      <div hidden data-pagefind-filter={`topic:${article.topic}`} />
      <div hidden data-pagefind-filter={`grammar:${article.grammar_focus}`} />
      <div hidden data-pagefind-filter={`level:${article.level}`} />
      {keywords.map((keyword) => (
        <div key={keyword} hidden data-pagefind-filter={`keyword:${keyword}`} />
      ))}
      {article.series && (
        <div
          hidden
          data-pagefind-filter={`series:${seriesTitle}`}
        />
      )}

      {article.cover_image && (
        // Not data-pagefind-ignore on this wrapper (unlike the credit
        // <p> below) — the <img>'s data-pagefind-meta needs to be
        // captured so article-list thumbnails (home + search) have
        // something to render. Images carry no indexable text of their
        // own, so leaving it un-ignored doesn't pollute search matches.
        <div className="cover-image-wrap">
          {/* Plain <img>, not next/image — output: "export" doesn't run
              the Next.js image optimizer (see download-covers.mjs for
              where compression actually happens: hero + a separate
              -thumb.webp, both pre-sized by that script).
              data-pagefind-meta="key[attr]" pulls the value straight off
              this element's own src/alt attributes — Pagefind's built-in
              syntax for exactly this (see english-learning-cover-image
              skill / docs/STYLE-SPEC.md §6b for how it's consumed).
              loading="eager" is the default, set explicitly here because
              this image is always above the fold — the article-list
              thumbnails (app/article-summary.js) are the ones that
              actually benefit from lazy loading. */}
          <img
            className="cover-image"
            src={article.cover_image}
            alt={article.cover_image_alt ?? ""}
            loading="eager"
            decoding="async"
            data-pagefind-meta="cover_image[src], cover_image_alt[alt]"
          />
          {/* cover_image_thumb isn't rendered on the article page itself
              (only the full hero is) — it still needs to reach Pagefind
              so search results can use the smaller file, hence the
              literal key:value form rather than the img[attr] form
              above, which only works on the element it's read from. */}
          {article.cover_image_thumb && (
            <div
              hidden
              data-pagefind-meta={`cover_image_thumb:${article.cover_image_thumb}`}
            />
          )}
          {article.cover_image_credit && (
            <p className="cover-credit" data-pagefind-ignore>
              {article.cover_image_credit}
            </p>
          )}
        </div>
      )}

      <header className="article-header">
        <h1>{article.title}</h1>
        {/* Kept out of the index so it doesn't appear inside excerpts. */}
        <div className="meta" data-pagefind-ignore>
          <span>{formatDate(article.date)}</span>
          <span>{article.topic}</span>
          <span>{article.grammar_focus}</span>
          <span>{article.level}</span>
        </div>
      </header>

      {/*
        One <section> per `##` heading, classed by heading name, so each
        reading mode can be styled on its own without depending on the
        order sections appear in.
      */}
      <div className="article-body">
        {article.sections.map((section) => (
          <section key={section.id} className={`section-${section.name}`}>
            {section.title && <h2 id={section.id}>{section.title}</h2>}
            <div
              className="section-body"
              dangerouslySetInnerHTML={{ __html: section.html }}
            />
          </section>
        ))}
      </div>

      <Link href="/" className="back" data-pagefind-ignore>
        ← All articles
      </Link>
    </article>
  );

  if (seriesArticles.length === 0) {
    return articleEl;
  }

  return (
    <div className="series-layout">
      <nav
        className="series-nav"
        aria-label={`${seriesTitle ?? "Series"} articles`}
        data-pagefind-ignore
      >
        <p className="series-nav-label">Series</p>
        <p className="series-nav-title">{seriesTitle}</p>
        <ol>
          {seriesArticles.map((entry, index) => {
            const isCurrent = entry.slug === article.slug;
            return (
              <li key={entry.slug} aria-current={isCurrent ? "page" : undefined}>
                {isCurrent ? (
                  <span className="series-nav-current">
                    {index + 1}. {entry.title}
                  </span>
                ) : (
                  <Link href={`/articles/${entry.slug}`}>
                    {index + 1}. {entry.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {articleEl}
    </div>
  );
}
