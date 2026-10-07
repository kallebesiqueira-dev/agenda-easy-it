/**
 * Client Supabase com service role — IGNORA RLS. Uso exclusivo no servidor
 * (route handlers / server actions); jamais importar em componentes client.
 * A chave secreta nunca tem o prefixo NEXT_PUBLIC_.
 */

import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY ausente no ambiente.");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
