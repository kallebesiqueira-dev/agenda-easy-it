/**
 * Client Supabase para Client Components ("use client").
 * Singleton por aba; cookies gerenciados automaticamente pelo @supabase/ssr.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
