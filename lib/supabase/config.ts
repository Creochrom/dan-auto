/**
 * Supabase server-side configuration.
 * Validates required env vars at module load time.
 * Server-only — no NEXT_PUBLIC_ prefix. Never import from client components.
 */

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `[Supabase] Missing required environment variable: ${name}. ` +
        `Add it to .env.local (dev) or Vercel dashboard (production).`
    );
  }
  return value;
}

export function getSupabaseConfig() {
  return {
    url: requireEnv("SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
