import { getAllArticles, getAllSeries } from "@/lib/articles";
import HomeClient from "@/app/home-client";

/**
 * Server component: reads content/ at build time (static export, so this
 * only ever runs at build) and hands the plain data to HomeClient, which
 * owns the topic filter + Articles/Series tabs as client-side state.
 */
export default function Home() {
  const articles = getAllArticles();
  const series = getAllSeries();

  return <HomeClient articles={articles} series={series} />;
}
