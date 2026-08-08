import SearchClient from "./search-client";

export const metadata = {
  title: "Search",
  description:
    "Search every article by text, topic, grammar point, level, or keyword.",
};

export default function SearchPage() {
  return (
    <>
      <h1 className="page-title">Search</h1>
      <SearchClient />
    </>
  );
}
