import "server-only";
import type { MpPayment } from "./payments";

// Mercado Pago (Checkout Pro), con el access token de la cuenta del Zar (MP_ACCESS_TOKEN, en Railway). Sin él, el botón
// de pagar avisa que no está disponible y los avisos se ignoran.
const API = "https://api.mercadopago.com";

export const mpConfigured = () => Boolean(process.env.MP_ACCESS_TOKEN);

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T | null> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`Mercado Pago ${method} ${path}: ${res.status} ${await res.text()}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.error(`Mercado Pago ${method} ${path}:`, e);
    return null;
  }
}

export type Checkout = {
  /** El id de la fila en payments: vuelve en cada pago como external_reference. */
  reference: number;
  title: string;
  amount: number;
  currency: string;
  email: string | null;
  /** Adónde vuelve el cliente y adónde avisa Mercado Pago: el portal (https://…/portal, o http://localhost:3000/portal). */
  base: string;
};

/**
 * La preferencia de Checkout Pro: devuelve el link al que va el cliente a pagar. Mercado Pago sólo vuelve solo
 * (auto_return) y sólo avisa (notification_url) a una dirección https; en desarrollo, el pago se confirma al volver
 * (app/(portal)/portal/pago).
 */
export async function createPreference(c: Checkout) {
  const https = c.base.startsWith("https://");
  const back = `${c.base}/pago`;
  const pref = await call<{ id: string; init_point: string }>("POST", "/checkout/preferences", {
    items: [{ id: `pase-${c.reference}`, title: c.title, quantity: 1, unit_price: c.amount, currency_id: c.currency }],
    payer: c.email ? { email: c.email } : undefined,
    external_reference: String(c.reference),
    back_urls: { success: back, pending: back, failure: back },
    ...(https && { auto_return: "approved", notification_url: `${c.base}/api/mercadopago` }),
    statement_descriptor: "ZAR DEL FITNESS",
  });
  return pref?.id && pref.init_point ? pref : null;
}

/** El pago, tal cual lo tiene Mercado Pago: lo único que se cree (un aviso puede mandarlo cualquiera). */
export const getPayment = (id: string) => call<MpPayment>("GET", `/v1/payments/${encodeURIComponent(id)}`);
