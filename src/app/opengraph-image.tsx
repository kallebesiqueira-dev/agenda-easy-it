import { ImageResponse } from "next/og";

export const alt = "Agenda Easy — Agendamento online com sinal via Pix";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f6f1e7",
          color: "#221c15",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
          agenda<span style={{ fontStyle: "italic", color: "#17493b" }}>easy</span>
          <span style={{ color: "#e4572e" }}>.</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.05,
          }}
        >
          <span>Sua agenda cheia.</span>
          <span>
            Seu WhatsApp{" "}
            <span style={{ fontStyle: "italic", color: "#17493b" }}>em paz.</span>
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#5c554b" }}>
          Agendamento online com sinal de 50% · para qualquer serviço com hora marcada
        </div>
      </div>
    ),
    size
  );
}
