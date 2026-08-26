"use client";

import { useEffect, useReducer, useRef, useState } from "react";

const POS_LABELS = { n: "noun", v: "verb", a: "adjective", r: "adverb" };

// Matches the site's one CSS breakpoint (see globals.css "---------- responsive ----------").
const MOBILE_BREAKPOINT = 480;

// Shared across every mount so a word looked up once is never re-fetched —
// see research/dictionary/05-implementation-plan.md's "lazy-load on first
// selection" guardrail: nothing is fetched until a reader actually asks.
let formsPromise = null;
const shardCache = new Map();

function loadForms() {
  if (!formsPromise) {
    formsPromise = fetch("/dictionary/forms")
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return formsPromise;
}

function loadShard(key) {
  if (!shardCache.has(key)) {
    shardCache.set(
      key,
      fetch(`/dictionary/${key}`)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({})),
    );
  }
  return shardCache.get(key);
}

function shardKeyFor(headword) {
  const first = headword[0];
  return /[a-z]/.test(first) ? first : "misc";
}

/** Lowercase, straighten curly quotes, drop a trailing possessive and stray edge punctuation. */
function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/'s$/, "")
    .replace(/^[^a-z]+|[^a-z-]+$/g, "");
}

/** Try the full selection first (multiword entries like "carbon sink"), then its head word. */
function buildCandidates(text) {
  const clean = text.replace(/[‘’]/g, "'").trim();
  const words = clean.split(/\s+/);
  const candidates = [normalizeWord(clean)];

  if (words.length > 1) {
    candidates.push(normalizeWord(words[words.length - 1]));
    candidates.push(normalizeWord(words[0]));
  } else if (clean.includes("-")) {
    candidates.push(...clean.split("-").map(normalizeWord));
  }

  return [...new Set(candidates)].filter(Boolean);
}

async function lookupWord(text) {
  const forms = await loadForms();
  for (const candidate of buildCandidates(text)) {
    const headword = forms[candidate] ?? candidate;
    const shard = await loadShard(shardKeyFor(headword));
    if (shard[headword]) return { headword, senses: shard[headword] };
  }
  return null;
}

function isLookupable(sel, text) {
  const trimmed = text.trim();
  if (!trimmed || /\n/.test(text)) return false;
  if (trimmed.split(/\s+/).length > 4) return false;
  if (!/[a-zA-Z]/.test(trimmed)) return false;

  for (const node of [sel.anchorNode, sel.focusNode]) {
    const el = node?.nodeType === 1 ? node : node?.parentElement;
    if (!el?.closest(".article-body")) return false;
    if (el.closest("pre, code, h1, h2, h3, h4, h5, h6")) return false;
  }

  return true;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function speak(word) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-GB";
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/**
 * Reader selects a word in `.article-body` → a small "Define" button
 * appears near the selection → tapping it looks the word up (via the
 * build-time forms map + WordNet shards, see lib/dictionary.js) and shows
 * a popover. Two-step rather than an immediate popover, so an ordinary
 * copy-paste never triggers a lookup.
 */
export default function DictionaryPopover() {
  // `range` rather than a one-time rect: a Range's getBoundingClientRect()
  // is always relative to the current scroll position, so re-reading it on
  // every scroll tick is what lets the button/popover track the selected
  // word instead of drifting away from it (or, as before, just closing).
  const [button, setButton] = useState(null); // { text, range }
  const [popover, setPopover] = useState(null); // { text, range, status, headword, senses }
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);
  const [, bumpTick] = useReducer((c) => c + 1, 0);

  useEffect(() => {
    function handleSelectionEnd(e) {
      // A click on our own button/popover bubbles to this listener too;
      // it doesn't change the text selection, so re-reading it here would
      // just re-show the button on top of (or instead of) the popover.
      if (buttonRef.current?.contains(e.target)) return;
      if (popoverRef.current?.contains(e.target)) return;

      // Let the browser finish updating the selection before reading it.
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;

        const text = sel.toString();
        if (!isLookupable(sel, text)) return;

        setPopover(null);
        setButton({ text: text.trim(), range: sel.getRangeAt(0).cloneRange() });
      }, 0);
    }

    function handlePointerDown(e) {
      if (buttonRef.current?.contains(e.target)) return;
      if (popoverRef.current?.contains(e.target)) return;
      setButton(null);
      setPopover(null);
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setButton(null);
        setPopover(null);
      }
    }

    document.addEventListener("mouseup", handleSelectionEnd);
    document.addEventListener("touchend", handleSelectionEnd);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mouseup", handleSelectionEnd);
      document.removeEventListener("touchend", handleSelectionEnd);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // While a button or popover is showing, re-render on every scroll/resize
  // so its position (recomputed from the live Range below) stays correct
  // instead of freezing at the spot the selection started.
  useEffect(() => {
    if (!button && !popover) return;

    let frame = null;
    function onViewportChange() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        bumpTick();
      });
    }

    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    return () => {
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [button, popover]);

  useEffect(() => {
    if (popover?.status === "loading") popoverRef.current?.focus();
  }, [popover?.status]);

  async function handleDefine() {
    const { text, range } = button;
    setButton(null);
    setPopover({ text, range, status: "loading" });

    const result = await lookupWord(text);
    setPopover((prev) =>
      prev?.text === text
        ? { ...prev, status: result ? "found" : "empty", ...result }
        : prev,
    );
  }

  if (button) {
    const rect = button.range.getBoundingClientRect();
    const top = clamp(rect.bottom + 8, 8, window.innerHeight - 40);
    const left = clamp(rect.left, 8, window.innerWidth - 96);
    return (
      <button
        ref={buttonRef}
        type="button"
        className="dictionary-define-button"
        style={{ top, left }}
        onClick={handleDefine}
        data-pagefind-ignore
      >
        Define
      </button>
    );
  }

  if (popover) {
    const rect = popover.range.getBoundingClientRect();
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const senses = (popover.senses ?? []).slice(0, 2);

    // Desktop: a small card clamped to stay on-screen near the selection.
    // Mobile: a full-width sheet, pinned to whichever edge is farther from
    // the word — so it never covers the thing you just selected — and
    // re-evaluated on every scroll tick, which is what makes it flip
    // edges as the word crosses the vertical middle of the viewport.
    let style;
    let sheetClass = "";
    if (isMobile) {
      const wordCenter = rect.top + rect.height / 2;
      const placement = wordCenter > window.innerHeight / 2 ? "top" : "bottom";
      style =
        placement === "top"
          ? { top: 0, left: 0, right: 0, bottom: "auto" }
          : { bottom: 0, left: 0, right: 0, top: "auto" };
      sheetClass = ` dictionary-popover--sheet dictionary-popover--${placement}`;
    } else {
      style = {
        top: clamp(rect.bottom + 8, 8, window.innerHeight - 40),
        left: clamp(rect.left, 8, window.innerWidth - 336),
      };
    }

    return (
      <div
        ref={popoverRef}
        role="dialog"
        aria-label={`Dictionary: ${popover.headword ?? popover.text}`}
        tabIndex={-1}
        className={`dictionary-popover${sheetClass}`}
        style={style}
        data-pagefind-ignore
      >
        <div className="dictionary-popover-header">
          <span className="dictionary-headword">
            {popover.headword ?? popover.text}
          </span>
          {popover.status === "found" && (
            <button
              type="button"
              className="dictionary-audio"
              onClick={() => speak(popover.headword)}
            >
              <span aria-hidden="true">🔊</span> Listen
            </button>
          )}
          <button
            type="button"
            className="dictionary-close"
            aria-label="Close definition"
            onClick={() => setPopover(null)}
          >
            ×
          </button>
        </div>

        {popover.status === "loading" && (
          <p className="dictionary-status">Looking up…</p>
        )}

        {popover.status === "empty" && (
          <p className="dictionary-status">No entry found.</p>
        )}

        {popover.status === "found" && (
          <>
            <ol className="dictionary-senses">
              {senses.map((sense, i) => (
                <li key={i}>
                  <span className="dictionary-pos">
                    {POS_LABELS[sense.p] ?? sense.p}
                  </span>{" "}
                  {sense.d}
                  {sense.e[0] && (
                    <span className="dictionary-example"> — {sense.e[0]}</span>
                  )}
                </li>
              ))}
            </ol>
            <p className="dictionary-attribution">
              From Princeton WordNet.
            </p>
          </>
        )}
      </div>
    );
  }

  return null;
}
