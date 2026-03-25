import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase per Client Components.
 * Usa createBrowserClient da @supabase/ssr per gestire la sessione via cookie
 * in modo coerente con il middleware di autenticazione.
 */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
