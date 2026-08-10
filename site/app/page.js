import Link from "next/link";
import { getAllArticles, getAllSeries } from "@/lib/articles";
import ArticleSummary from "@/app/article-summary";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function Home() {
  const articles = getAllArticles();
  const series = getAllSeries();

  return (
    <>
      <p className="intro">
        Short articles for English conversation practice. Each one opens with a
        grammar point, then uses it naturally in the text, and ends with
        questions to talk through.
      </p>

      {series.length > 0 && (
        <section className="series-section">
          <h2 className="section-label">Series</h2>
          <ul className="series-list">
            {series.map((group) => (
              <li key={group.slug}>
                <h3>
                  <Link href={`/articles/${group.articles[0].slug}`}>
                    {group.title}
                  </Link>
                </h3>
                <p className="meta">
                  <span>
                    {group.articles.length} article
                    {group.articles.length === 1 ? "" : "s"}
                  </span>
                  <span>{group.articles[0].topic}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="section-label">All Articles</h2>
      <ul className="article-list">
        {articles.map((article) => (
          <ArticleSummary
            key={article.slug}
            href={`/articles/${article.slug}`}
            title={article.title}
            excerpt={article.summary}
            coverImage={article.cover_image}
            coverImageAlt={article.cover_image_alt}
            meta={[
              formatDate(article.date),
              article.topic,
              article.grammar_focus,
              article.level,
            ]}
          />
        ))}
      </ul>
    </>
  );
}
