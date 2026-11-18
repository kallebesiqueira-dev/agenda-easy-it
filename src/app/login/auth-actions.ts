"use server";

/**
 * Login, cadastro e recuperação passam daqui antes do Supabase.
 * O Turnstile, quando as duas chaves existem, é conferido no siteverify.
 */

import { headers } from "next/headers";
import { verifyTurnstile, type TurnstileAction } from "@/lib/turnstile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validation";

type Gate = { error: "turnstile" | "invalid" | "credentials" | "exists" | "create" | "send" };

async function gate(token: string | undefined, action: TurnstileAction): Promise<Gate | null> {
  const check = await verifyTurnstile(token, action);
  if (check === "fail") return { error: "turnstile" };
  return null;
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
  turnstileToken?: string;
}): Promise<Gate | { ok: true }> {
  const blocked = await gate(input.turnstileToken, "login");
  if (blocked) return blocked;

  const parsed = signInSchema.safeParse({ email: input.email, password: input.password });
  if (!parsed.success) return { error: "invalid" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "credentials" };
  return { ok: true };
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  turnstileToken?: string;
}): Promise<Gate | { ok: true; confirm: boolean }> {
  const blocked = await gate(input.turnstileToken, "signup");
  if (blocked) return blocked;

  const parsed = signInSchema.safeParse({ email: input.email, password: input.password });
  if (!parsed.success) return { error: "invalid" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    return { error: error.message.includes("already registered") ? "exists" : "create" };
  }
  return { ok: true, confirm: !data.session };
}

export async function requestPasswordReset(input: {
  email: string;
  turnstileToken?: string;
  redirectTo: string;
}): Promise<Gate | { ok: true }> {
  const blocked = await gate(input.turnstileToken, "recover");
  if (blocked) return blocked;

  const email = input.email.trim();
  if (!email.includes("@") || email.length > 200) return { error: "invalid" };
  if (!input.redirectTo.startsWith("/")) return { error: "send" };

  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  if (!host) return { error: "send" };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${proto}://${host}${input.redirectTo}`,
  });
  if (error) return { error: "send" };
  return { ok: true };
}

/** Só a checagem, para o OAuth do Google continuar no browser. A demo não passa aqui. */
export async function assertTurnstile(input: {
  action: TurnstileAction;
  turnstileToken?: string;
}): Promise<{ ok: true } | { error: "turnstile" }> {
  const blocked = await gate(input.turnstileToken, input.action);
  if (blocked) return { error: "turnstile" };
  return { ok: true };
}
