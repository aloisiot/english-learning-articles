import { notFound } from "next/navigation";

import { adminPath } from "@/server/config.js";
import { secretsMatch } from "@/lib/secret.js";

import LinkForm from "./link-form";

export const dynamic = "force-dynamic";

/**
 * The admin page lives behind an unguessable path segment, and the
 * secret is entered into the form rather than checked here — so this
 * page issues nothing, and reloading it proves nothing. A wrong path is
 * a 404 rather than a 403, which keeps the page's existence quiet.
 *
 * `noindex` comes from the root layout and covers this page with the
 * rest of the app.
 */
export default async function AdminPage({ params }) {
  const { key } = await params;

  if (!secretsMatch(key, adminPath())) {
    notFound();
  }

  return <LinkForm />;
}
