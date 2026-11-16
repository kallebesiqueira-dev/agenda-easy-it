import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import { SilkBackground } from "@/components/silk-background";
import { getLang } from "@/lib/i18n/server";
import "./globals.css";

// Inter resta come fallback universale fuori da Apple.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// Font dell'interfaccia: Satoshi (Fontshare, licenza libera), self-hosted.
const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.ttf",
  weight: "300 900",
  display: "swap",
  variable: "--font-satoshi",
});

// Font display editoriale per i titoli (come CTRL Quotes).
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-instrument",
});

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#f5f5f7",
  colorScheme: "light",
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
      className={`${satoshi.variable} ${instrument.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SilkBackground />
        {children}
      </body>
    </html>
  );
}
