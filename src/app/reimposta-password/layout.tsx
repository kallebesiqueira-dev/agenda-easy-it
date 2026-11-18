import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: lang === "en" ? "New password — Agenda Easy" : "Nuova password — Agenda Easy",
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
