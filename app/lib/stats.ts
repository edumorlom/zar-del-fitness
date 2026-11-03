// Las cuentas del dashboard, a partir de la lista de clientes (listClients) y de las fechas de evaluación. Sin base:
// se puede probar sola.
import { controlStatus, daysBetween, PLANS, type ControlStatus } from "./clients.ts";

type Row = {
  id: number;
  plan: string | null;
  active: boolean;
  client_since: string;
  coach_id: number | null;
  coach_name: string | null;
  coach_photo: string | null;
  last_date: string | null;
  last_fat: number | null;
  prev_fat: number | null;
};

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Lunes de la semana de una fecha "AAAA-MM-DD". */
const monday = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

export function dashboard(rows: Row[], checkins: { date: string; client_id: number }[], today: string) {
  const active = rows.filter((r) => r.active);
  const status = (r: Row) => controlStatus(r.last_date, today);
  const by: Record<ControlStatus, number> = { "al-dia": 0, "por-vencer": 0, atrasado: 0, "sin-control": 0 };
  for (const r of active) by[status(r)]++;

  // Controles en los últimos 30 días contra los 30 anteriores
  const ago = (d: string) => daysBetween(d, today);
  const last30 = checkins.filter((c) => ago(c.date) < 30).length;
  const prev30 = checkins.filter((c) => ago(c.date) >= 30 && ago(c.date) < 60).length;

  // Mejoraron: bajó el % graso de la penúltima evaluación a la última (sólo quienes tienen dos o más en el portal)
  const comparable = active.filter((r) => r.last_fat !== null && r.prev_fat !== null);
  const improved = comparable.filter((r) => r.last_fat! < r.prev_fat!).length;

  // Altas: clientes nuevos en los últimos 30 días contra los 30 anteriores
  const newLast = rows.filter((r) => ago(r.client_since) < 30).length;
  const newPrev = rows.filter((r) => ago(r.client_since) >= 30 && ago(r.client_since) < 60).length;

  // Controles por semana, las últimas 12 (de lunes a domingo; la actual va hasta hoy)
  const weeks: { week: string; count: number }[] = [];
  const thisWeek = monday(today);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(`${thisWeek}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i * 7);
    weeks.push({ week: d.toISOString().slice(0, 10), count: 0 });
  }
  for (const c of checkins) {
    const w = weeks.find((x) => x.week === monday(c.date));
    if (w) w.count++;
  }

  // Mezcla de planes (activos)
  const plans = [...PLANS.map((p) => p.id), null].map((id) => {
    const n = active.filter((r) => r.plan === id).length;
    return { plan: id, n, pct: pct(n, active.length) };
  });

  // Por coach: cantidad, cobertura (al día), controles en 30 días y atrasados
  const coaches = new Map<number | null, { id: number | null; name: string; photo: string | null; rows: Row[] }>();
  for (const r of active) {
    const c = coaches.get(r.coach_id) ?? { id: r.coach_id, name: r.coach_name ?? "Sin coach", photo: r.coach_photo, rows: [] };
    c.rows.push(r);
    coaches.set(r.coach_id, c);
  }
  const recent = new Set(checkins.filter((c) => ago(c.date) < 30).map((c) => c.client_id));
  const perCoach = [...coaches.values()]
    .map((c) => ({
      id: c.id,
      name: c.name,
      photo: c.photo,
      clients: c.rows.length,
      coverage: pct(c.rows.filter((r) => status(r) === "al-dia").length, c.rows.length),
      checkins30: c.rows.filter((r) => recent.has(r.id)).length,
      late: c.rows.filter((r) => status(r) === "atrasado").length,
    }))
    .sort((a, b) => b.clients - a.clients);

  return {
    total: active.length,
    by,
    coverage: pct(by["al-dia"], active.length),
    coverageWithDue: pct(by["al-dia"] + by["por-vencer"], active.length),
    last30,
    prev30,
    improved,
    comparable: comparable.length,
    newLast,
    newPrev,
    weeks,
    plans,
    perCoach,
  };
}
