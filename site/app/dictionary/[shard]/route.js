import { loadShard, shardIds } from "@/lib/dictionary";

// On `output: "export"` this renders each shard to a static file at build
// time. Removing this line is the entire migration to a live API route —
// the client fetch call never changes. See research/dictionary/01-architecture-fit.md §3.
export const dynamic = "force-static";

export function generateStaticParams() {
  return shardIds().map((shard) => ({ shard }));
}

export async function GET(_request, { params }) {
  const { shard } = await params;
  return Response.json(loadShard(shard));
}
