/**
 * Client Supabase para Server Components, Server Actions e Route Handlers.
 * Sessão lida dos cookies da requisição — `cookies()` é assíncrono no Next 16.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components não podem gravar cookies; o proxy.ts
            // cuida da renovação de sessão nesse caso.
          }
        },
      },
    }
  );
}
