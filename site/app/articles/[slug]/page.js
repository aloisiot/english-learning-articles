import Link from "next/link";
import { getAllArticles, getArticle, getSeriesArticles } from "@/lib/articles";

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
          data-pagefind-filter={`series:${article.series_title ?? article.series}`}
        />
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
        aria-label={`${article.series_title ?? "Series"} articles`}
        data-pagefind-ignore
      >
        <p className="series-nav-label">Series</p>
        <p className="series-nav-title">{article.series_title ?? article.series}</p>
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
