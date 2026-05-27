/**
 * Supabase server client.
 * Uses the service role key — bypasses RLS for all server-side operations.
 * Lazy-initialised so dev servers without Supabase env vars set do not crash
 * unless a route that actually calls Supabase is hit.
 *
 * Import this file only from repositories, services, or API routes.
 * Never import from client components or lib/api/client.ts.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

const GLOBAL_KEY = "__danAutoSupabaseServer";

type GlobalWithClient = typeof globalThis & {
  [GLOBAL_KEY]?: SupabaseClient;
};

/**
 * Returns the singleton Supabase server client.
 * Initialised once per Node.js process; survives Next.js hot-reloads in dev.
 */
export function getSupabaseServerClient(): SupabaseClient {
  const g = globalThis as GlobalWithClient;

  if (!g[GLOBAL_KEY]) {
    const { url, serviceRoleKey } = getSupabaseConfig();
    g[GLOBAL_KEY] = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return g[GLOBAL_KEY];
}
