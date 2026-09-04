/*
  Every icon in the product, in one place.

  Inline SVG rather than an icon set: ten shapes do not justify a
  dependency that ships hundreds, and inline markup keeps both apps free
  of an external request. They inherit `currentColor`, so they take their
  colour from whatever they sit in.

  aria-hidden throughout. Each one sits next to a word that already names
  the control, and announcing both would only repeat it.

  ---

  There are two grids here, and that is deliberate rather than the drift
  07 §3 warned about.

  The articles site draws on a 16-unit box at 16px with a 1.5 stroke, for
  icons that sit inline with text. The call draws on a 24-unit box at
  22px with a 1.8 stroke, for icons that sit alone inside 3rem round
  buttons. Rendered, the strokes land at 1.5px and 1.65px, so the two
  families already read as one hand.

  Redrawing the call's six onto the 16-unit grid would change the call's
  appearance, and Phase 4's gate — a real class, run by two people on two
  networks — is still open. Consolidating the location without touching
  the geometry is what this file does; reconciling the grids is a design
  decision for when the dashboard arrives and there is something to
  reconcile them against.
*/
import type { ReactNode } from "react";

interface IconProps {
  children: ReactNode;
  /** Applied by the site, which styles `.icon`; the call does not. */
  className?: string;
  /** Rendered width and height, in pixels. */
  size: number;
  viewBox: string;
  strokeWidth: number;
}

function Icon({ children, className, size, viewBox, strokeWidth }: IconProps) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Inline with text, on the articles site. */
const TEXT = {
  className: "icon",
  size: 16,
  viewBox: "0 0 16 16",
  strokeWidth: 1.5,
} as const;

/** Alone inside a round button, in the call. */
const CONTROL = {
  size: 22,
  viewBox: "0 0 24 24",
  strokeWidth: 1.8,
} as const;

/* ---------- the site ---------- */

export function SearchIcon() {
  return (
    <Icon {...TEXT}>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.25 10.25 14 14" />
    </Icon>
  );
}

export function SunIcon() {
  return (
    <Icon {...TEXT}>
      <circle cx="8" cy="8" r="3.25" />
      <path d="M8 1.4V2.75M8 13.25V14.6M14.6 8H13.25M2.75 8H1.4M12.67 3.33L11.71 4.29M4.29 11.71L3.33 12.67M12.67 12.67L11.71 11.71M4.29 4.29L3.33 3.33" />
    </Icon>
  );
}

export function MoonIcon() {
  return (
    <Icon {...TEXT}>
      <path d="M14 8.53A6 6 0 1 1 7.47 2 4.67 4.67 0 0 0 14 8.53z" />
    </Icon>
  );
}

/** Half-filled disc: the page takes whichever side the system is on. */
export function AutoIcon() {
  return (
    <Icon {...TEXT}>
      <circle cx="8" cy="8" r="5.75" />
      <path
        d="M8 2.25a5.75 5.75 0 0 1 0 11.5z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

/* ---------- the call ---------- */

/** A line through the icon, for the "off" half of a toggle. */
function Slash() {
  return <line x1="3" y1="21" x2="21" y2="3" />;
}

export function MicIcon({ on }: { on: boolean }) {
  return (
    <Icon {...CONTROL}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      {on ? null : <Slash />}
    </Icon>
  );
}

export function CameraIcon({ on }: { on: boolean }) {
  return (
    <Icon {...CONTROL}>
      <rect x="2" y="6" width="13" height="12" rx="2.5" />
      <path d="M15 10.5 22 7v10l-7-3.5z" />
      {on ? null : <Slash />}
    </Icon>
  );
}

export function ScreenIcon({ on }: { on: boolean }) {
  return (
    <Icon {...CONTROL}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      {on ? null : <Slash />}
    </Icon>
  );
}

export function ChatIcon() {
  return (
    <Icon {...CONTROL}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6.5A8 8 0 0 1 11 4h2a8 8 0 0 1 8 8z" />
    </Icon>
  );
}

export function LeaveIcon() {
  return (
    <Icon {...CONTROL}>
      <path d="M2.5 15.5a16 16 0 0 1 19 0l-2.5 3-4-1.5v-2.6a12 12 0 0 0-6 0V17l-4 1.5z" />
    </Icon>
  );
}

export function CloseIcon() {
  return (
    <Icon {...CONTROL}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </Icon>
  );
}
