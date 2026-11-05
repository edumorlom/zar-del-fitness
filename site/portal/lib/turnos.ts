import "server-only";
import horarios from "@db/horarios.json";
import { db } from "./db";
import { takenIntervals } from "./data";
import { dateOf, longDate, timeOf } from "./format";
import { busy } from "./google";
import { freeSlots, hoursFrom, SLOT_MINUTES } from "./slots";
import { phoneTail } from "./digui-api";

export const HOURS = hoursFrom(horarios);

// El día argentino de `day`, de 00:00 a 00:00: la misma ventana para validar y para listar.
const dayWindow = (day: string) => {
  const from = new Date(`${day}T00:00:00-03:00`);
  return { from, to: new Date(from.getTime() + 86_400_000) };
};

const takenOn = async (day: string, exceptId: number | null = null) => {
  const { from, to } = dayWindow(day);
  return [...(await takenIntervals(from, to, exceptId)), ...((await busy(from, to)) ?? [])];
};

/** ¿Se puede dar ese turno? Tiene que ser uno de los tramos libres del día (gimnasio, portal y Google). */
export async function slotError(start: Date, exceptId: number | null = null) {
  if (Number.isNaN(start.getTime())) return "Elegí un horario.";
  const day = dateOf(start);
  const ok = freeSlots(day, HOURS, await takenOn(day, exceptId), new Date()).some((s) => s.start.getTime() === start.getTime());
  return ok ? null : "Ese horario ya no está libre: elegí otro.";
}

type Result = { ok: true; mensaje: string } | { ok: false; mensaje: string };

/** Pedir un turno para un cliente: las reglas del portal, que también usa la API de Digui. */
export async function requestSlot(clientId: number, start: Date): Promise<Result> {
  const { rowCount } = await db.query(
    "select 1 from appointments where client_id = $1 and status in ('requested', 'confirmed') and ends_at > now()",
    [clientId]
  );
  if (rowCount) return { ok: false, mensaje: "Ya tenés un turno pedido. Si querés otro horario, cancelalo primero." };
  const err = await slotError(start);
  if (err) return { ok: false, mensaje: err };
  try {
    await db.query(
      `insert into appointments (client_id, starts_at, ends_at, created_by)
       values ($1, $2, $2::timestamptz + make_interval(mins => $3), $1)`,
      [clientId, start, SLOT_MINUTES]
    );
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { ok: false, mensaje: "Justo lo pidió otra persona: elegí otro horario." };
    throw e;
  }
  return { ok: true, mensaje: `Pedido: ${longDate(dateOf(start))} a las ${timeOf(start)} h. Te avisamos cuando esté confirmado.` };
}

/** El único cliente cuyo teléfono termina igual (últimos 7 dígitos); null si no hay o hay varios. */
export async function clientByPhone(phone: string): Promise<number | null> {
  const tail = phoneTail(phone);
  if (!tail) return null;
  const { rows } = await db.query<{ id: number }>(
    `select id from users
     where role = 'user' and right(regexp_replace(phone, '\\D', '', 'g'), 7) = $1
     limit 2`,
    [tail]
  );
  return rows.length === 1 ? rows[0].id : null;
}

/** El id si es un cliente. users.id es int4: uno más grande haría fallar la consulta, así que ni se consulta. */
export async function clientById(id: number): Promise<number | null> {
  if (id > 2_147_483_647) return null;
  const { rows } = await db.query<{ id: number }>("select id from users where id = $1 and role = 'user'", [id]);
  return rows[0]?.id ?? null;
}

/** Los turnos pedidos o confirmados que todavía no terminaron. */
export async function liveAppointments(clientId: number) {
  const { rows } = await db.query<{ starts_at: Date; status: "requested" | "confirmed" }>(
    `select starts_at, status from appointments
     where client_id = $1 and status in ('requested', 'confirmed') and ends_at > now()
     order by starts_at`,
    [clientId]
  );
  return rows.map((r) => ({
    dia: dateOf(r.starts_at),
    hora: timeOf(r.starts_at),
    estado: r.status === "requested" ? ("pedido" as const) : ("confirmado" as const),
  }));
}

/** Las horas libres de un día, "HH:MM" en hora argentina. */
export async function freeTimes(day: string): Promise<string[]> {
  return freeSlots(day, HOURS, await takenOn(day), new Date()).map((s) => timeOf(s.start));
}
