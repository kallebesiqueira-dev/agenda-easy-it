"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  return letters || email.charAt(0).toUpperCase() || "A";
}

export function UserMenu({
  name,
  email,
  avatarUrl,
  lang,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  lang: Lang;
}) {
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [photoOk, setPhotoOk] = useState(Boolean(avatarUrl));
  const t =
    lang === "en"
      ? { menu: "Account menu", site: "Go to the site", out: "Sign out" }
      : { menu: "Menu account", site: "Vai al sito", out: "Esci" };

  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const items = () => [...(root?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    items()[0]?.focus();

    function onPointer(event: PointerEvent) {
      if (root && !root.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const list = items();
      if (!list.length) return;
      event.preventDefault();
      const index = list.indexOf(document.activeElement as HTMLElement);
      const next = event.key === "ArrowDown" ? index + 1 : index - 1;
      list[(next + list.length) % list.length]?.focus();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const label = name || email || "Account";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t.menu}
        onClick={() => setOpen((value) => !value)}
        className="ui-press grid size-11 place-items-center overflow-hidden rounded-full bg-[var(--accent)] text-[13px] font-semibold text-white"
      >
        {photoOk && avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            width={44}
            height={44}
            referrerPolicy="no-referrer"
            className="size-11 object-cover"
            onError={() => setPhotoOk(false)}
          />
        ) : (
          initials(name, email)
        )}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t.menu}
          className="glass absolute right-0 z-50 mt-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-[16px] p-1.5 shadow-[var(--shadow)]"
        >
          <div className="px-3 py-2">
            <p className="truncate text-[15px] font-semibold">{label}</p>
            {email && <p className="truncate text-[13px] text-[var(--label-2)]">{email}</p>}
          </div>
          <Link role="menuitem" href="/" className="block rounded-[10px] px-3 py-2.5 text-[15px] hover:bg-[var(--fill)] focus:bg-[var(--fill)] focus:outline-none">
            {t.site}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="block w-full rounded-[10px] px-3 py-2.5 text-left text-[15px] hover:bg-[var(--fill)] focus:bg-[var(--fill)] focus:outline-none"
          >
            {t.out}
          </button>
        </div>
      )}
    </div>
  );
}
