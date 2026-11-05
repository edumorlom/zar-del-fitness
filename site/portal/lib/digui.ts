// Quién es el cliente para el chat de Digui (su conector SQL busca sus filas por customer_id), firmado para que el
// visitante no lo cambie. Lo verifica assistant/visitors.py en el repo de Digui.
import { createHmac } from "node:crypto";

/** La recepcionista de Zar en Digui: el chat que carga portal/components/DiguiChat.tsx. */
export const DIGUI_RECEPTIONIST = "zardelfitness-com-ar-a6ee069f50c6145f";

/**
 * exp (segundos Unix) y la firma: HMAC-SHA256 (hex) del JSON {"exp","params","receptionist"}, sin espacios y con las
 * claves ordenadas (las de params también).
 * shortcut: vence en 12 h (Digui acepta hasta 24); una pestaña abierta más tiempo chatea sin el customer_id hasta recargar.
 */
export function signVisitor(secret: string, receptionist: string, params: Record<string, string>, exp = Math.floor(Date.now() / 1000) + 12 * 3600) {
  const signature = createHmac("sha256", secret).update(JSON.stringify({ exp, params, receptionist })).digest("hex");
  return { exp, signature };
}
