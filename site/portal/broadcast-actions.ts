"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { requireViewer } from "~/lib/auth";
import { BROADCAST_IMAGES, renderBroadcastEmail } from "~/lib/broadcast-email";
import { NO_MARKETING_SQL, unsubscribeUrl } from "~/lib/consent";
import { db } from "~/lib/db";
import { RESEND_GAP_MS, sendMail, sleep } from "~/lib/email-layout";
import { type FormState, isEmail, text } from "~/lib/form";

/**
 * Broadcast (sólo el admin): guarda la plantilla y les manda el correo a los clientes elegidos, por grupo (todos, un
 * plan, sin plan, los de un coach) o uno por uno. Sólo a los activos con correo, una vez por dirección. Se manda
 * después de responder, de a uno: con cientos de clientes tarda unos minutos.
 * Dos tipos (kind): "promo" (novedades y promociones, lo común) no les llega a quienes se dieron de baja y trae el link
 * para darse de baja (art. 27 de la Ley 25.326); "aviso" (un cierre, un cambio de horario: algo del servicio) les llega a
 * todos, sin ese link. Un aviso no puede ser publicidad.
 */
export async function sendBroadcast(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("admin")) return { error: "Sólo el admin manda correos masivos." };
  const subject = text(form, "subject");
  const body = text(form, "body");
  if (!subject || !body) return { error: "Completá el asunto y el mensaje." };
  if (subject.length > 200 || body.length > 10_000) return { error: "El asunto o el mensaje son demasiado largos." };

  const promo = form.get("kind") !== "aviso";
  const groups = form.getAll("group").map(String);
  const plans = groups.filter((g) => g.startsWith("plan:") && g !== "plan:-").map((g) => g.slice(5));
  const coaches = groups.filter((g) => g.startsWith("coach:")).map((g) => Number(g.slice(6)));
  const ids = form.getAll("client").map(Number);
  const { rows } = await db.query<{ id: number; name: string; email: string }>(
    `select id, name, email from users
     where 'user' = any(scopes) and active and email is not null
       and ($1 or plan = any($2::text[]) or ($3 and plan is null) or coach_id = any($4::int[]) or id = any($5::int[]))
       and not ($6 and ${NO_MARKETING_SQL})
     order by id`,
    [groups.includes("all"), plans, groups.includes("plan:-"), coaches.filter(Number.isInteger), ids.filter(Number.isInteger), promo]
  );
  const seen = new Set<string>();
  const to = rows.filter((r) => isEmail(r.email) && !seen.has(r.email.toLowerCase()) && seen.add(r.email.toLowerCase()));
  if (!to.length)
    return { error: `Elegí a quién mandarlo: ningún cliente activo con correo${promo ? " (que no se haya dado de baja de las promociones)" : ""} coincide.` };

  await db.query(
    `insert into broadcast_template (id, subject, body) values (1, $1, $2)
     on conflict (id) do update set subject = excluded.subject, body = excluded.body, updated_at = now()`,
    [subject, body]
  );
  refresh();
  after(async () => {
    let failed = 0;
    for (const [i, r] of to.entries()) {
      if (i) await sleep(RESEND_GAP_MS);
      const mail = renderBroadcastEmail({ name: r.name, subject, body, unsubscribe: promo ? unsubscribeUrl(r.id) : undefined });
      if (!(await sendMail({ to: r.email, ...mail, attachments: BROADCAST_IMAGES }))) failed++;
    }
    console.log(`Broadcast "${subject}": ${to.length - failed} de ${to.length} enviados.`);
  });
  const n = to.length;
  return { ok: `Enviando a ${n} ${n === 1 ? "cliente" : "clientes"}. Tarda unos ${Math.ceil((n * RESEND_GAP_MS) / 60_000)} min; la plantilla quedó guardada.` };
}
