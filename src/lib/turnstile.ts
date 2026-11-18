/**
 * Cloudflare Turnstile. Se NEXT_PUBLIC_TURNSTILE_SITE_KEY ou
 * TURNSTILE_SECRET_KEY faltarem, a verificação fica desligada e o acesso
 * segue. O segredo nunca sai do servidor.
 */

import { headers } from "next/headers";

export type TurnstileAction = "login" | "signup" | "recover";

export function turnstileSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return key ? key : null;
}

export async function verifyTurnstile(
  token: string | undefined,
  action: TurnstileAction
): Promise<"ok" | "skip" | "fail"> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!turnstileSiteKey() || !secret) return "skip";
  // Sem token o widget não chegou a responder (domínio, script, timeout). Não trava o login.
  if (!token || token.length > 2048) return "skip";

  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const host = (headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "")
    .split(",")[0]
    ?.trim()
    .split(":")[0];

  let result: { success?: boolean; action?: string; hostname?: string; "error-codes"?: string[] };
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(forwarded ? { remoteip: forwarded } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return "skip";
    result = (await response.json()) as typeof result;
  } catch {
    return "skip";
  }

  if (result.success === true) {
    if (result.action && result.action !== action) return "fail";
    if (result.hostname && host && result.hostname !== host) return "fail";
    return "ok";
  }

  const codes = result["error-codes"] ?? [];
  const config =
    codes.includes("missing-input-secret") ||
    codes.includes("invalid-input-secret") ||
    codes.includes("internal-error");
  return config ? "skip" : "fail";
}
