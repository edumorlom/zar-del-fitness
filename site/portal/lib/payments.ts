// Los pagos del pase: qué planes se pagan desde el portal, cuándo se ofrece pagar, hasta cuándo extiende cada pago y
// cómo se lee lo que manda Mercado Pago. Sin base ni servidor: lo usan las páginas, las acciones y los tests.
import { locales, type Lang } from "../../lib/i18n.ts";
import { daysBetween } from "./clients.ts";

export const METHODS = ["mercadopago", "cash", "card"] as const;
export type Method = (typeof METHODS)[number];
/** Lo que carga el equipo en el gimnasio. Mercado Pago lo paga el cliente desde su portal. */
export const IN_PERSON = ["cash", "card"] as const satisfies readonly Method[];

export const METHOD_LABEL: Record<Method, { es: string; en: string }> = {
  mercadopago: { es: "Mercado Pago", en: "Mercado Pago" },
  cash: { es: "Efectivo", en: "Cash" },
  card: { es: "Tarjeta en el local", en: "Card at the gym" },
};

/**
 * Los planes de la ficha (users.plan) que se pagan desde el portal, con su id en db/planes.json (de ahí sale el precio).
 * Por ahora, sólo Premium: para sumar otro, agregarlo acá.
 */
export const PAYABLE_PLANS: Record<string, string> = { Premium: "premium" };
export const isPayable = (plan: string | null): plan is string => plan !== null && Object.hasOwn(PAYABLE_PLANS, plan);

/** Cuántos días antes de vencer el pase está "por vencer": se le avisa al cliente y el equipo lo ve en Pagos. */
export const PASS_DUE_DAYS = 7;

export type PassStatus = "al-dia" | "por-vencer" | "vencido" | "sin-fecha";

export const PASS_LABEL: Record<PassStatus, string> = {
  "al-dia": "Al día",
  "por-vencer": "Por vencer",
  vencido: "Vencido",
  "sin-fecha": "Sin vencimiento",
};

/** Vencido desde el día siguiente al vencimiento: el día que vence, todavía entra. */
export function passStatus(expires: string | null, today: string): PassStatus {
  if (!expires) return "sin-fecha";
  const left = daysBetween(today, expires);
  return left < 0 ? "vencido" : left <= PASS_DUE_DAYS ? "por-vencer" : "al-dia";
}

/**
 * ¿Puede pagar con Mercado Pago desde su perfil? Si su plan se paga desde el portal y está activo, en cualquier momento:
 * pagar antes no le hace perder días (extendPass suma el mes a su vencimiento), y sin vencimiento cargado arranca hoy.
 */
export const canPayOnline = (c: { plan: string | null; active: boolean }) => isPayable(c.plan) && c.active;

/** "AAAA-MM-DD" + n meses. Si ese día no existe en el mes, el último (31/01 + 1 → 28/02), como hace Postgres. */
export function addMonths(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const year = Math.floor(total / 12);
  const month = total - year * 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

/**
 * El vencimiento después de pagar: un mes más desde el vencimiento si todavía no pasó (pagar antes no le hace perder
 * días), o desde hoy si ya venció o no tenía.
 */
export const extendPass = (expires: string | null, today: string, months = 1) =>
  addMonths(expires && expires >= today ? expires : today, months);

/** 450000 → "$ 450.000" ("ARS 450,000" en inglés). */
export const money = (n: number, currency = "ARS", lang: Lang = "es") =>
  new Intl.NumberFormat(locales[lang].intl, { style: "currency", currency, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n);

// ---------- Mercado Pago ----------

/** Lo que importa de un pago de Mercado Pago (GET /v1/payments/:id). */
export type MpPayment = {
  id: number | string;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
};

/** Estados de Mercado Pago de un pago que todavía puede aprobarse (un ticket de Rapipago, una tarjeta en revisión). */
export const MP_IN_PROCESS = ["pending", "in_process", "authorized"];
/** Estados de un pago aprobado que se devolvió: el pase vuelve a como estaba. */
export const MP_REVERSED = ["refunded", "charged_back", "cancelled"];

/**
 * El id del pago de un aviso de Mercado Pago, o null si no es de un pago. Llegan en dos formatos: Webhooks
 * (?type=payment&data.id=…, o en el cuerpo { type, data: { id } }) e IPN (?topic=payment&id=…).
 */
export function notifiedPaymentId(query: URLSearchParams, body: unknown): string | null {
  const b = (typeof body === "object" && body !== null ? body : {}) as { type?: unknown; topic?: unknown; data?: { id?: unknown } };
  const type = query.get("type") ?? query.get("topic") ?? b.type ?? b.topic;
  if (type !== "payment") return null;
  const id = String(query.get("data.id") ?? b.data?.id ?? query.get("id") ?? "");
  return /^\d{1,20}$/.test(id) ? id : null;
}

/**
 * ¿Este pago de Mercado Pago paga esta fila? Mismo external_reference (el id de la fila), misma moneda y al menos el
 * monto. Si no coincide, no se acredita: lo revisa el admin.
 */
export const mpMatches = (p: MpPayment, row: { id: number; amount: number; currency: string }) =>
  p.external_reference === String(row.id) && p.currency_id === row.currency && p.transaction_amount >= row.amount;
