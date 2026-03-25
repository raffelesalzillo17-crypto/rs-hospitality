import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase server-side con service role key (fallback: anon key).
 * Usare solo in API routes (mai in Client Components).
 */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
