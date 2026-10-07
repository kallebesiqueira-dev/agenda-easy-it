/**
 * Callback OAuth/recovery do Supabase: troca o ?code= por sessão (cookies)
 * e redireciona. Usado pelo login Google e pelo link de redefinição de senha.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam?.startsWith("/") ? nextParam : "/app";

  // Sem code não há troca de sessão — volta ao login em vez de honrar o next.
  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
