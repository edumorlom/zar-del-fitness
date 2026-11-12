import "server-only";
import type { PoolClient } from "pg";
import { MEALS } from "./clients";
import { db } from "./db";
import type { Scope } from "./access";

/** La foto de perfil de `u`: de un cliente, su última foto de progreso; si no tiene, la de su ficha. */
export const PHOTO_URL = `coalesce((select '/archivos/' || pp.key from progress_photos pp where pp.client_id = u.id
  order by pp.taken_on desc, pp.id desc limit 1), u.photo_url) as photo_url`;

export type Client = {
  id: number;
  scopes: Scope[];
  email: string | null;
  name: string;
  coach_id: number | null;
  phone: string | null;
  photo_url: string | null;
  title: string | null;
  plan: string | null;
  client_since: string;
  pass_expires: string | null;
  next_control_at: Date | null;
  goal: string | null;
  dni: string | null;
  sex: "M" | "F" | null;
  birth_year: number | null;
  height_cm: number | null;
  body_type: string | null;
  conditions: string[];
  medications: string | null;
  notes: string | null;
  active: boolean;
  legacy_last_checkin: string | null;
  legacy_last_weight: number | null;
  certificate_url: string | null;
  linked: boolean;
  coach_name: string | null;
  coach_phone: string | null;
  coach_photo: string | null;
  coach_title: string | null;
};

/** Una evaluación: lo de siempre (peso y % graso) y lo opcional (perímetros en cm y lo que da la balanza). */
export type Checkin = {
  id: number;
  date: string;
  weight_kg: number;
  body_fat_pct: number;
  chest_cm: number | null;
  bust_cm: number | null;
  waist_cm: number | null;
  abdomen_cm: number | null;
  hip_cm: number | null;
  biceps_r_cm: number | null;
  biceps_l_cm: number | null;
  leg_r_cm: number | null;
  leg_l_cm: number | null;
  biological_age: number | null;
  visceral_fat: number | null;
  bmr_kcal: number | null;
};

export async function getClient(id: number) {
  const { rows } = await db.query<Client>(
    `select u.id, u.scopes, u.email, u.name, u.coach_id, u.phone, ${PHOTO_URL}, u.title, u.plan, u.client_since,
            u.pass_expires, u.next_control_at, u.goal, u.dni, u.sex, u.birth_year, u.height_cm, u.body_type,
            u.conditions, u.medications, u.notes, u.active, u.legacy_last_checkin, u.legacy_last_weight,
            u.certificate_url, u.clerk_id is not null as linked,
            c.name as coach_name, c.phone as coach_phone, c.photo_url as coach_photo, c.title as coach_title
     from users u left join users c on c.id = u.coach_id
     where u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

const CHECKIN_COLS = `c.id, c.date, c.weight_kg, c.body_fat_pct, c.chest_cm, c.bust_cm, c.waist_cm, c.abdomen_cm, c.hip_cm,
  c.biceps_r_cm, c.biceps_l_cm, c.leg_r_cm, c.leg_l_cm, c.biological_age, c.visceral_fat, c.bmr_kcal`;

/** Las evaluaciones de un cliente, de la primera a la última. */
export async function getCheckins(clientId: number) {
  const { rows } = await db.query<Checkin>(`select ${CHECKIN_COLS} from checkins c where c.client_id = $1 order by c.date, c.id`, [
    clientId,
  ]);
  return rows;
}

export type Diet = Record<"goal" | (typeof MEALS)[number]["key"], string | null> & { date: string };

/** El plan de alimentación vigente: el de la última evaluación que trajo uno. */
export async function getDiet(clientId: number) {
  const { rows } = await db.query<Diet>(
    `select c.date, d.goal, ${MEALS.map((m) => `d.${m.key}`).join(", ")}
     from diets d join checkins c on c.id = d.checkin_id
     where c.client_id = $1 order by c.date desc, c.id desc limit 1`,
    [clientId]
  );
  return rows[0] ?? null;
}

/** Una evaluación con su plan de alimentación (si se le dio uno), para editarla. */
export async function getCheckin(id: number) {
  const { rows } = await db.query<Checkin & Omit<Diet, "date"> & { client_id: number; has_diet: boolean }>(
    `select ${CHECKIN_COLS}, c.client_id, d.id is not null as has_diet, d.goal, ${MEALS.map((m) => `d.${m.key}`).join(", ")}
     from checkins c left join diets d on d.checkin_id = c.id where c.id = $1`,
    [id]
  );
  const r = rows[0];
  return r ? { checkin: r as Checkin, clientId: r.client_id, diet: r.has_diet ? (r as Diet) : null } : null;
}

export type ProgressPhoto = { id: number; url: string; taken_on: string };

/** Las fotos de progreso de un cliente, la más nueva primero. Se sirven por /archivos/ (que revisa quién las pide). */
export async function getProgressPhotos(clientId: number) {
  const { rows } = await db.query<ProgressPhoto>(
    `select id, '/archivos/' || key as url, taken_on from progress_photos
     where client_id = $1 order by taken_on desc, id desc`,
    [clientId]
  );
  return rows;
}

export type ClientRow = {
  id: number;
  name: string;
  email: string | null;
  photo_url: string | null;
  dni: string | null;
  plan: string | null;
  sex: "M" | "F" | null;
  birth_year: number | null;
  height_cm: number | null;
  body_type: string | null;
  conditions: string[];
  active: boolean;
  pass_expires: string | null;
  client_since: string;
  coach_id: number | null;
  coach_name: string | null;
  coach_photo: string | null;
  /** La última evaluación (la del portal o, si no hay, la que vino del portal anterior). */
  last_date: string | null;
  last_weight: number | null;
  last_fat: number | null;
  prev_fat: number | null;
  checkins: number;
};

export type ClientFilters = { q?: string; coach?: number | null; plan?: string; active?: boolean };

/**
 * Los clientes que ve alguien (sólo rol cliente): el admin, todos; un coach, los suyos. Con su última evaluación, para
 * la lista y el dashboard.
 */
export async function listClients(viewer: { id: number; scopes: Scope[] }, f: ClientFilters = {}) {
  const coach = viewer.scopes.includes("admin") ? (f.coach ?? null) : viewer.id;
  const { rows } = await db.query<ClientRow>(
    `select u.id, u.name, u.email, ${PHOTO_URL}, u.dni, u.plan, u.sex, u.birth_year, u.height_cm, u.body_type, u.conditions,
            u.active, u.pass_expires, u.client_since, u.coach_id, c.name as coach_name, c.photo_url as coach_photo,
            coalesce(l.date, u.legacy_last_checkin) as last_date,
            coalesce(l.weight_kg, u.legacy_last_weight) as last_weight,
            l.body_fat_pct as last_fat, p.body_fat_pct as prev_fat,
            (select count(*)::int from checkins where client_id = u.id) as checkins
     from users u
     left join users c on c.id = u.coach_id
     left join lateral (select date, weight_kg, body_fat_pct from checkins where client_id = u.id
                        order by date desc, id desc limit 1) l on true
     left join lateral (select body_fat_pct from checkins where client_id = u.id
                        order by date desc, id desc offset 1 limit 1) p on true
     where 'user' = any(u.scopes)
       and ($1::int is null or u.coach_id = $1)
       and ($2::text = '' or u.name ilike '%' || $2 || '%' or u.dni ilike $2 || '%' or u.email ilike '%' || $2 || '%')
       and ($3::text = '' or ($3 = '-' and u.plan is null) or u.plan = $3)
       and ($4::boolean is null or u.active = $4)
     order by u.name`,
    [coach, (f.q ?? "").trim(), f.plan ?? "", f.active ?? null]
  );
  return rows;
}

/** Las fechas de evaluación de los clientes que ve alguien desde `since`, para contar por semana. */
export async function checkinDates(viewer: { id: number; scopes: Scope[] }, since: string, coach: number | null = null) {
  const { rows } = await db.query<{ date: string; client_id: number }>(
    `select ch.date, ch.client_id from checkins ch join users u on u.id = ch.client_id
     where ch.date >= $1 and 'user' = any(u.scopes) and ($2::int is null or u.coach_id = $2)`,
    [since, viewer.scopes.includes("admin") ? coach : viewer.id]
  );
  return rows;
}

export type Coach = { id: number; name: string; scopes: Scope[]; title: string | null; photo_url: string | null };

/** Quienes pueden ser coach de un cliente: los coaches y los admins (el Zar es admin y coach). */
export async function getCoaches() {
  const { rows } = await db.query<Coach>(
    "select id, name, scopes, title, photo_url from users where scopes && array['coach', 'admin'] and active order by 'admin' = any(scopes) desc, name"
  );
  return rows;
}

export type UserRow = {
  id: number;
  name: string;
  email: string | null;
  scopes: Scope[];
  photo_url: string | null;
  title: string | null;
  active: boolean;
  linked: boolean;
  coach_name: string | null;
};

/** Todas las cuentas, para Configuración (sólo el admin). */
export async function listUsers() {
  const { rows } = await db.query<UserRow>(
    `select u.id, u.name, u.email, u.scopes, ${PHOTO_URL}, u.title, u.active, u.clerk_id is not null as linked,
            c.name as coach_name
     from users u left join users c on c.id = u.coach_id
     order by case when 'admin' = any(u.scopes) then 0 when 'coach' = any(u.scopes) then 1 else 2 end, u.name`
  );
  return rows;
}

export type Appointment = {
  id: number;
  client_id: number;
  starts_at: Date;
  ends_at: Date;
  status: "requested" | "confirmed" | "cancelled" | "rejected";
  requested_at: Date | null;
  google_event_id: string | null;
  client_name: string;
  client_email: string | null;
  coach_id: number | null;
  coach_name: string | null;
};

const APPT = `select a.id, a.client_id, a.starts_at, a.ends_at, a.status, a.requested_at, a.google_event_id,
                     u.name as client_name, u.email as client_email, u.coach_id, c.name as coach_name
              from appointments a join users u on u.id = a.client_id left join users c on c.id = u.coach_id`;

/** El turno vivo de un cliente (pedido o confirmado, que todavía no pasó). */
export async function getOpenAppointment(clientId: number) {
  const { rows } = await db.query<Appointment>(
    `${APPT} where a.client_id = $1 and a.status in ('requested', 'confirmed') and a.ends_at > now()
     order by a.starts_at limit 1`,
    [clientId]
  );
  return rows[0] ?? null;
}

export async function getAppointment(id: number) {
  const { rows } = await db.query<Appointment>(`${APPT} where a.id = $1`, [id]);
  return rows[0] ?? null;
}

/** Los turnos vivos entre dos momentos que ve alguien: el admin, todos; un coach, los de sus clientes. */
export async function listAppointments(viewer: { id: number; scopes: Scope[] }, from: Date, to: Date) {
  const { rows } = await db.query<Appointment>(
    `${APPT} where a.status in ('requested', 'confirmed') and a.starts_at < $2 and a.ends_at > $1
       and ($3::int is null or u.coach_id = $3)
     order by a.starts_at`,
    [from, to, viewer.scopes.includes("admin") ? null : viewer.id]
  );
  return rows;
}

/** Los pedidos que esperan respuesta (de hoy en adelante). */
export async function pendingRequests(viewer: { id: number; scopes: Scope[] }) {
  const { rows } = await db.query<Appointment>(
    `${APPT} where a.status = 'requested' and a.ends_at > now() and ($1::int is null or u.coach_id = $1)
     order by a.starts_at`,
    [viewer.scopes.includes("admin") ? null : viewer.id]
  );
  return rows;
}

/** Lo ocupado por turnos del portal (de todos: es un solo calendario) entre dos momentos. */
export async function takenIntervals(from: Date, to: Date, exceptId: number | null = null, connection: Pick<PoolClient, "query"> = db) {
  const { rows } = await connection.query<{ start: Date; end: Date }>(
    `select starts_at as start, ends_at as "end" from appointments
     where status in ('requested', 'confirmed') and starts_at < $2 and ends_at > $1 and ($3::int is null or id <> $3)`,
    [from, to, exceptId]
  );
  return rows;
}
