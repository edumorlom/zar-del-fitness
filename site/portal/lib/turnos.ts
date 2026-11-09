import "server-only";
import type { PoolClient } from "pg";
import horarios from "@db/horarios.json";
import { db } from "./db";
import { takenIntervals } from "./data";
import { dateOf, longDate, timeOf } from "./format";
import { busy } from "./google";
import { DAILY_LIMIT_MESSAGE, daySlots, freeSlots, hoursFrom, MAX_DAILY_APPOINTMENTS, ONLY_FRIDAYS, SLOT_MINUTES } from "./slots";
import { phoneTail } from "./digui-api";

export const HOURS = hoursFrom(horarios);

// El día argentino de `day`, de 00:00 a 00:00: la misma ventana para validar y para listar.
const dayWindow = (day: string) => {
  const from = new Date(`${day}T00:00:00-03:00`);
  return { from, to: new Date(from.getTime() + 86_400_000) };
};

const availabilityOn = async (day: string, exceptId: number | null = null, connection: Pick<PoolClient, "query"> = db) => {
  const { from, to } = dayWindow(day);
  const appointments = await takenIntervals(from, to, exceptId, connection);
  if (appointments.length >= MAX_DAILY_APPOINTMENTS) return { slots: [], error: DAILY_LIMIT_MESSAGE };
  const taken = [...appointments, ...((await busy(from, to, connection)) ?? [])];
  return { slots: freeSlots(day, HOURS, taken, new Date(), appointments.length), error: null };
};

function bookingDayError(start: Date) {
  if (Number.isNaN(start.getTime())) return "Elegí un horario.";
  return daySlots(dateOf(start), HOURS).length ? null : ONLY_FRIDAYS;
}

/** Confirmar un pedido existente también respeta el día y el cupo, sin exigir otras 12 horas de anticipación. */
export async function appointmentDayError(start: Date, exceptId: number) {
  const error = bookingDayError(start);
  if (error) return error;
  const { from, to } = dayWindow(dateOf(start));
  return (await takenIntervals(from, to, exceptId)).length >= MAX_DAILY_APPOINTMENTS ? DAILY_LIMIT_MESSAGE : null;
}

/** La misma disponibilidad para el portal, la API y MCP. */
export async function availableSlots(day: string) {
  if (!daySlots(day, HOURS).length) return [];
  return (await availabilityOn(day)).slots;
}

/** ¿Se puede dar ese turno? Tiene que ser uno de los tramos libres del día (gimnasio, portal y Google). */
async function slotError(start: Date, exceptId: number | null, connection: PoolClient) {
  const dayError = bookingDayError(start);
  if (dayError) return dayError;
  const day = dateOf(start);
  const { slots, error } = await availabilityOn(day, exceptId, connection);
  if (error) return error;
  const ok = slots.some((s) => s.start.getTime() === start.getTime());
  return ok ? null : "Ese horario ya no está libre: elegí otro.";
}

type Result = { ok: true; mensaje: string } | { ok: false; mensaje: string };

/** Serializa pedidos y movimientos hacia un mismo día para que dos reservas no consuman el último cupo. */
export async function withAvailableSlot<T>(start: Date, exceptId: number | null, save: (connection: PoolClient) => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; mensaje: string }> {
  const dayError = bookingDayError(start);
  if (dayError) return { ok: false, mensaje: dayError };
  const connection = await db.connect();
  try {
    await connection.query("begin");
    // Espacio propio de la agenda y fecha argentina como entero: el bloqueo dura hasta commit/rollback.
    await connection.query("select pg_advisory_xact_lock(1937076076, $1::int)", [Number(dateOf(start).replaceAll("-", ""))]);
    const error = await slotError(start, exceptId, connection);
    if (error) {
      await connection.query("rollback");
      return { ok: false, mensaje: error };
    }
    const value = await save(connection);
    await connection.query("commit");
    return { ok: true, value };
  } catch (e) {
    await connection.query("rollback");
    if ((e as { code?: string }).code === "23505") return { ok: false, mensaje: "Ese horario ya está tomado: elegí otro." };
    throw e;
  } finally {
    connection.release();
  }
}

/** Pedir un turno para un cliente: las reglas del portal, que también usa la API de Digui. */
export async function requestSlot(clientId: number, start: Date): Promise<Result> {
  const { rowCount } = await db.query(
    "select 1 from appointments where client_id = $1 and status in ('requested', 'confirmed') and ends_at > now()",
    [clientId]
  );
  if (rowCount) return { ok: false, mensaje: "Ya tenés un turno pedido. Si querés otro horario, cancelalo primero." };
  const result = await withAvailableSlot(start, null, async (connection) => {
    await connection.query(
      `insert into appointments (client_id, starts_at, ends_at, created_by)
       values ($1, $2, $2::timestamptz + make_interval(mins => $3), $1)`,
      [clientId, start, SLOT_MINUTES]
    );
  });
  if (!result.ok) return result;
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
  return (await availableSlots(day)).map((s) => timeOf(s.start));
}
