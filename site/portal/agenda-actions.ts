"use server";

import { refresh } from "next/cache";
import { canManage } from "~/lib/access";
import { requireViewer, type Viewer } from "~/lib/auth";
import { db } from "~/lib/db";
import { getAppointment, type Appointment } from "~/lib/data";
import { dateOf, fromLocalInput, longDate, timeOf } from "~/lib/format";
import { createEvent, deleteEvent, moveEvent } from "~/lib/google";
import { SLOT_MINUTES } from "~/lib/slots";
import { requestSlot, slotError } from "~/lib/turnos";
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
  return viewer.role !== "user" && canManage(viewer, { coach_id: a.coach_id }) ? a : null;
}

// ---------- El cliente ----------

export async function requestAppointment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (viewer.role !== "user") return { error: "Los turnos los pide el cliente desde su cuenta." };
  const r = await requestSlot(viewer.id, new Date(String(form.get("start") ?? "")));
  if (!r.ok) return { error: r.mensaje };
  refresh();
  return { ok: r.mensaje };
}

export async function cancelAppointment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const a = await load(viewer, Number(form.get("id")), true);
  if (!a || (a.status !== "requested" && a.status !== "confirmed")) return { error: "Ese turno ya no está." };
  if (a.google_event_id) await deleteEvent(a.google_event_id);
  await db.query("update appointments set status = 'cancelled', decided_by = $2 where id = $1", [a.id, viewer.id]);
  await db.query("update users set next_control_at = null where id = $1 and next_control_at = $2", [a.client_id, a.starts_at]);
  refresh();
  return { ok: "Turno cancelado." };
}

// ---------- El admin o el coach ----------

export async function confirmAppointment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const a = await load(viewer, Number(form.get("id")), false);
  if (!a || a.status !== "requested") return { error: "Ese pedido ya no está." };
  const eventId = await createEvent(event(a, a.starts_at, a.ends_at));
  await db.query("update appointments set status = 'confirmed', google_event_id = $2, decided_by = $3 where id = $1", [
    a.id,
    eventId,
    viewer.id,
  ]);
  await db.query("update users set next_control_at = $2 where id = $1", [a.client_id, a.starts_at]);
  refresh();
  return eventId ? { ok: "Confirmado y agregado al calendario." } : { ok: "Confirmado. No se pudo agregar al Google Calendar (¿está conectado?)." };
}

export async function moveAppointment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const a = await load(viewer, Number(form.get("id")), false);
  if (!a || (a.status !== "requested" && a.status !== "confirmed")) return { error: "Ese turno ya no está." };
  const start = fromLocalInput(String(form.get("start") ?? "")) ?? new Date(NaN);
  if (start.getTime() === a.starts_at.getTime()) return { error: "Es el mismo horario." };
  const err = await slotError(start, a.id);
  if (err) return { error: err };
  const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
  let eventId = a.google_event_id;
  if (eventId) await moveEvent(eventId, event(a, start, end));
  else eventId = await createEvent(event(a, start, end));
  try {
    await db.query(
      `update appointments set starts_at = $2, ends_at = $3, status = 'confirmed', google_event_id = $4, decided_by = $5,
              requested_at = coalesce(requested_at, starts_at)
       where id = $1`,
      [a.id, start, end, eventId, viewer.id]
    );
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { error: "Ese horario ya está tomado: elegí otro." };
    throw e;
  }
  await db.query("update users set next_control_at = $2 where id = $1", [a.client_id, start]);
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
