import Link from "next/link";
import { getAllArticles, getAllSeries } from "@/lib/articles";

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
          <li key={article.slug}>
            <h2>
              <Link href={`/articles/${article.slug}`}>{article.title}</Link>
            </h2>
            <p>{article.summary}</p>
            <div className="meta">
              <span>{formatDate(article.date)}</span>
              <span>{article.topic}</span>
              <span>{article.grammar_focus}</span>
              <span>{article.level}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
