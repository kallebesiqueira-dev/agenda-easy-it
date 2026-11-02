import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { getLang } from "@/lib/i18n/server";
import "./globals.css";

// Stack di sistema SF Pro; Inter solo come fallback su Android/Windows.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://agendaeasy.it"
    : "http://localhost:7778");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Agenda Easy — Prenotazioni online per la tua attività",
  description:
    "Pagina di prenotazione online per qualsiasi servizio su appuntamento. I tuoi clienti prenotano da soli; tu gestisci agenda, servizi, prodotti e promozioni da un unico pannello.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Agenda Easy — Agenda piena, WhatsApp in pace",
    description:
      "Prenotazioni online, prodotti in vetrina e piani/promozioni editabili per qualsiasi servizio su appuntamento.",
    type: "website",
    locale: "it_IT",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    title: "AgendaEasy", // nome della scorciatoia salvata nella home (iOS)
    statusBarStyle: "default",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
