import { requireViewer } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { profile, roles } = await requireViewer();

  return (
    <main className="page">
      <h1>Hello, {profile.displayName}</h1>
      <p className="muted">
        Signed in as {profile.email} · {[...roles].join(", ")}
      </p>

      <form method="post" action="/class/api/auth/sign-out">
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
