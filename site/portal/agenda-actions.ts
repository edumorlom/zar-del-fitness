"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { canManage } from "~/lib/access";
import { renderConfirmedEmail } from "~/lib/appointment-emails";
import { sendMail } from "~/lib/email-layout";
import { requireViewer, type Viewer } from "~/lib/auth";
import { db } from "~/lib/db";
import { getAppointment, type Appointment } from "~/lib/data";
import { dateOf, fromLocalInput, longDate, timeOf } from "~/lib/format";
import { createEvent, moveEvent } from "~/lib/google";
import { getLang } from "~/lib/lang";
import { DAILY_LIMIT_MESSAGE, ONLY_FRIDAYS, SLOT_MINUTES } from "~/lib/slots";
import { appointmentDayError, cancelAppointmentRow, requestSlot, withAvailableSlot } from "~/lib/turnos";
import type { FormState } from "./actions";

const event = (a: Appointment, start: Date, end: Date) => ({
  start,
  end,
  client: a.client_name,
  email: a.client_email,
  coach: a.coach_name,
});

/** El turno, si quien lo toca puede: el propio cliente (sólo para cancelar) o el admin o su coach. */
async function load(viewer: Viewer, id: number, ownerOk: boolean) {
  const a = await getAppointment(id);
  if (!a) return null;
  if (ownerOk && a.client_id === viewer.id) return a;
  return canManage(viewer, { coach_id: a.coach_id }) ? a : null;
}

/**
 * Al cliente le llega un correo con su turno confirmado y, si se lo movieron, lo que había pedido. Después de
 * responder: si falla, el turno ya quedó. A quien está dado de baja o no tiene correo no le llega nada.
 */
function mailConfirmed(clientId: number, start: Date, requested: Date | null) {
  after(async () => {
    const { rows } = await db.query<{ name: string; email: string | null; active: boolean }>(
      "select name, email, active from users where id = $1",
      [clientId]
    );
    const u = rows[0];
    if (u?.active && u.email) await sendMail({ to: u.email, ...renderConfirmedEmail({ name: u.name, start, requested }) });
  });
}

// ---------- El cliente ----------

// Lo que responde requestSlot (en castellano: también lo usan Digui y MCP), para el cliente con el portal en inglés.
// shortcut: se busca por el texto; si cambia un mensaje en turnos.ts o slots.ts sin cambiarlo acá, sale en castellano.
const EN: Record<string, string> = {
  "Elegí un horario.": "Pick a time.",
  [ONLY_FRIDAYS]: "Check-ins are booked on Fridays only.",
  [DAILY_LIMIT_MESSAGE]: "That Friday is fully booked: pick another one.",
  "Ese horario ya no está libre: elegí otro.": "That time is no longer free: pick another one.",
  "Ese horario ya está tomado: elegí otro.": "That time is already taken: pick another one.",
  "Ya tenés un turno pedido. Si querés otro horario, cancelalo primero.": "You already have a booking. To pick another time, cancel it first.",
};

export async function requestAppointment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("user")) return { error: "Los turnos los pide el cliente desde su cuenta." };
  const start = new Date(String(form.get("start") ?? ""));
  const r = await requestSlot(viewer.id, start);
  const en = (await getLang()) === "en";
  if (!r.ok) return { error: en ? (EN[r.mensaje] ?? r.mensaje) : r.mensaje };
  refresh();
  return { ok: en ? `Requested: ${longDate(dateOf(start), "en")} at ${timeOf(start)}. We'll let you know once it's confirmed.` : r.mensaje };
}

export async function cancelAppointment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const a = await load(viewer, Number(form.get("id")), true);
  if (!a || (a.status !== "requested" && a.status !== "confirmed"))
    return { error: (await getLang()) === "en" ? "That booking no longer exists." : "Ese turno ya no está." };
  await cancelAppointmentRow(a, viewer.id);
  refresh();
  return { ok: (await getLang()) === "en" ? "Booking cancelled." : "Turno cancelado." };
}

// ---------- El admin o el coach ----------

export async function confirmAppointment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const a = await load(viewer, Number(form.get("id")), false);
  if (!a || a.status !== "requested") return { error: "Ese pedido ya no está." };
  const error = await appointmentDayError(a.starts_at, a.id);
  if (error) return { error };
  const eventId = await createEvent(event(a, a.starts_at, a.ends_at));
  await db.query("update appointments set status = 'confirmed', google_event_id = $2, decided_by = $3 where id = $1", [
    a.id,
    eventId,
    viewer.id,
  ]);
  await db.query("update users set next_control_at = $2 where id = $1", [a.client_id, a.starts_at]);
  mailConfirmed(a.client_id, a.starts_at, a.requested_at);
  refresh();
  return eventId ? { ok: "Confirmado y agregado al calendario." } : { ok: "Confirmado. No se pudo agregar al Google Calendar (¿está conectado?)." };
}

export async function moveAppointment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const a = await load(viewer, Number(form.get("id")), false);
  if (!a || (a.status !== "requested" && a.status !== "confirmed")) return { error: "Ese turno ya no está." };
  const start = fromLocalInput(String(form.get("start") ?? "")) ?? new Date(NaN);
  if (start.getTime() === a.starts_at.getTime()) return { error: "Es el mismo horario." };
  const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
  const result = await withAvailableSlot(start, a.id, async (connection) => {
    let eventId = a.google_event_id;
    if (eventId) await moveEvent(eventId, event(a, start, end), connection);
    else eventId = await createEvent(event(a, start, end), connection);
    await connection.query(
      `update appointments set starts_at = $2, ends_at = $3, status = 'confirmed', google_event_id = $4, decided_by = $5,
              requested_at = coalesce(requested_at, starts_at)
       where id = $1`,
      [a.id, start, end, eventId, viewer.id]
    );
    await connection.query("update users set next_control_at = $2 where id = $1", [a.client_id, start]);
  });
  if (!result.ok) return { error: result.mensaje };
  mailConfirmed(a.client_id, start, a.requested_at ?? a.starts_at);
  refresh();
  return { ok: `Movido al ${longDate(dateOf(start))} a las ${timeOf(start)} h y confirmado.` };
}

export async function rejectAppointment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const a = await load(viewer, Number(form.get("id")), false);
  if (!a || a.status !== "requested") return { error: "Ese pedido ya no está." };
  await db.query("update appointments set status = 'rejected', decided_by = $2 where id = $1", [a.id, viewer.id]);
  refresh();
  return { ok: "Pedido rechazado." };
}
