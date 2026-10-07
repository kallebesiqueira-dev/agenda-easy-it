/** Lettura della lingua lato server (Server Components / pages / layouts). */

import { cookies } from "next/headers";
import { LANG_COOKIE, normalizeLang, type Lang } from "./index";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return normalizeLang(store.get(LANG_COOKIE)?.value);
}
