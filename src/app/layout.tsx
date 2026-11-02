import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { getLang } from "@/lib/i18n/server";
import "./globals.css";

// Stessa coppia tipografica della landing, ora in tutta l'app:
// Instrument Sans per l'interfaccia, Fraunces per titoli e numeri "editoriali".
const uiSans = Instrument_Sans({
  variable: "--font-ui-sans",
  subsets: ["latin"],
});

const uiDisplay = Fraunces({
  variable: "--font-ui-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const uiMono = JetBrains_Mono({
  variable: "--font-ui-mono",
  subsets: ["latin"],
});

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
      className={`${uiSans.variable} ${uiDisplay.variable} ${uiMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
