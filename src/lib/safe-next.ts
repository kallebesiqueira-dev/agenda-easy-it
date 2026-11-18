/** Destino padrão depois do login: o painel, neste mesmo host. */
export const DASHBOARD_PATH = "/dashboard";

/**
 * Caminho interno seguro. Recusa protocolo, host e barras que viram URL externa.
 */
export function safeNextPath(value: string | null | undefined, fallback = DASHBOARD_PATH): string {
  if (!value) return fallback;
  let path = value;
  try {
    path = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path.includes("\\") || path.includes("://")) return fallback;
  return path;
}
