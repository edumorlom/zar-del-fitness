import "server-only";
import type { PoolClient } from "pg";
import horarios from "@db/horarios.json";
import { db } from "./db";
import { takenIntervals } from "./data";
import { dateOf, longDate, timeOf } from "./format";
import { after } from "next/server";
import { renderRequestEmail } from "./appointment-emails";
import { sendMail } from "./email-layout";
import { busy, CALENDAR_OWNER, deleteEvent } from "./google";
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

/** La misma disponibilidad para el portal y el servidor MCP. */
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

/** Pedir un turno para un cliente: las reglas del portal, que también usa el servidor MCP (pedir_turno). */
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
  mailRequest(clientId, start);
  return { ok: true, mensaje: `Pedido: ${longDate(dateOf(start))} a las ${timeOf(start)} h. Te avisamos cuando esté confirmado.` };
}

/** Al Zar le llega un correo con el pedido, venga del portal o de Digui. Después de responder: si falla, el turno ya quedó. */
function mailRequest(clientId: number, start: Date) {
  after(async () => {
    const { rows } = await db.query<{ name: string; email: string | null; phone: string | null; coach: string | null }>(
      "select u.name, u.email, u.phone, c.name as coach from users u left join users c on c.id = u.coach_id where u.id = $1",
      [clientId]
    );
    if (rows[0]) await sendMail({ to: CALENDAR_OWNER, ...renderRequestEmail({ ...rows[0], start }) });
  });
}

type Live = { id: number; client_id: number; starts_at: Date; google_event_id: string | null };

/** Cancela un turno: lo saca del Google Calendar (Google le avisa al cliente) y, si era su próximo control, de la ficha. */
export async function cancelAppointmentRow(a: Live, by: number) {
  if (a.google_event_id) await deleteEvent(a.google_event_id);
  await db.query("update appointments set status = 'cancelled', decided_by = $2 where id = $1", [a.id, by]);
  await db.query("update users set next_control_at = null where id = $1 and next_control_at = $2", [a.client_id, a.starts_at]);
}

/** El próximo turno pedido o confirmado del cliente (tiene uno solo: requestSlot no deja pedir otro). */
async function nextAppointment(clientId: number) {
  const { rows } = await db.query<Live>(
    `select id, client_id, starts_at, google_event_id from appointments
     where client_id = $1 and status in ('requested', 'confirmed') and ends_at > now() order by starts_at limit 1`,
    [clientId]
  );
  return rows[0] ?? null;
}

const at = (d: Date) => `${longDate(dateOf(d))} a las ${timeOf(d)} h`;

/** El cliente cancela su turno (desde Digui o MCP), como el botón del portal. */
export async function cancelSlot(clientId: number): Promise<Result> {
  const a = await nextAppointment(clientId);
  if (!a) return { ok: false, mensaje: "No tenés turnos pedidos ni confirmados." };
  await cancelAppointmentRow(a, clientId);
  return { ok: true, mensaje: `Cancelado tu turno del ${at(a.starts_at)}.` };
}

/**
 * El cliente mueve su turno a otro horario libre (desde Digui o MCP). Vuelve a quedar pedido, aunque estuviera
 * confirmado: lo confirma el Zar, como un pedido nuevo (le llega el correo, y el evento viejo sale del calendario).
 */
export async function moveSlot(clientId: number, start: Date): Promise<Result> {
  const a = await nextAppointment(clientId);
  if (!a) return { ok: false, mensaje: "No tenés un turno para mover: pedí uno nuevo." };
  if (a.starts_at.getTime() === start.getTime()) return { ok: false, mensaje: "Tu turno ya es en ese horario." };
  const result = await withAvailableSlot(start, a.id, async (connection) => {
    await connection.query(
      `update appointments set starts_at = $2, ends_at = $2::timestamptz + make_interval(mins => $3), status = 'requested',
              google_event_id = null, requested_at = null, decided_by = null
       where id = $1`,
      [a.id, start, SLOT_MINUTES]
    );
    await connection.query("update users set next_control_at = null where id = $1 and next_control_at = $2", [clientId, a.starts_at]);
  });
  if (!result.ok) return result;
  if (a.google_event_id) await deleteEvent(a.google_event_id);
  mailRequest(clientId, start);
  return { ok: true, mensaje: `Movido: ${at(start)}. Queda pedido hasta que el Zar lo confirme.` };
}

/** El único cliente cuyo teléfono termina igual (últimos 7 dígitos); null si no hay o hay varios. */
export async function clientByPhone(phone: string): Promise<number | null> {
  const tail = phoneTail(phone);
  if (!tail) return null;
  const { rows } = await db.query<{ id: number }>(
    `select id from users
     where 'user' = any(scopes) and right(regexp_replace(phone, '\\D', '', 'g'), 7) = $1
     limit 2`,
    [tail]
  );
  return rows.length === 1 ? rows[0].id : null;
}

/** El id si es un cliente. users.id es int4: uno más grande haría fallar la consulta, así que ni se consulta. */
export async function clientById(id: number): Promise<number | null> {
  if (id > 2_147_483_647) return null;
  const { rows } = await db.query<{ id: number }>("select id from users where id = $1 and 'user' = any(scopes)", [id]);
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
