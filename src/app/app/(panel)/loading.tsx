/** Skeleton con shimmer mentre la pagina del pannello carica. */
import { getLang } from "@/lib/i18n/server";

export default async function Loading() {
  const lang = await getLang();
  return (
    <div aria-busy="true" aria-label={lang === "en" ? "Loading" : "Caricamento"} className="space-y-6">
      <div className="ui-skeleton h-10 w-56" />
      <div className="ios-group">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="ios-row gap-4 py-4">
            <div className="ui-skeleton h-5 w-12" />
            <div className="flex-1 space-y-2">
              <div className="ui-skeleton h-4 w-2/3" />
              <div className="ui-skeleton h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
