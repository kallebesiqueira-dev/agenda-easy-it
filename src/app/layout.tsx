import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:8888");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Agenda Easy — Prenotazioni online con acconto",
  description:
    "Pagina di prenotazione online per qualsiasi servizio su appuntamento. I tuoi clienti prenotano e versano un acconto del 50% — tu confermi solo chi si presenterà davvero.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Agenda Easy — Agenda piena, WhatsApp in pace",
    description:
      "Prenotazioni online con acconto del 50% per qualsiasi servizio su appuntamento.",
    type: "website",
    locale: "it_IT",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    title: "AgendaEasy", // nome della scorciatoia salvata nella home (iOS)
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
