"use client";

import { THEME_KEY } from "@/lib/theme";
import { AutoIcon, MoonIcon, SunIcon } from "@english-learning/lib";

const ORDER = ["auto", "light", "dark"];

/**
 * Cycles auto → light → dark.
 *
 * Deliberately stateless. The attribute on <html> is the state, CSS derives
 * both the icon and the word from it, and so this component renders
 * identically on the server and the client — there is no hydration mismatch
 * to suppress and no moment where the button shows the wrong theme.
 */
export default function ThemeToggle() {
  function cycle() {
    const root = document.documentElement;
    const next =
      ORDER[(ORDER.indexOf(root.dataset.theme ?? "auto") + 1) % ORDER.length];

    if (next === "auto") delete root.dataset.theme;
    else root.dataset.theme = next;

    // If storage is unavailable the choice still applies to this page view,
    // it simply is not remembered.
    try {
      if (next === "auto") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {}
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      title="Switch between automatic, light and dark"
    >
      {/* Reads as "Theme: Auto" to a screen reader, which describes the
          control and its current value without a dynamic aria-label. Only
          the shown state contributes: the other two are display:none, and
          so are left out of the accessible name. */}
      <span className="visually-hidden">Theme: </span>

      <span className="theme-state theme-state-auto">
        <AutoIcon />
        <span className="theme-word">Auto</span>
      </span>
      <span className="theme-state theme-state-light">
        <SunIcon />
        <span className="theme-word">Light</span>
      </span>
      <span className="theme-state theme-state-dark">
        <MoonIcon />
        <span className="theme-word">Dark</span>
      </span>
    </button>
  );
}
