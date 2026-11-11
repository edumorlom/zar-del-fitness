import { locales, type Lang } from "../../lib/i18n.ts";

// Todo en la hora de Buenos Aires, también en el servidor (Railway corre en UTC). Lo que dice palabras, en los dos
// idiomas del portal (portal/lib/lang.ts); el castellano, si no se dice.
const TZ = "America/Argentina/Buenos_Aires";

const iso = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const local = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
const long = (lang: Lang) => new Intl.DateTimeFormat(locales[lang].intl, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const time = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });

/** Hoy, "AAAA-MM-DD". */
export const todayISO = () => iso.format(new Date());

/** Días de hoy a una fecha "AAAA-MM-DD" (negativo si ya pasó). */
export const daysUntil = (date: string) => Math.round((Date.parse(date) - Date.parse(todayISO())) / 86_400_000);

/** "AAAA-MM-DD" → "Lunes 9 de noviembre" ("Monday, November 9"). */
export const longDate = (date: string, lang: Lang = "es") => {
  const s = long(lang).format(new Date(`${date}T00:00:00Z`));
  return lang === "en" ? s : s[0].toUpperCase() + s.slice(1).replace(",", "");
};

/** "AAAA-MM-DD" → "09/11/2026". */
export const shortDate = (date: string) => date.split("-").reverse().join("/");

/** 80.94 → "80,9" ("80.9"). */
export const num = (n: number, digits = 1, lang: Lang = "es") =>
  n.toLocaleString(locales[lang].intl, { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Fecha y hora → "AAAA-MM-DDTHH:mm" en Buenos Aires, para un <input type="datetime-local">. */
export const toLocalInput = (d: Date) => local.format(d).replace(" ", "T");

/** Lo de un <input type="datetime-local">, que es hora de Buenos Aires. */
// shortcut: Argentina es UTC-3 fijo (sin horario de verano desde 2009); si vuelve, calcular el offset con Intl.
export const fromLocalInput = (v: string) => (v ? new Date(`${v}:00-03:00`) : null);

/** Fecha de una fecha y hora, en Buenos Aires: "AAAA-MM-DD". */
export const dateOf = (d: Date) => iso.format(d);

export const timeOf = (d: Date) => time.format(d);

/** "AAAA-MM-DD" → "julio de 2026" ("July 2026"). */
export const monthYear = (date: string, lang: Lang = "es") =>
  new Intl.DateTimeFormat(locales[lang].intl, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

/** "1 día", "12 días" ("1 day", "12 days"). */
export const days = (n: number, lang: Lang = "es") =>
  `${n} ${Math.abs(n) === 1 ? (lang === "en" ? "day" : "día") : lang === "en" ? "days" : "días"}`;
