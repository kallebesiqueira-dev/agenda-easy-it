/**
 * Callback OAuth/recovery do Supabase: troca o ?code= por sessão (cookies)
 * e redireciona. Usado pelo login Google e pelo link de redefinição de senha.
 */

import { NextResponse } from "next/server";
import { DASHBOARD_PATH, safeNextPath } from "@/lib/safe-next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  // Sem code não há troca de sessão — volta ao login em vez de honrar o next.
  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }
  const dest = new URL(next, url.origin);
  if (dest.origin !== url.origin) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, url.origin));
  }
  return NextResponse.redirect(dest);
}
