"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, ROLES, type Role } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { db } from "~/lib/db";
import { fromLocalInput, todayISO } from "~/lib/format";

export type FormState = { error?: string; ok?: string } | null;

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Clientes ----------

export async function saveClient(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = form.get("id") ? Number(form.get("id")) : null;
  if (id === null && viewer.role !== "admin") return { error: "Sólo el admin puede crear clientes." };
  if (id !== null) {
    const { rows } = await db.query<{ coach_id: number | null }>("select coach_id from users where id = $1", [id]);
    if (!rows[0] || !canManage(viewer, rows[0])) return { error: "No podés editar este cliente." };
  }

  const goal = text(form, "goal") || null;
  const next = text(form, "next_control_at");
  const nextControl = fromLocalInput(next);
  if (next && Number.isNaN(nextControl?.getTime())) return { error: "Revisá la fecha del próximo control." };

  // El coach sólo cambia el objetivo y el próximo control de sus clientes.
  if (viewer.role === "coach") {
    await db.query("update users set goal = $1, next_control_at = $2 where id = $3", [goal, nextControl, id]);
    refresh();
    return { ok: "Guardado." };
  }

  const name = text(form, "name");
  const email = text(form, "email").toLowerCase();
  const role = text(form, "role") as Role;
  const coachId = text(form, "coach_id") ? Number(text(form, "coach_id")) : null;
  const clientSince = text(form, "client_since") || todayISO();
  const passExpires = text(form, "pass_expires") || null;

  if (!name) return { error: "Falta el nombre." };
  if (!EMAIL.test(email)) return { error: "Revisá el correo: con él entra al portal." };
  if (!ROLES.includes(role)) return { error: "Elegí un rol." };
  if (id === viewer.id && role !== viewer.role) return { error: "No podés cambiar tu propio rol." };
  if (coachId !== null && (!Number.isInteger(coachId) || coachId === id)) return { error: "Elegí otro coach." };
  if (coachId !== null) {
    const { rowCount } = await db.query("select 1 from users where id = $1 and role in ('coach', 'admin')", [coachId]);
    if (!rowCount) return { error: "Ese coach no existe." };
  }
  if (!DATE.test(clientSince) || (passExpires && !DATE.test(passExpires))) return { error: "Revisá las fechas." };

  const fields = [name, email, role, coachId, text(form, "phone") || null, text(form, "photo_url") || null,
    text(form, "plan") || null, clientSince, passExpires, nextControl, goal];
  let created: number | undefined;
  try {
    if (id === null) {
      const { rows } = await db.query<{ id: number }>(
        `insert into users (name, email, role, coach_id, phone, photo_url, plan, client_since, pass_expires,
                            next_control_at, goal)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning id`,
        fields
      );
      created = rows[0].id;
    } else {
      // Con otro correo, se desenlaza de su cuenta de Clerk: la próxima vez entra (y se enlaza) con el nuevo.
      await db.query(
        `update users set name = $1, email = $2, role = $3, coach_id = $4, phone = $5, photo_url = $6, plan = $7,
                client_since = $8, pass_expires = $9, next_control_at = $10, goal = $11,
                clerk_id = case when email = $2 then clerk_id end
         where id = $12`,
        [...fields, id]
      );
    }
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { error: "Ese correo ya lo tiene otra cuenta." };
    throw e;
  }
  if (created !== undefined) redirect(`/clientes/${created}`);
  refresh();
  return { ok: "Guardado." };
}

// ---------- Controles ----------

const decimal = (form: FormData, key: string) => Number(text(form, key).replace(",", "."));

export async function addCheckin(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const clientId = Number(form.get("client_id"));
  const { rows } = await db.query<{ coach_id: number | null }>("select coach_id from users where id = $1", [clientId]);
  if (!rows[0] || !canManage(viewer, rows[0])) return { error: "No podés cargar controles de este cliente." };

  const date = text(form, "date");
  const weight = decimal(form, "weight_kg");
  const fat = decimal(form, "body_fat_pct");
  if (!DATE.test(date) || date > todayISO()) return { error: "Revisá la fecha: no puede ser futura." };
  if (!(weight >= 20 && weight <= 400)) return { error: "El peso va en kg, entre 20 y 400." };
  if (!(fat >= 1 && fat <= 80)) return { error: "El % graso va entre 1 y 80." };

  await db.query(
    "insert into checkins (client_id, date, weight_kg, body_fat_pct, created_by) values ($1, $2, $3, $4, $5)",
    [clientId, date, weight, fat, viewer.id]
  );
  refresh();
  return { ok: "Control cargado." };
}

export async function deleteCheckin(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = Number(form.get("id"));
  const { rows } = await db.query<{ coach_id: number | null }>(
    "select u.coach_id from checkins c join users u on u.id = c.client_id where c.id = $1",
    [id]
  );
  if (!rows[0] || !canManage(viewer, rows[0])) return { error: "No podés borrar este control." };
  await db.query("delete from checkins where id = $1", [id]);
  refresh();
  return null;
}
