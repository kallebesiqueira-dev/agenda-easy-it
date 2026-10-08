import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgendaEasy",
    short_name: "AgendaEasy",
    description:
      "Prenotazioni online con acconto per qualsiasi servizio su appuntamento.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#17493b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android (icona adattiva): richiede purpose "maskable"
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
