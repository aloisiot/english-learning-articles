import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

// Kept out of search engines wholesale, at every phase — this app is
// reached only via a signed link (later, a session), never crawled.
export const metadata: Metadata = {
  title: "Class",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
