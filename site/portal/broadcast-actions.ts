"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { requireViewer } from "~/lib/auth";
import { BROADCAST_IMAGES, renderBroadcastEmail } from "~/lib/broadcast-email";
import { db } from "~/lib/db";
import { sendMail } from "~/lib/email-layout";
import type { FormState } from "./actions";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Resend acepta 2 correos por segundo en el plan común: uno cada 600 ms para no pasarse.
const GAP_MS = 600;

/**
 * Broadcast (sólo el admin): guarda la plantilla y les manda el correo a los clientes elegidos, por grupo (todos, un
 * plan, sin plan, los de un coach) o uno por uno. Sólo a los activos con correo, una vez por dirección. Se manda
 * después de responder, de a uno: con cientos de clientes tarda unos minutos.
 */
export async function sendBroadcast(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("admin")) return { error: "Sólo el admin manda correos masivos." };
  const subject = String(form.get("subject") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  if (!subject || !body) return { error: "Completá el asunto y el mensaje." };
  if (subject.length > 200 || body.length > 10_000) return { error: "El asunto o el mensaje son demasiado largos." };

  const groups = form.getAll("group").map(String);
  const plans = groups.filter((g) => g.startsWith("plan:") && g !== "plan:-").map((g) => g.slice(5));
  const coaches = groups.filter((g) => g.startsWith("coach:")).map((g) => Number(g.slice(6)));
  const ids = form.getAll("client").map(Number);
  const { rows } = await db.query<{ name: string; email: string }>(
    `select name, email from users
     where 'user' = any(scopes) and active and email is not null
       and ($1 or plan = any($2::text[]) or ($3 and plan is null) or coach_id = any($4::int[]) or id = any($5::int[]))
     order by id`,
    [groups.includes("all"), plans, groups.includes("plan:-"), coaches.filter(Number.isInteger), ids.filter(Number.isInteger)]
  );
  const seen = new Set<string>();
  const to = rows.filter((r) => EMAIL.test(r.email) && !seen.has(r.email.toLowerCase()) && seen.add(r.email.toLowerCase()));
  if (!to.length) return { error: "Elegí a quién mandarlo: ningún cliente activo con correo coincide." };

  await db.query(
    `insert into broadcast_template (id, subject, body) values (1, $1, $2)
     on conflict (id) do update set subject = excluded.subject, body = excluded.body, updated_at = now()`,
    [subject, body]
  );
  refresh();
  after(async () => {
    let failed = 0;
    for (const [i, r] of to.entries()) {
      if (i) await new Promise((ok) => setTimeout(ok, GAP_MS));
      if (!(await sendMail({ to: r.email, ...renderBroadcastEmail({ name: r.name, subject, body }), attachments: BROADCAST_IMAGES }))) failed++;
    }
    console.log(`Broadcast "${subject}": ${to.length - failed} de ${to.length} enviados.`);
  });
  const n = to.length;
  return { ok: `Enviando a ${n} ${n === 1 ? "cliente" : "clientes"}. Tarda unos ${Math.ceil((n * GAP_MS) / 60_000)} min; la plantilla quedó guardada.` };
}
