"use client";

/**
 * Lingua corrente lato client, letta dal cookie `lang`.
 * useSyncExternalStore: il server renderizza "it" e il client si riallinea
 * subito dopo l'hydration senza errori di mismatch.
 */

import { useSyncExternalStore } from "react";
import { normalizeLang, type Lang } from "./index";

function subscribe(): () => void {
  return () => {};
}

function readLangCookie(): Lang {
  const match = document.cookie.match(/(?:^|; )lang=(en|it)/);
  return normalizeLang(match?.[1]);
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLangCookie, () => "it");
}
