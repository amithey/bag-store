import { createClient } from "@supabase/supabase-js";

// Values pasted into Vercel's dashboard or CLI can carry a trailing line break.
// In a URL that is harmless, but in the apikey request header it is rejected,
// so every value is trimmed before it is used.
function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

// Public client: uses the publishable key, so Row Level Security applies
// (it only ever sees products with is_active = true).
export function getSupabaseBrowserClient() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!url || !key) return null;
  return createClient(url, key);
}

// Admin client: uses the service role key and bypasses RLS. Server-only —
// never import this from client components and never give the key a
// NEXT_PUBLIC_ prefix.
export function getSupabaseAdminClient() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
