import "server-only";
import { db } from "./db";
import type { Role } from "./access";

export type Client = {
  id: number;
  role: Role;
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
  abdomen_cm: number | null;
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
    `select u.id, u.role, u.email, u.name, u.coach_id, u.phone, u.photo_url, u.title, u.plan, u.client_since,
            u.pass_expires, u.next_control_at, u.goal, u.dni, u.sex, u.birth_year, u.height_cm, u.body_type,
            u.conditions, u.medications, u.notes, u.active, u.legacy_last_checkin, u.legacy_last_weight,
            u.clerk_id is not null as linked,
            c.name as coach_name, c.phone as coach_phone, c.photo_url as coach_photo, c.title as coach_title
     from users u left join users c on c.id = u.coach_id
     where u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Las evaluaciones de un cliente, de la primera a la última. */
export async function getCheckins(clientId: number) {
  const { rows } = await db.query<Checkin>(
    `select id, date, weight_kg, body_fat_pct, chest_cm, abdomen_cm, biceps_r_cm, biceps_l_cm, leg_r_cm, leg_l_cm,
            biological_age, visceral_fat, bmr_kcal
     from checkins where client_id = $1 order by date, id`,
    [clientId]
  );
  return rows;
}

export type ClientRow = {
  id: number;
  name: string;
  email: string | null;
  dni: string | null;
  role: Role;
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
export async function listClients(viewer: { id: number; role: Role }, f: ClientFilters = {}) {
  const coach = viewer.role === "admin" ? (f.coach ?? null) : viewer.id;
  const { rows } = await db.query<ClientRow>(
    `select u.id, u.name, u.email, u.dni, u.role, u.plan, u.sex, u.birth_year, u.height_cm, u.body_type, u.conditions,
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
     where u.role = 'user'
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
export async function checkinDates(viewer: { id: number; role: Role }, since: string, coach: number | null = null) {
  const { rows } = await db.query<{ date: string; client_id: number }>(
    `select ch.date, ch.client_id from checkins ch join users u on u.id = ch.client_id
     where ch.date >= $1 and u.role = 'user' and ($2::int is null or u.coach_id = $2)`,
    [since, viewer.role === "admin" ? coach : viewer.id]
  );
  return rows;
}

export type Coach = { id: number; name: string; role: Role; title: string | null; photo_url: string | null };

/** Quienes pueden ser coach de un cliente: los coaches y los admins (el Zar es admin y coach). */
export async function getCoaches() {
  const { rows } = await db.query<Coach>(
    "select id, name, role, title, photo_url from users where role in ('coach', 'admin') and active order by role = 'admin' desc, name"
  );
  return rows;
}

export type UserRow = {
  id: number;
  name: string;
  email: string | null;
  role: Role;
  photo_url: string | null;
  title: string | null;
  active: boolean;
  linked: boolean;
  coach_name: string | null;
};

/** Todas las cuentas, para Configuración (sólo el admin). */
export async function listUsers() {
  const { rows } = await db.query<UserRow>(
    `select u.id, u.name, u.email, u.role, u.photo_url, u.title, u.active, u.clerk_id is not null as linked,
            c.name as coach_name
     from users u left join users c on c.id = u.coach_id
     order by case u.role when 'admin' then 0 when 'coach' then 1 else 2 end, u.name`
  );
  return rows;
}
