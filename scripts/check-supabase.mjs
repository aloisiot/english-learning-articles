/**
 * `npm run check:supabase` — is the Supabase project reachable?
 *
 * Not part of `npm run verify`, deliberately. The gate has to pass on a
 * machine with no credentials and in CI, and a check that needs a live
 * third-party project would make the gate fail for reasons that have
 * nothing to do with the change being pushed. This is the thing you run
 * once after creating the project, and again whenever sign-in starts
 * failing and you want to know which half is broken.
 *
 * It reads class/.env so that it works the same way the dev server does.
 */
import { readFileSync } from "node:fs";

function loadEnv(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, name, value] = match;
    if (!process.env[name]) {
      process.env[name] = value.replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv("class/.env");
loadEnv("class/.env.local");

const missing = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
].filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`\n✗ Not configured yet. Missing: ${missing.join(", ")}`);
  console.error(
    "\n  Set them in class/.env (see class/.env.example) and in the class",
  );
  console.error("  app's Vercel project, Production environment.\n");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

if (error) {
  console.error(`\n✗ Reached ${process.env.SUPABASE_URL} but it refused:`);
  console.error(`  ${error.message}\n`);
  process.exit(1);
}

console.log(`✓ Supabase reachable at ${process.env.SUPABASE_URL}`);
