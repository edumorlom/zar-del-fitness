"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { canCreate, canManage, isTeam, scopesToSave } from "~/lib/access";
import { requireViewer, type Viewer } from "~/lib/auth";
import { BODY_TYPES, CONDITIONS, MEALS, MEASURES, PLANS } from "~/lib/clients";
import { db } from "~/lib/db";
import { DIET_IMAGES, DIET_SUBJECT, type DietEmail, renderDietEmail } from "~/lib/diet-email";
import { sendMail } from "~/lib/email-layout";
import { type EvaluationEmail, IMAGES, renderEvaluationEmail, SUBJECT } from "~/lib/evaluation-email";
import { DATE, decimal, type FormState, isEmail, type Mail, text } from "~/lib/form";
import { fromLocalInput, todayISO } from "~/lib/format";
import { bucketFromEnv, deleteObject, type Photo, putObject, readPhoto } from "~/lib/storage";

export type { FormState, Mail };

// ---------- Quién puede qué ----------

type Managed = { id: number; coach_id: number | null; external_id: string | null; name: string; email: string | null; active: boolean };

/** El cliente, si quien entró puede cargarle datos (el admin, o su coach); null si no existe o no puede. */
async function managedClient(viewer: Viewer, clientId: number): Promise<Managed | null> {
  const { rows } = await db.query<Managed>("select id, coach_id, external_id, name, email, active from users where id = $1", [clientId]);
  return rows[0] && canManage(viewer, rows[0]) ? rows[0] : null;
}

/** Una evaluación, si quien entró maneja a su cliente; null si no existe o no puede. */
async function managedCheckin(viewer: Viewer, checkinId: number) {
  const { rows } = await db.query<{ client_id: number; coach_id: number | null }>(
    "select c.client_id, u.coach_id from checkins c join users u on u.id = c.client_id where c.id = $1",
    [checkinId]
  );
  return rows[0] && canManage(viewer, rows[0]) ? rows[0] : null;
}

// ---------- Fotos ----------

/** La carpeta del cliente en el bucket usa su external_id, como las fotos del portal anterior; quien no tiene, recibe uno. */
async function ensureExternalId(clientId: number) {
  const { rows } = await db.query<{ external_id: string }>(
    "update users set external_id = coalesce(external_id, $1) where id = $2 returning external_id",
    [randomUUID(), clientId]
  );
  return rows[0].external_id;
}

/** Sube la foto al bucket; si no se pudo, por qué (y no se guarda nada en la base). */
async function uploadPhoto(key: string, photo: Photo): Promise<string | null> {
  const bucket = bucketFromEnv();
  if (!bucket) return "No se pueden subir fotos: faltan las variables del bucket.";
  try {
    await putObject(bucket, key, photo.bytes, photo.contentType);
    return null;
  } catch (e) {
    console.error(e);
    return "No se pudo subir la foto. Probá de nuevo.";
  }
}

/** Borra archivos del bucket, si está; si falla, quedan sueltos (ya no aparecen en el portal) y el error va a los logs. */
async function deleteFiles(keys: string[]) {
  const bucket = bucketFromEnv();
  if (bucket) await Promise.all(keys.map((k) => deleteObject(bucket, k).catch((e) => console.error(e))));
}

// ---------- Clientes ----------

export async function saveClient(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = form.get("id") ? Number(form.get("id")) : null;
  if (id === null && !canCreate(viewer)) return { error: "No podés crear clientes." };
  if (id !== null && !(await managedClient(viewer, id))) return { error: "No podés editar este cliente." };

  const goal = text(form, "goal") || null;
  const next = text(form, "next_control_at");
  const nextControl = fromLocalInput(next);
  if (next && !nextControl) return { error: "Revisá la fecha del próximo control." };

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
  if (email && !isEmail(email)) return { error: "Revisá el correo: con él entra al portal." };
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
  // Sin foto nueva queda la que tenía. De un cliente, la foto va a sus fotos de progreso (la última es la de perfil);
  // la del equipo, a su ficha.
  const client = !isTeam({ scopes });
  let photoUrl: string | null = null;
  let progressKey: string | null = null;
  let externalId: string | null = null;
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    const photo = await readPhoto(file);
    if ("error" in photo) return photo;
    externalId = id !== null ? await ensureExternalId(id) : randomUUID();
    const key = client ? `alumnos/${externalId}/progreso/${randomUUID()}.${photo.type}` : `alumnos/${externalId}/foto.${photo.type}`;
    const error = await uploadPhoto(key, photo);
    if (error) return { error };
    if (client) progressKey = key;
    // ?v=: con la misma dirección, el navegador seguiría mostrando la foto anterior.
    else photoUrl = `/archivos/${key}?v=${Date.now()}`;
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
  if (progressKey)
    await db.query("insert into progress_photos (client_id, key, uploaded_by) values ($1, $2, $3)", [created ?? id, progressKey, viewer.id]);
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
  await deleteFiles(photos.rows.map((p) => p.key));
  redirect("/portal/clientes");
}

// ---------- Controles ----------

const DIET_COLS = ["goal", ...MEALS.map((m) => m.key)];

/** Lo que se carga en una evaluación, validado: lo mismo al cargarla que al editarla. */
function readCheckin(form: FormData) {
  const date = text(form, "date");
  const weight = decimal(form, "weight_kg");
  const fat = decimal(form, "body_fat_pct");
  if (!DATE.test(date) || date > todayISO()) return { error: "Revisá la fecha: no puede ser futura." };
  if (!(weight >= 20 && weight <= 400)) return { error: "El peso va en kg, entre 20 y 400." };
  if (!(fat >= 1 && fat <= 80)) return { error: "El % graso va entre 1 y 80." };

  // Lo opcional: vacío queda sin medir; si viene, dentro de un rango creíble. Lo que el formulario no trae (busto,
  // cintura y cadera, a los hombres: measuresFor) no se toca: al editar, queda lo que tenía.
  const cols = ["date", "weight_kg", "body_fat_pct"];
  const extra: (number | null)[] = [];
  for (const m of MEASURES) {
    if (!form.has(m.key)) continue;
    cols.push(m.key);
    const raw = text(form, m.key);
    const v = raw ? decimal(form, m.key) : null;
    if (v !== null && !(v >= m.min && v <= m.max)) return { error: `${m.label}: entre ${m.min} y ${m.max}.` };
    extra.push(v === null ? null : m.int ? Math.round(v) : v);
  }
  // El plan de alimentación, opcional: todo vacío es sin plan.
  const diet = readDiet(form);
  return { cols, values: [date, weight, fat, ...extra], diet, hasDiet: diet.some(Boolean) };
}

const readDiet = (form: FormData) => DIET_COLS.map((k) => text(form, `diet_${k}`) || null);
const DIET_UPSERT = `on conflict (checkin_id) do update set ${DIET_COLS.map((k) => `${k} = excluded.${k}`).join(", ")}`;
const params = (from: number, n: number) => Array.from({ length: n }, (_, i) => `$${from + i}`).join(", ");

/**
 * El plan solo, sin cargar una evaluación: va a la última evaluación del cliente, y así pasa a ser el vigente. Si cambió
 * algo, al cliente le llega por correo (renderDietEmail); guardarlo igual que estaba no le manda otro.
 */
export async function saveDiet(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const client = await managedClient(viewer, Number(form.get("client_id")));
  if (!client) return { error: "No podés cambiar el plan de este cliente." };
  const diet = readDiet(form);
  if (!diet.some(Boolean)) return { error: "Completá al menos un campo del plan." };

  // El plan que tenía la última evaluación, para saber si cambió.
  const before = await db.query<Record<string, string | null>>(
    `select ${DIET_COLS.map((k) => `d.${k}`).join(", ")} from checkins c left join diets d on d.checkin_id = c.id
     where c.client_id = $1 order by c.date desc, c.id desc limit 1`,
    [client.id]
  );
  // Sin contar espacios de más ni el \r\n con que el navegador manda los saltos de línea.
  const norm = (v: string | null | undefined) => v?.replace(/\r\n/g, "\n").trim() || null;
  const changed = DIET_COLS.some((k, i) => norm(before.rows[0]?.[k]) !== norm(diet[i]));

  const { rowCount } = await db.query(
    `insert into diets (checkin_id, ${DIET_COLS.join(", ")})
     select id, ${params(2, diet.length)} from checkins where client_id = $1 order by date desc, id desc limit 1
     ${DIET_UPSERT}`,
    [client.id, ...diet]
  );
  if (!rowCount) return { error: "Cargá primero una evaluación: el plan va con ella." };
  refresh();
  if (!changed) return { ok: "Plan guardado. No cambió nada: no se le mandó otro correo." };
  // Como el de la evaluación: a quien está dado de baja o no tiene correo no le llega nada.
  if (!client.active || !isEmail(client.email)) return mailed("Plan guardado.", null);
  const html = renderDietEmail({ name: client.name, diet: Object.fromEntries(DIET_COLS.map((k, i) => [k, diet[i]])) as DietEmail["diet"] });
  const sent = await sendMail({ to: client.email!, subject: DIET_SUBJECT, html, attachments: DIET_IMAGES });
  return mailed("Plan guardado.", { to: client.email!, sent });
}

/**
 * La respuesta de un formulario que le manda un correo al cliente: con `mail`, el cartel dice si salió. Si no salió,
 * igual es un "ok" (lo guardado ya quedó, y el formulario se vacía: volver a mandarlo duplicaría la evaluación).
 */
function mailed(ok: string, mail: Mail | null, next?: string): FormState {
  return mail ? { ok, mail, next } : { ok: `${ok} No se le mandó correo: no tiene correo cargado o está dado de baja.`, next };
}

export async function addCheckin(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const client = await managedClient(viewer, Number(form.get("client_id")));
  if (!client) return { error: "No podés cargar controles de este cliente." };
  const c = readCheckin(form);
  if ("error" in c) return c;

  // La evaluación y su plan en la misma consulta, para que no quede una sin la otra.
  const n = 3 + c.values.length;
  const created = await db.query<{ id: number }>(
    `with c as (
       insert into checkins (client_id, created_by, ${c.cols.join(", ")})
       values ($1, $2, ${params(3, c.values.length)}) returning id
     ),
     d as (
       insert into diets (checkin_id, ${DIET_COLS.join(", ")})
       select id, ${params(n, c.diet.length)} from c where $${n + c.diet.length}
     )
     select id from c`,
    [client.id, viewer.id, ...c.values, ...c.diet, c.hasDiet]
  );
  const mail = await mailEvaluation(created.rows[0].id);
  refresh();
  return mailed("Evaluación cargada.", mail);
}

/**
 * Le avisa al cliente por correo (Resend) que su evaluación ya está, con el resumen y el plan. Devuelve a quién y si
 * Resend lo aceptó, o null si no corresponde (dado de baja o sin correo): la evaluación ya quedó guardada igual, y si
 * Resend falla, el error va a los logs.
 */
async function mailEvaluation(checkinId: number): Promise<Mail | null> {
  const { rows } = await db.query(
    `select u.name, u.email, u.active, c.date, c.weight_kg, c.body_fat_pct,
            p.date as prev_date, p.weight_kg as prev_weight, p.body_fat_pct as prev_fat,
            d.id is not null as has_diet, ${DIET_COLS.map((k) => `d.${k}`).join(", ")}
     from checkins c join users u on u.id = c.client_id
     left join diets d on d.checkin_id = c.id
     left join lateral (
       select date, weight_kg, body_fat_pct from checkins p
       where p.client_id = c.client_id and (p.date, p.id) < (c.date, c.id) order by p.date desc, p.id desc limit 1
     ) p on true
     where c.id = $1`,
    [checkinId]
  );
  const r = rows[0];
  if (!r?.active || !isEmail(r.email)) return null;
  const html = renderEvaluationEmail({
    name: r.name,
    date: r.date,
    weight: r.weight_kg,
    fat: r.body_fat_pct,
    prev: r.prev_date ? { date: r.prev_date, weight: r.prev_weight, fat: r.prev_fat } : null,
    diet: r.has_diet ? (Object.fromEntries(DIET_COLS.map((k) => [k, r[k]])) as EvaluationEmail["diet"]) : null,
  });
  return { to: r.email, sent: await sendMail({ to: r.email, subject: SUBJECT, html, attachments: IMAGES }) };
}

export async function updateCheckin(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = Number(form.get("id"));
  const checkin = await managedCheckin(viewer, id);
  if (!checkin) return { error: "No podés editar esta evaluación." };
  const c = readCheckin(form);
  if ("error" in c) return c;

  // Todo en una consulta: la evaluación, y el plan se guarda, se cambia o (si quedó vacío) se borra.
  const n = 2 + c.values.length;
  await db.query(
    `with c as (update checkins set ${c.cols.map((k, i) => `${k} = $${i + 2}`).join(", ")} where id = $1 returning id),
          gone as (delete from diets where checkin_id = $1 and not $${n + c.diet.length})
     insert into diets (checkin_id, ${DIET_COLS.join(", ")})
     select id, ${params(n, c.diet.length)} from c where $${n + c.diet.length}
     ${DIET_UPSERT}`,
    [id, ...c.values, ...c.diet, c.hasDiet]
  );
  const back = `/portal/clientes/${checkin.client_id}#historico`;
  if (form.get("notify") !== "1") redirect(back);
  // El admin eligió en el popup volver a mandarle el correo (components/Form.tsx, `ask`): se manda antes de responder,
  // para que el cartel diga si salió, y al cerrarlo la página vuelve a la ficha (`next`).
  refresh();
  return mailed("Cambios guardados.", await mailEvaluation(id), back);
}

export async function deleteCheckin(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = Number(form.get("id"));
  if (!(await managedCheckin(viewer, id))) return { error: "No podés borrar este control." };
  await db.query("delete from checkins where id = $1", [id]);
  refresh();
  return null;
}

// ---------- Fotos de progreso ----------
// Las suben y las borran sólo quienes manejan al cliente (su coach o el admin); el cliente sólo las ve.

/**
 * Una foto por llamada: el navegador ya la achicó (shrinkPhoto) y así cada una entra en serverActions.bodySizeLimit
 * aunque se elijan varias juntas.
 */
export async function addProgressPhoto(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const client = await managedClient(viewer, Number(form.get("client_id")));
  if (!client) return { error: "No podés subir fotos de este cliente." };
  const takenOn = text(form, "taken_on") || todayISO();
  if (!DATE.test(takenOn) || takenOn > todayISO()) return { error: "Revisá la fecha: no puede ser futura." };
  const photo = await readPhoto(form.get("photo"));
  if ("error" in photo) return photo;

  const key = `alumnos/${client.external_id ?? (await ensureExternalId(client.id))}/progreso/${randomUUID()}.${photo.type}`;
  const error = await uploadPhoto(key, photo);
  if (error) return { error };
  await db.query("insert into progress_photos (client_id, key, taken_on, uploaded_by) values ($1, $2, $3, $4)", [
    client.id,
    key,
    takenOn,
    viewer.id,
  ]);
  refresh();
  return { ok: "Foto subida." };
}

export async function deleteProgressPhoto(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const id = Number(form.get("id"));
  const { rows } = await db.query<{ client_id: number; key: string }>("select client_id, key from progress_photos where id = $1", [id]);
  const photo = rows[0];
  if (!photo || !(await managedClient(viewer, photo.client_id))) return { error: "No podés borrar esta foto." };
  await db.query("delete from progress_photos where id = $1", [id]);
  await deleteFiles([photo.key]);
  refresh();
  return null;
}
