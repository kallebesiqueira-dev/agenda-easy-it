import type { NextConfig } from "next";

/** Headers de segurança aplicados a todas as rotas. */
const securityHeaders = [
  // Força HTTPS por 2 anos (inclui subdomínios)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Impede o site de ser embutido em iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Browser não "adivinha" content-type (bloqueia SVG/HTML disfarçados)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vaza URLs internas (tokens de cancelamento!) em links externos
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs sensíveis que o app não usa
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
