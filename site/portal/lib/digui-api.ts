// Ayudas puras de la API de Digui: sin db ni server-only, para probarlas con node --test.
import { createHash, timingSafeEqual } from "node:crypto";
import { fromLocalInput } from "./format.ts";

export const NO_FILE_PHONE = "No encontramos tu ficha con este número: pedí el turno desde el portal o escribile al Zar.";
export const NO_FILE_ID = "No encontramos tu ficha: pedí el turno desde el portal o escribile al Zar.";
export const BAD_DAY = "Ese día no se puede pedir: elegí un viernes entre mañana y los próximos 30 días.";

const sha = (s: string) => createHash("sha256").update(s).digest();

// Dónde está la API, para sus instrucciones: el dominio en que se pidieron (Railway lo pasa en Host). En mi. las URLs
// no llevan /portal; en el dominio principal, sí.
export function apiBase(host: string): string {
  const name = host.split(",")[0].trim().toLowerCase();
  const scheme = /^(mi\.)?localhost(:\d+)?$/.test(name) ? "http" : "https";
  return `${scheme}://${name}${name.startsWith("mi.") ? "" : "/portal"}/api/digui`;
}

// Se hashean ambos lados para que timingSafeEqual compare largos iguales y no filtre el de la clave.
export function keyOk(header: string | null, key: string | undefined): boolean {
  if (!key || header === null) return false;
  return timingSafeEqual(sha(header), sha(`Bearer ${key}`));
}

// Los últimos 7 dígitos ignoran el +54, el 9, el 0 y el 15, que cada quien escribe distinto.
export function phoneTail(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length < 7 ? null : digits.slice(-7);
}

// Digui puede mandar el id como número o como texto; todo lo demás es un error de quien llama.
export function customerId(v: unknown): number | null {
  const n = typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v;
  return typeof n === "number" && Number.isSafeInteger(n) && n > 0 ? n : null;
}

// El regex solo mira la forma; el viaje de ida y vuelta por Date descarta días que no existen (30 de febrero).
export function parseDay(v: string | null): string | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v;
}

// Sin offset es hora argentina; se valida la hora a mano porque fromLocalInput no lo hace.
export function parseStart(v: unknown): Date | null {
  if (typeof v !== "string") return null;
  const m = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d$/.exec(v);
  return m && parseDay(m[1]) ? fromLocalInput(v) : null;
}
