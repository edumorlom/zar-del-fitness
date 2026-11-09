"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { canCreate, canManage, scopesToSave } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { BODY_TYPES, CONDITIONS, MEASURES, PLANS } from "~/lib/clients";
import { randomUUID } from "node:crypto";
import { db } from "~/lib/db";
import { fromLocalInput, todayISO } from "~/lib/format";
import { bucketFromEnv, deleteObject, imageType, PHOTO_MAX_MB, putObject } from "~/lib/storage";

export type FormState = { error?: string; ok?: string } | null;

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Clientes ----------

export async function saveClient(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = form.get("id") ? Number(form.get("id")) : null;
  if (id === null && !canCreate(viewer)) return { error: "No podés crear clientes." };
  if (id !== null) {
    const { rows } = await db.query<{ coach_id: number | null }>("select coach_id from users where id = $1", [id]);
    if (!rows[0] || !canManage(viewer, rows[0])) return { error: "No podés editar este cliente." };
  }

  const goal = text(form, "goal") || null;
  const next = text(form, "next_control_at");
  const nextControl = fromLocalInput(next);
  if (next && Number.isNaN(nextControl?.getTime())) return { error: "Revisá la fecha del próximo control." };

  // Sin ser admin, de una cuenta que ya existe sólo se cambia el objetivo y el próximo control (el coach, de sus clientes).
  if (id !== null && !viewer.scopes.includes("admin")) {
    await db.query("update users set goal = $1, next_control_at = $2 where id = $3", [goal, nextControl, id]);
    refresh();
    return { ok: "Guardado." };
  }

  const name = text(form, "name");
  const email = text(form, "email").toLowerCase() || null;
  const scopes = scopesToSave(viewer, form.getAll("scopes").map(String));
  const coachId = text(form, "coach_id") ? Number(text(form, "coach_id")) : null;
  const clientSince = text(form, "client_since") || todayISO();
  const passExpires = text(form, "pass_expires") || null;
  const plan = text(form, "plan") || null;
  const sex = text(form, "sex") || null;
  const ageYears = text(form, "age") ? Number(text(form, "age")) : null;
  const height = text(form, "height_cm") ? Number(text(form, "height_cm")) : null;
  const bodyType = text(form, "body_type") || null;
  const conditions = form.getAll("conditions").map(String);

  if (!name) return { error: "Falta el nombre." };
  if (email && !EMAIL.test(email)) return { error: "Revisá el correo: con él entra al portal." };
  if (!scopes) return { error: "Elegí al menos un rol." };
  if (id === viewer.id && !scopes.includes("admin")) return { error: "No podés quitarte el rol de admin." };
  if (coachId !== null && (!Number.isInteger(coachId) || coachId === id)) return { error: "Elegí otro coach." };
  if (coachId !== null) {
    const { rowCount } = await db.query("select 1 from users where id = $1 and scopes && array['coach', 'admin']", [coachId]);
    if (!rowCount) return { error: "Ese coach no existe." };
  }
  if (!DATE.test(clientSince) || (passExpires && !DATE.test(passExpires))) return { error: "Revisá las fechas." };
  if (plan && !PLANS.some((p) => p.id === plan)) return { error: "Elegí un plan de la lista." };
  if (sex && sex !== "M" && sex !== "F") return { error: "Elegí el sexo." };
  if (ageYears !== null && !(Number.isInteger(ageYears) && ageYears >= 5 && ageYears <= 110))
    return { error: "Revisá la edad." };
  if (height !== null && !(Number.isInteger(height) && height >= 80 && height <= 250))
    return { error: "La estatura va en centímetros, entre 80 y 250." };
  if (bodyType && !BODY_TYPES.includes(bodyType as (typeof BODY_TYPES)[number])) return { error: "Elegí el estado físico." };
  if (conditions.some((c) => !CONDITIONS.includes(c as (typeof CONDITIONS)[number])))
    return { error: "Revisá las patologías." };

  // La foto va al bucket antes de guardar: si no se pudo subir, no se guarda nada (y no queda un cliente repetido).
  // Sin foto nueva queda la que tenía. La clave usa external_id, como las del portal anterior; quien no tiene, recibe uno.
  let photoUrl: string | null = null;
  let externalId: string | null = null;
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    if (file.size > PHOTO_MAX_MB * 1024 * 1024) return { error: `La foto pesa más de ${PHOTO_MAX_MB} MB.` };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = imageType(bytes);
    if (!type) return { error: "La foto tiene que ser JPG o PNG." };
    const bucket = bucketFromEnv();
    if (!bucket) return { error: "No se pueden subir fotos: faltan las variables del bucket." };
    if (id !== null) {
      const { rows } = await db.query<{ external_id: string | null }>("select external_id from users where id = $1", [id]);
      externalId = rows[0]?.external_id ?? null;
    }
    externalId ??= randomUUID();
    const key = `alumnos/${externalId}/foto.${type}`;
    try {
      await putObject(bucket, key, bytes, type === "png" ? "image/png" : "image/jpeg");
    } catch (e) {
      console.error(e);
      return { error: "No se pudo subir la foto. Probá de nuevo." };
    }
    // ?v=: con la misma dirección, el navegador seguiría mostrando la foto anterior.
    photoUrl = `/archivos/${key}?v=${Date.now()}`;
  }

  const fields = [name, email, scopes, coachId, text(form, "phone") || null, photoUrl, plan,
    clientSince, passExpires, nextControl, goal, text(form, "dni") || null, sex,
    ageYears === null ? null : Number(todayISO().slice(0, 4)) - ageYears, height, bodyType, conditions,
    text(form, "medications") || null, text(form, "notes") || null, form.get("active") === "on",
    text(form, "title") || null, externalId];
  let created: number | undefined;
  try {
    if (id === null) {
      const { rows } = await db.query<{ id: number }>(
        `insert into users (name, email, scopes, coach_id, phone, photo_url, plan, client_since, pass_expires,
                            next_control_at, goal, dni, sex, birth_year, height_cm, body_type, conditions, medications,
                            notes, active, title, external_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         returning id`,
        fields
      );
      created = rows[0].id;
    } else {
      // Con otro correo, se desenlaza de su cuenta de Clerk: la próxima vez entra (y se enlaza) con el nuevo.
      await db.query(
        `update users set name = $1, email = $2, scopes = $3, coach_id = $4, phone = $5,
                photo_url = coalesce($6, photo_url), plan = $7,
                client_since = $8, pass_expires = $9, next_control_at = $10, goal = $11, dni = $12, sex = $13,
                birth_year = $14, height_cm = $15, body_type = $16, conditions = $17, medications = $18, notes = $19,
                active = $20, title = $21, external_id = coalesce(external_id, $22),
                clerk_id = case when email is not distinct from $2 then clerk_id end
         where id = $23`,
        [...fields, id]
      );
    }
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { error: "Ese correo ya lo tiene otra cuenta." };
    throw e;
  }
  // Recepción no puede abrir la ficha que creó: vuelve al formulario, vacío para cargar otro.
  if (created !== undefined) redirect(canManage(viewer, { coach_id: coachId }) ? `/portal/clientes/${created}` : `/portal/clientes/nuevo?creado=${created}`);
  refresh();
  return { ok: "Guardado." };
}

/** Sólo el admin, y nunca su propia cuenta (así siempre queda al menos un admin). Se borran también sus controles. */
export async function deleteClient(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("admin")) return { error: "Sólo el admin puede borrar clientes." };
  const id = Number(form.get("id"));
  if (id === viewer.id) return { error: "No podés borrar tu propia cuenta." };
  // checkins y fotos: on delete cascade; los clientes de un coach borrado quedan sin coach (on delete set null)
  const photos = await db.query<{ key: string }>("select key from progress_photos where client_id = $1", [id]);
  const { rowCount } = await db.query("delete from users where id = $1", [id]);
  if (!rowCount) return { error: "Ese cliente ya no existe." };
  // Las fotos de progreso, también del bucket: no quedan fotos de alguien que ya no está en el portal.
  const bucket = bucketFromEnv();
  if (bucket) await Promise.all(photos.rows.map((p) => deleteObject(bucket, p.key).catch((e) => console.error(e))));
  redirect("/portal/clientes");
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

  // Lo opcional: vacío queda sin medir; si viene, dentro de un rango creíble.
  const extra: (number | null)[] = [];
  for (const m of MEASURES) {
    const raw = text(form, m.key);
    const v = raw ? decimal(form, m.key) : null;
    if (v !== null && !(v >= m.min && v <= m.max)) return { error: `${m.label}: entre ${m.min} y ${m.max}.` };
    extra.push(v === null ? null : m.int ? Math.round(v) : v);
  }

  await db.query(
    `insert into checkins (client_id, date, weight_kg, body_fat_pct, created_by, ${MEASURES.map((m) => m.key).join(", ")})
     values ($1, $2, $3, $4, $5, ${MEASURES.map((_, i) => `$${i + 6}`).join(", ")})`,
    [clientId, date, weight, fat, viewer.id, ...extra]
  );
  refresh();
  return { ok: "Evaluación cargada." };
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

// ---------- Fotos de progreso ----------

/** Las suben y las borran sólo quienes manejan al cliente (su coach o el admin); el cliente sólo las ve. */
async function photoOwner(clientId: number) {
  const viewer = await requireViewer();
  const { rows } = await db.query<{ id: number; coach_id: number | null; external_id: string | null }>(
    "select id, coach_id, external_id from users where id = $1",
    [clientId]
  );
  const client = rows[0];
  return client && canManage(viewer, client) ? { viewer, client } : null;
}

/**
 * Una foto por llamada: el navegador ya la achicó (PhotoUpload) y así cada una entra en serverActions.bodySizeLimit
 * aunque se elijan varias juntas.
 */
export async function addProgressPhoto(_: FormState, form: FormData): Promise<FormState> {
  const access = await photoOwner(Number(form.get("client_id")));
  if (!access) return { error: "No podés subir fotos de este cliente." };
  const takenOn = text(form, "taken_on") || todayISO();
  if (!DATE.test(takenOn) || takenOn > todayISO()) return { error: "Revisá la fecha: no puede ser futura." };

  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Elegí una foto." };
  if (file.size > PHOTO_MAX_MB * 1024 * 1024) return { error: `La foto pesa más de ${PHOTO_MAX_MB} MB.` };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type) return { error: "La foto tiene que ser JPG o PNG." };
  const bucket = bucketFromEnv();
  if (!bucket) return { error: "No se pueden subir fotos: faltan las variables del bucket." };

  // La carpeta del cliente usa su external_id, como la foto de la ficha; quien no tiene, recibe uno.
  let externalId = access.client.external_id;
  if (!externalId) {
    const { rows } = await db.query<{ external_id: string }>(
      "update users set external_id = coalesce(external_id, $1) where id = $2 returning external_id",
      [randomUUID(), access.client.id]
    );
    externalId = rows[0].external_id;
  }
  const key = `alumnos/${externalId}/progreso/${randomUUID()}.${type}`;
  try {
    await putObject(bucket, key, bytes, type === "png" ? "image/png" : "image/jpeg");
  } catch (e) {
    console.error(e);
    return { error: "No se pudo subir la foto. Probá de nuevo." };
  }
  await db.query("insert into progress_photos (client_id, key, taken_on, uploaded_by) values ($1, $2, $3, $4)", [
    access.client.id,
    key,
    takenOn,
    access.viewer.id,
  ]);
  refresh();
  return { ok: "Foto subida." };
}

export async function deleteProgressPhoto(_: FormState, form: FormData): Promise<FormState> {
  const { rows } = await db.query<{ client_id: number; key: string }>("select client_id, key from progress_photos where id = $1", [
    Number(form.get("id")),
  ]);
  const photo = rows[0];
  if (!photo || !(await photoOwner(photo.client_id))) return { error: "No podés borrar esta foto." };
  await db.query("delete from progress_photos where id = $1", [Number(form.get("id"))]);
  // Si el bucket falla, la foto ya no aparece en el portal: queda un archivo suelto, nada más.
  const bucket = bucketFromEnv();
  if (bucket) await deleteObject(bucket, photo.key).catch((e) => console.error(e));
  refresh();
  return null;
}
