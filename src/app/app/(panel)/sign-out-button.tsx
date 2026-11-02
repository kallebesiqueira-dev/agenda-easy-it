"use client";

import { useRouter } from "next/navigation";
import { IconLogout } from "@/components/icons";
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
      className="flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900"
    >
      <IconLogout size={17} />
      <span className="hidden sm:inline">{lang === "en" ? "Sign out" : "Esci"}</span>
    </button>
  );
}
