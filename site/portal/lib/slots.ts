// Los turnos que se pueden pedir: los días y horarios del gimnasio (db/horarios.json), en tramos fijos, sin lo ocupado
// (turnos del portal y lo que tenga el Zar en su Google Calendar). Sin base ni Google: se puede probar solo.

export type Interval = { start: Date; end: Date };
export type Hours = { days: number[]; windows: { from: string; to: string }[] };

export const SLOT_MINUTES = 30;
export const DAYS_AHEAD = 30;
/** No se pide para dentro de menos de 12 horas: el turno lo tiene que confirmar alguien. */
export const MIN_HOURS_AHEAD = 12;

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** De db/horarios.json ({ dias: ["lunes", …], turnos: [{ abre, cierra }] }) a días de la semana (0 = domingo) y tramos. */
export const hoursFrom = (h: { dias: string[]; turnos: { abre: string; cierra: string }[] }): Hours => ({
  days: h.dias.map((d) => WEEKDAYS.indexOf(d)).filter((d) => d >= 0),
  windows: h.turnos.map((t) => ({ from: t.abre, to: t.cierra })),
});

// shortcut: Argentina es UTC-3 fijo (sin horario de verano desde 2009); si vuelve, calcular el offset con Intl.
const at = (date: string, time: string) => new Date(`${date}T${time}:00-03:00`);
const weekday = (date: string) => at(date, "12:00").getUTCDay();

/** Los tramos de un día "AAAA-MM-DD" (vacío si el gimnasio no abre). Cada uno termina antes del cierre. */
export function daySlots(date: string, hours: Hours): Interval[] {
  if (!hours.days.includes(weekday(date))) return [];
  const slots: Interval[] = [];
  for (const w of hours.windows) {
    const close = at(date, w.to).getTime();
    for (let t = at(date, w.from).getTime(); t + SLOT_MINUTES * 60_000 <= close; t += SLOT_MINUTES * 60_000)
      slots.push({ start: new Date(t), end: new Date(t + SLOT_MINUTES * 60_000) });
  }
  return slots;
}

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/** Los tramos libres de un día: sin pisar lo ocupado y desde dentro de MIN_HOURS_AHEAD. */
export function freeSlots(date: string, hours: Hours, taken: Interval[], now: Date): Interval[] {
  const earliest = now.getTime() + MIN_HOURS_AHEAD * 3_600_000;
  return daySlots(date, hours).filter((s) => s.start.getTime() >= earliest && !taken.some((t) => overlaps(s, t)));
}

/** Los días que se pueden pedir, desde mañana hasta DAYS_AHEAD, sólo los que abre el gimnasio. */
export function bookableDays(today: string, hours: Hours): string[] {
  const out: string[] = [];
  for (let i = 1; i <= DAYS_AHEAD; i++) {
    const d = new Date(Date.parse(`${today}T12:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10);
    if (hours.days.includes(weekday(d))) out.push(d);
  }
  return out;
}

/** Los días de la grilla de un mes "AAAA-MM": 6 semanas de lunes a domingo, con los del mes anterior y el siguiente. */
export function monthGrid(month: string): string[] {
  const first = new Date(`${month}-01T12:00:00Z`);
  const start = first.getTime() - ((first.getUTCDay() + 6) % 7) * 86_400_000;
  return Array.from({ length: 42 }, (_, i) => new Date(start + i * 86_400_000).toISOString().slice(0, 10));
}

/** El mes anterior o el siguiente: "2026-11" → "2026-10" / "2026-12". */
export function shiftMonth(month: string, by: number) {
  const d = new Date(`${month}-15T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
}
