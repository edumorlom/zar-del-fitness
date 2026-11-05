import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { portalUrl } from "@/lib/content";
import { db } from "./db";
import type { Interval } from "./slots";

// Los turnos van al Google Calendar del Zar. El permiso lo da él una vez, desde la Agenda (ConnectCalendar): Clerk
// guarda el token de su cuenta de Google y lo renueva.
export const CALENDAR_OWNER = "zardelfitnessgym@gmail.com";
export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
];
const API = "https://www.googleapis.com/calendar/v3";
const TZ = "America/Argentina/Buenos_Aires";

export type CalendarStatus = "connected" | "not-signed-in" | "no-permission";

async function token(): Promise<{ status: CalendarStatus; token?: string }> {
  const { rows } = await db.query<{ clerk_id: string | null }>("select clerk_id from users where email = $1", [CALENDAR_OWNER]);
  const clerkId = rows[0]?.clerk_id;
  if (!clerkId) return { status: "not-signed-in" };
  try {
    const { data } = await (await clerkClient()).users.getUserOauthAccessToken(clerkId, "google");
    const t = data[0];
    if (!t || !CALENDAR_SCOPES.every((s) => t.scopes?.includes(s))) return { status: "no-permission" };
    return { status: "connected", token: t.token };
  } catch {
    return { status: "no-permission" };
  }
}

export async function calendarStatus() {
  return (await token()).status;
}

async function call(method: string, path: string, body?: unknown) {
  const t = await token();
  if (!t.token) return null;
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${t.token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    console.error(`Google Calendar ${method} ${path}: ${res.status} ${await res.text()}`);
    return null;
  }
  return res.status === 204 ? {} : res.json();
}

/** Lo ocupado en el calendario del Zar entre dos momentos. null: sin conexión (se ofrece todo el horario). */
export async function busy(from: Date, to: Date): Promise<Interval[] | null> {
  const r = await call("POST", "/freeBusy", {
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    timeZone: TZ,
    items: [{ id: "primary" }],
  });
  const list = r?.calendars?.primary?.busy as { start: string; end: string }[] | undefined;
  return list ? list.map((b) => ({ start: new Date(b.start), end: new Date(b.end) })) : null;
}

type Event = { start: Date; end: Date; client: string; email: string | null; coach: string | null };

const eventBody = (e: Event) => ({
  summary: `Control · ${e.client}`,
  description: `Control de Mi progreso${e.coach ? ` (coach: ${e.coach})` : ""}. Turno desde ${portalUrl.replace("https://", "")}.`,
  start: { dateTime: e.start.toISOString(), timeZone: TZ },
  end: { dateTime: e.end.toISOString(), timeZone: TZ },
  // Como invitado: Google le manda el aviso al cliente (y los cambios y la cancelación)
  attendees: e.email ? [{ email: e.email }] : [],
});

/** Crea el evento y devuelve su id (null si no hay conexión o falló). */
export async function createEvent(e: Event): Promise<string | null> {
  const r = await call("POST", "/calendars/primary/events?sendUpdates=all", eventBody(e));
  return (r?.id as string | undefined) ?? null;
}

export async function moveEvent(id: string, e: Event) {
  return Boolean(await call("PATCH", `/calendars/primary/events/${encodeURIComponent(id)}?sendUpdates=all`, eventBody(e)));
}

export async function deleteEvent(id: string) {
  return Boolean(await call("DELETE", `/calendars/primary/events/${encodeURIComponent(id)}?sendUpdates=all`));
}
