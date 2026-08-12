"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ArticleSummary from "@/app/article-summary";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "science-environment" -> "Science Environment" — generic, so a new
 * topic value never needs a hand-written label added here. */
function formatTopic(topic) {
  return topic.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Homepage body: a topic filter (derived from every article's `topic`
 * front matter) sitting above an Articles/Series tab pair. Client-side
 * because the site is a static export — there's no server to filter or
 * route through, so both the topic and the active tab are plain React
 * state and the underlying `articles`/`series` arrays (already read at
 * build time by app/page.js) are filtered in the browser.
 *
 * The topic filter applies to whichever tab is active: on the Articles
 * tab it filters articles directly; on the Series tab it keeps a series
 * if *any* of its articles match the selected topic (a series can in
 * principle span more than one topic, so this is looser than an exact
 * match on the whole group).
 */
export default function HomeClient({ articles, series }) {
  const topics = useMemo(() => {
    const set = new Set(articles.map((article) => article.topic).filter(Boolean));
    return [...set].sort();
  }, [articles]);

  const [topic, setTopic] = useState(null);
  const [tab, setTab] = useState("articles");

  const filteredArticles = useMemo(
    () => (topic ? articles.filter((article) => article.topic === topic) : articles),
    [articles, topic],
  );

  const filteredSeries = useMemo(
    () =>
      topic
        ? series.filter((group) =>
            group.articles.some((article) => article.topic === topic),
          )
        : series,
    [series, topic],
  );

  return (
    <>
      <p className="intro">
        Short articles for English conversation practice. Each one opens with a
        grammar point, then uses it naturally in the text, and ends with
        questions to talk through.
      </p>

      {topics.length > 0 && (
        <nav className="topic-nav" aria-label="Filter by topic">
          <button
            type="button"
            className={topic === null ? "is-active" : undefined}
            aria-pressed={topic === null}
            onClick={() => setTopic(null)}
          >
            All
          </button>
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              className={topic === t ? "is-active" : undefined}
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
            >
              {formatTopic(t)}
            </button>
          ))}
        </nav>
      )}

      <div className="home-tabs" role="tablist" aria-label="Articles or Series">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "articles"}
          className={tab === "articles" ? "is-active" : undefined}
          onClick={() => setTab("articles")}
        >
          Articles
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "series"}
          className={tab === "series" ? "is-active" : undefined}
          onClick={() => setTab("series")}
        >
          Series
        </button>
      </div>

      {tab === "series" ? (
        filteredSeries.length > 0 ? (
          <section className="series-section">
            <ul className="series-list">
              {filteredSeries.map((group) => (
                <li key={group.slug}>
                  <h3>
                    <Link href={`/articles/${group.articles[0].slug}`}>
                      {group.title}
                    </Link>
                  </h3>
                  {group.description && (
                    <p className="series-description">{group.description}</p>
                  )}
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
        ) : (
          <p className="empty-note">No series for this topic yet.</p>
        )
      ) : filteredArticles.length > 0 ? (
        <ul className="article-list">
          {filteredArticles.map((article) => (
            <ArticleSummary
              key={article.slug}
              href={`/articles/${article.slug}`}
              title={article.title}
              excerpt={article.summary}
              coverImage={article.cover_image_thumb ?? article.cover_image}
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
      ) : (
        <p className="empty-note">No articles for this topic yet.</p>
      )}
    </>
  );
}
