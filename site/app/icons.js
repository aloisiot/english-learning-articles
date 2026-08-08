/*
  Inline rather than from an icon set: a handful of shapes does not justify
  a dependency, and inline markup keeps the site free of external requests.

  All of them are drawn on the same 16-unit grid with the same stroke, so
  they sit together without looking collected from different places. They
  inherit currentColor, so they dim and brighten with the text beside them.

  aria-hidden throughout: every one of these sits next to a word that
  already names the control, and announcing both would just repeat it.
*/
function Icon({ children }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function SearchIcon() {
  return (
    <Icon>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.25 10.25 14 14" />
    </Icon>
  );
}

export function SunIcon() {
  return (
    <Icon>
      <circle cx="8" cy="8" r="3.25" />
      <path d="M8 1.4V2.75M8 13.25V14.6M14.6 8H13.25M2.75 8H1.4M12.67 3.33L11.71 4.29M4.29 11.71L3.33 12.67M12.67 12.67L11.71 11.71M4.29 4.29L3.33 3.33" />
    </Icon>
  );
}

export function MoonIcon() {
  return (
    <Icon>
      <path d="M14 8.53A6 6 0 1 1 7.47 2 4.67 4.67 0 0 0 14 8.53z" />
    </Icon>
  );
}

/** Half-filled disc: the page takes whichever side the system is on. */
export function AutoIcon() {
  return (
    <Icon>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 2.25a5.75 5.75 0 0 1 0 11.5z" fill="currentColor" stroke="none" />
    </Icon>
  );
}
