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
  title: "Agenda Easy — Agendamento online com sinal via Pix",
  description:
    "Página de agendamento online para qualquer serviço com hora marcada. Seus clientes reservam horário e pagam sinal de 50% — você só confirma quem vai aparecer.",
  openGraph: {
    title: "Agenda Easy — Sua agenda cheia, seu WhatsApp em paz",
    description:
      "Agendamento online com sinal de 50% para qualquer serviço com hora marcada.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    title: "AgendaEasy", // nome do atalho ao salvar na tela inicial (iOS)
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
