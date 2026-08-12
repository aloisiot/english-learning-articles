import Link from "next/link";
import { Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { themeScript } from "@/lib/theme";
import { SearchIcon } from "./icons";
import ThemeToggle from "./theme-toggle";
import "./globals.css";

/*
  Downloaded at build time and served from this domain — the browser makes
  no request to Google, and Next generates fallback metric overrides so the
  page does not shift as the webfont swaps in.

  Italic is loaded because vocabulary example sentences depend on it, and the
  optical-size axis lets the face adjust contrast between text and display
  sizes on its own. Interface text uses the system sans stack (see
  --font-sans in globals.css), which costs nothing to load.
*/
const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  axes: ["opsz"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: {
    default: "English Learning Articles",
    template: "%s — English Learning Articles",
  },
  description:
    "Short articles for English conversation practice at B2–C1 level, each with a grammar focus, key vocabulary, and discussion questions.",
};

export default function RootLayout({ children }) {
  return (
    // lang="en" is what makes `hyphens: auto` work on the narrow measure.
    // suppressHydrationWarning covers the data-theme attribute that the
    // script below may have added before React hydrates.
    <html lang="en" className={serif.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {/* data-pagefind-ignore keeps site chrome out of the search index.
            The header/footer elements themselves are full-bleed (edge to
            edge); an inner wrapper re-applies the --measure column so the
            title/nav/footer text still lines up with the page content. */}
        <header className="site-header" data-pagefind-ignore>
          <div className="site-header-inner">
            <Link href="/" className="site-title">
              English Learning Articles
            </Link>
            <nav>
              <Link href="/search/" className="nav-search">
                <SearchIcon />
                <span className="nav-search-label">Search</span>
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer" data-pagefind-ignore>
          <div className="site-footer-inner">
            Articles for 30-minute English conversation classes.
          </div>
        </footer>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
