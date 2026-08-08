"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadPagefind } from "@/lib/pagefind";

const FILTER_LABELS = {
  topic: "Topic",
  grammar: "Grammar point",
  level: "Level",
  series: "Series",
  keyword: "Keyword",
};

const FILTER_ORDER = ["topic", "grammar", "level", "series", "keyword"];

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState({});
  const [sort, setSort] = useState("relevance");

  const [available, setAvailable] = useState({});
  const [results, setResults] = useState([]);
  const [ready, setReady] = useState(false);

  // Guards against a slow response overwriting a newer one.
  const requestId = useRef(0);

  const runSearch = useCallback(async () => {
    const id = ++requestId.current;

    const pagefind = await loadPagefind();

    // Only send filters that actually have a value selected.
    const filters = Object.fromEntries(
      Object.entries(selected).filter(([, value]) => value),
    );

    const options = {};
    if (Object.keys(filters).length > 0) options.filters = filters;
    if (sort === "newest") options.sort = { date: "desc" };
    else if (sort === "oldest") options.sort = { date: "asc" };

    // A null query returns everything matching the filters, which makes
    // the page usable for browsing as well as searching.
    const search = await pagefind.search(query.trim() || null, options);

    // Result bodies are fetched lazily; load the first page of them.
    const loaded = await Promise.all(
      search.results.slice(0, 30).map((result) => result.data()),
    );

    if (id !== requestId.current) return;

    setAvailable(search.filters);
    setResults(loaded);
    setReady(true);
  }, [query, selected, sort]);

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch().catch((error) => {
        // Logged for developers only. The interface stays silent and
        // simply shows no results — never a technical message.
        console.warn("Search unavailable.", error);
        setResults([]);
        setReady(true);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [runSearch]);

  function updateFilter(name, value) {
    setSelected((current) => ({ ...current, [name]: value || undefined }));
  }

  function clearAll() {
    setQuery("");
    setSelected({});
    setSort("relevance");
  }

  const isFiltered =
    query.trim() !== "" ||
    Object.values(selected).some(Boolean) ||
    sort !== "relevance";

  return (
    <div className="search">
      <input
        type="search"
        className="search-input"
        placeholder="Search articles…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus
      />

      <div className="search-controls">
        {FILTER_ORDER.filter((name) => available[name]).map((name) => (
          <label key={name} className="search-control">
            <span>{FILTER_LABELS[name]}</span>
            <select
              value={selected[name] ?? ""}
              onChange={(event) => updateFilter(name, event.target.value)}
            >
              <option value="">All</option>
              {Object.entries(available[name])
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([value, count]) => (
                  <option key={value} value={value} disabled={count === 0}>
                    {value} ({count})
                  </option>
                ))}
            </select>
          </label>
        ))}

        <label className="search-control">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      {ready && (
        <div className="search-summary">
          <span>
            {results.length === 0
              ? "No matching articles"
              : `${results.length} article${results.length === 1 ? "" : "s"}`}
          </span>
          {isFiltered && (
            <button type="button" onClick={clearAll} className="search-clear">
              Clear
            </button>
          )}
        </div>
      )}

      <ul className="article-list">
        {results.map((result) => (
          <li key={result.url}>
            <h2>
              <a href={result.url}>{result.meta?.title}</a>
            </h2>
            <p
              className="search-excerpt"
              dangerouslySetInnerHTML={{ __html: result.excerpt }}
            />
            <div className="meta">
              {result.filters?.topic?.[0] && (
                <span>{result.filters.topic[0]}</span>
              )}
              {result.filters?.grammar?.[0] && (
                <span>{result.filters.grammar[0]}</span>
              )}
              {result.filters?.level?.[0] && (
                <span>{result.filters.level[0]}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
