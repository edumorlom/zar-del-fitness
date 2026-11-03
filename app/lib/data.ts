import "server-only";
import { db } from "./db";
import type { Role } from "./access";

export type Client = {
  id: number;
  role: Role;
  email: string;
  name: string;
  coach_id: number | null;
  phone: string | null;
  photo_url: string | null;
  plan: string | null;
  client_since: string;
  pass_expires: string | null;
  next_control_at: Date | null;
  goal: string | null;
  coach_name: string | null;
  coach_phone: string | null;
  coach_photo: string | null;
};

export type Checkin = { id: number; date: string; weight_kg: number; body_fat_pct: number };

export async function getClient(id: number) {
  const { rows } = await db.query<Client>(
    `select u.id, u.role, u.email, u.name, u.coach_id, u.phone, u.photo_url, u.plan, u.client_since,
            u.pass_expires, u.next_control_at, u.goal,
            c.name as coach_name, c.phone as coach_phone, c.photo_url as coach_photo
     from users u left join users c on c.id = u.coach_id
     where u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Los controles de un cliente, del primero al último. */
export async function getCheckins(clientId: number) {
  const { rows } = await db.query<Checkin>(
    "select id, date, weight_kg, body_fat_pct from checkins where client_id = $1 order by date, id",
    [clientId]
  );
  return rows;
}

export type ClientRow = {
  id: number;
  name: string;
  email: string;
  role: Role;
  coach_name: string | null;
  pass_expires: string | null;
  last_checkin: string | null;
};

/** Los clientes que ve alguien: el admin, todos (también coaches y admins); un coach, los suyos. */
export async function listClients(viewer: { id: number; role: Role }, q: string) {
  const { rows } = await db.query<ClientRow>(
    `select u.id, u.name, u.email, u.role, u.pass_expires, c.name as coach_name,
            (select max(date) from checkins where client_id = u.id) as last_checkin
     from users u left join users c on c.id = u.coach_id
     where ($1::int is null or u.coach_id = $1)
       and ($2 = '' or u.name ilike '%' || $2 || '%' or u.email ilike '%' || $2 || '%')
     order by u.name`,
    [viewer.role === "admin" ? null : viewer.id, q]
  );
  return rows;
}

/** Quienes pueden ser coach de un cliente. */
export async function getCoaches() {
  const { rows } = await db.query<{ id: number; name: string }>(
    "select id, name from users where role in ('coach', 'admin') order by name"
  );
  return rows;
}
