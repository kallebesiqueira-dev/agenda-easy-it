"use server";

/**
 * Entra nella conta demo. Email e password restano solo sul server
 * (DEMO_EMAIL / DEMO_PASSWORD): il browser non le riceve mai.
 */

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInDemo(): Promise<{ error: "unavailable" } | never> {
  const email = process.env.DEMO_EMAIL?.trim();
  const password = process.env.DEMO_PASSWORD;
  if (
    !email ||
    !password ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { error: "unavailable" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "unavailable" };

  redirect("/app");
}
