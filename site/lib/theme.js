/**
 * Theme selection.
 *
 * The choice lives in one place at runtime: the data-theme attribute on
 * <html>. CSS reads that attribute for the palette and for the toggle's
 * label, so nothing has to be mirrored into React state.
 *
 * Three states. "auto" is the absence of the attribute, which leaves the
 * prefers-color-scheme media query in charge — so following the system
 * stays the default, and keeps working with JavaScript disabled.
 */
export const THEME_KEY = "theme";

/**
 * Runs synchronously in <head>, before the browser paints anything.
 *
 * This is the reason it is a raw string rather than a component: a stored
 * preference has to be applied before first paint, otherwise the page
 * renders in the system theme and then flips, which is exactly the flash
 * the setting exists to avoid.
 *
 * Storage can throw (private mode, blocked cookies). A reader who has
 * never chosen anything is the common case anyway, so failing quietly
 * back to the system preference is the right outcome.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}})();`;
