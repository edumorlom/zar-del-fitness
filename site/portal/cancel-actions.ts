"use server";

import gimnasio from "@db/gimnasio.json";
import { db } from "~/lib/db";
import { CANCEL_IMAGES, cancelCode, renderCancelNotice, renderCancelReceipt, type CancelKind, type CancelRequest } from "~/lib/cancel-email";
import { sendMail } from "~/lib/email-layout";
import { todayISO } from "~/lib/format";

/** Lo que vuelve al formulario del botón (components/CancelForm.tsx): el código, si se mandó el correo, o qué faltó. */
export type CancelState = { code: string; emailed: boolean; email: string } | { error: "faltan" | "error" } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const cut = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

const argentinaNow = () =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

/**
 * El botón de arrepentimiento y el botón de baja del sitio (Disp. 954/2025): sin registrarse ni iniciar sesión. Guarda el
 * pedido (cancel_requests) y le manda en el momento el código a quien lo pidió (la constancia), y los datos al
 * gimnasio (ADMIN_EMAIL y el correo de db/gimnasio.json, legal.correo) para que responda dentro de las 24 horas. Si la
 * base no responde, igual manda los correos: el código sirve como constancia aunque no haya quedado guardado.
 */
export async function requestCancel(kind: CancelKind, lang: "es" | "en", _: CancelState, form: FormData): Promise<CancelState> {
  // El campo trampa: invisible para las personas, los robots lo completan.
  if (cut(form, "website", 200)) return { error: "error" };
  const name = cut(form, "name", 120);
  const email = cut(form, "email", 200).toLowerCase();
  if (!name || !EMAIL.test(email)) return { error: "faltan" };
  const purchasedOn = cut(form, "purchased_on", 10);

  const r: CancelRequest = {
    kind,
    code: cancelCode(kind, todayISO()),
    name,
    email,
    phone: cut(form, "phone", 40),
    dni: cut(form, "dni", 20).replace(/\D/g, ""),
    plan: cut(form, "plan", 80),
    purchasedOn: DATE.test(purchasedOn) ? purchasedOn : "",
    message: cut(form, "message", 2000),
    deleteData: kind === "baja" && form.get("delete_data") === "on",
    lang,
    at: argentinaNow(),
  };

  let saved = false;
  try {
    await db.query(
      `insert into cancel_requests (code, kind, name, email, phone, dni, plan, purchased_on, message, lang, user_id)
       values ($1, $2, $3, $4, nullif($5, ''), nullif($6, ''), nullif($7, ''), nullif($8, '')::date, nullif($9, ''), $10,
               (select id from users where lower(email) = $4 order by id limit 1))`,
      [r.code, kind, name, email, r.phone, r.dni, r.plan, r.purchasedOn, [r.message, r.deleteData ? "Pide borrar sus datos." : ""].filter(Boolean).join(" "), lang]
    );
    saved = true;
  } catch (err) {
    console.error(`No se pudo guardar el pedido ${r.code}:`, err);
  }

  const receipt = renderCancelReceipt(r);
  const emailed = await sendMail({ to: email, ...receipt, attachments: CANCEL_IMAGES });
  const notice = renderCancelNotice(r);
  const team = [...new Set([process.env.ADMIN_EMAIL, gimnasio.legal.correo].map((e) => e?.trim().toLowerCase()).filter((e): e is string => !!e && EMAIL.test(e)))];
  const told = (await Promise.all(team.map((to) => sendMail({ to, ...notice, attachments: [] })))).some(Boolean);

  if (!saved && !emailed && !told) return { error: "error" };
  return { code: r.code, emailed, email };
}
