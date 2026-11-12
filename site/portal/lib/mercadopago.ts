import "server-only";
import type { MpPayment } from "./payments";

// Mercado Pago (Checkout Pro), con el access token de la cuenta del Zar (MP_ACCESS_TOKEN, en Railway). Sin él, el botón
// de pagar no aparece y los avisos se ignoran.
const API = "https://api.mercadopago.com";

// Sin espacios ni el salto de línea que puede quedar al pegarlo en Railway: con eso, fetch ni siquiera manda el pedido.
const token = () => process.env.MP_ACCESS_TOKEN?.trim() || null;

export const mpConfigured = () => Boolean(token());

type Result<T> = { ok: true; data: T } | { ok: false; status: number | null; message: string };

export type MpError = { at: Date; what: string; status: number | null; message: string };
// El último error, para mostrárselo al admin en Pagos (sin tener que entrar a los logs de Railway). Vive en la memoria
// del servidor: se borra con cada despliegue.
const g = globalThis as unknown as { mpLastError?: MpError };
export const lastMpError = () => g.mpLastError ?? null;

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<Result<T>> {
  const t = token();
  if (!t) return { ok: false, status: null, message: "Falta MP_ACCESS_TOKEN." };
  const fail = (status: number | null, message: string): Result<T> => {
    console.error(`Mercado Pago ${method} ${path}: ${status ?? "sin respuesta"} ${message}`);
    g.mpLastError = { at: new Date(), what: `${method} ${path.replace(/\d{6,}/g, "…")}`, status, message };
    return { ok: false, status, message };
  };
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      // Mercado Pago responde { message, error, status, cause: [{ description }] }
      let message = text.slice(0, 300);
      try {
        const j = JSON.parse(text);
        message = [j.message, ...(j.cause ?? []).map((c: { description?: string }) => c.description)].filter(Boolean).join(" · ") || message;
      } catch {}
      return fail(res.status, message);
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    return fail(null, e instanceof Error ? e.message : String(e));
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
  const r = await call<{ id: string; init_point: string }>("POST", "/checkout/preferences", {
    items: [{ id: `pase-${c.reference}`, title: c.title, quantity: 1, unit_price: c.amount, currency_id: c.currency }],
    payer: c.email ? { email: c.email } : undefined,
    external_reference: String(c.reference),
    back_urls: { success: back, pending: back, failure: back },
    ...(https && { auto_return: "approved", notification_url: `${c.base}/api/mercadopago` }),
    statement_descriptor: "ZAR DEL FITNESS",
  });
  return r.ok && r.data.id && r.data.init_point ? r.data : null;
}

/** El pago, tal cual lo tiene Mercado Pago: lo único que se cree (un aviso puede mandarlo cualquiera). */
export async function getPayment(id: string) {
  const r = await call<MpPayment>("GET", `/v1/payments/${encodeURIComponent(id)}`);
  return r.ok ? r.data : null;
}

export type MpStatus =
  | { state: "missing" }
  | { state: "ok"; account: { id: number; nickname: string; email: string | null; site_id: string }; hint: string }
  | { state: "error"; status: number | null; message: string; hint: string };

/**
 * ¿Mercado Pago acepta el token? Le pregunta de quién es la cuenta. `hint`: cómo empieza y cuánto mide el token cargado
 * (el principio es el número de la aplicación, que no es secreto), para ver si se copió cortado.
 */
export async function mpStatus(): Promise<MpStatus> {
  const t = token();
  if (!t) return { state: "missing" };
  const hint = `${t.slice(0, 20)}… (${t.length} caracteres${t.startsWith("APP_USR-") ? "" : t.startsWith("TEST-") ? ", de prueba" : ", no empieza con APP_USR-"})`;
  const r = await call<{ id: number; nickname: string; email?: string; site_id: string }>("GET", "/users/me");
  return r.ok
    ? { state: "ok", account: { id: r.data.id, nickname: r.data.nickname, email: r.data.email ?? null, site_id: r.data.site_id }, hint }
    : { state: "error", status: r.status, message: r.message, hint };
}
