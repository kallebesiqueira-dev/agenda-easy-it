"use client";

import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/use-lang";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const lang = useLang();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100"
    >
      {lang === "en" ? "Sign out" : "Esci"}
    </button>
  );
}
