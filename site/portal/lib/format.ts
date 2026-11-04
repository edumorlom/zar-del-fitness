// Todo en la hora de Buenos Aires, también en el servidor (Railway corre en UTC).
const TZ = "America/Argentina/Buenos_Aires";

const iso = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const local = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
const long = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const time = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });

/** Hoy, "AAAA-MM-DD". */
export const todayISO = () => iso.format(new Date());

/** Días de hoy a una fecha "AAAA-MM-DD" (negativo si ya pasó). */
export const daysUntil = (date: string) => Math.round((Date.parse(date) - Date.parse(todayISO())) / 86_400_000);

/** "AAAA-MM-DD" → "Lunes 9 de noviembre". */
export const longDate = (date: string) => {
  const s = long.format(new Date(`${date}T00:00:00Z`)).replace(",", "");
  return s[0].toUpperCase() + s.slice(1);
};

/** "AAAA-MM-DD" → "09/11/2026". */
export const shortDate = (date: string) => date.split("-").reverse().join("/");

/** 80.94 → "80,9". */
export const num = (n: number, digits = 1) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Fecha y hora → "AAAA-MM-DDTHH:mm" en Buenos Aires, para un <input type="datetime-local">. */
export const toLocalInput = (d: Date) => local.format(d).replace(" ", "T");

/** Lo de un <input type="datetime-local">, que es hora de Buenos Aires. */
// shortcut: Argentina es UTC-3 fijo (sin horario de verano desde 2009); si vuelve, calcular el offset con Intl.
export const fromLocalInput = (v: string) => (v ? new Date(`${v}:00-03:00`) : null);

/** Fecha de una fecha y hora, en Buenos Aires: "AAAA-MM-DD". */
export const dateOf = (d: Date) => iso.format(d);

export const timeOf = (d: Date) => time.format(d);

const monthYearFmt = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });

/** "AAAA-MM-DD" → "julio de 2026". */
export const monthYear = (date: string) => monthYearFmt.format(new Date(`${date}T00:00:00Z`));

/** "1 día", "12 días". */
export const days = (n: number) => `${n} ${Math.abs(n) === 1 ? "día" : "días"}`;
