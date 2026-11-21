import "server-only";
import { LAST_CHECKINS_JOIN } from "./data";
import { db } from "./db";
import { RESEND_GAP_MS, sendMail, sleep } from "./email-layout";
import { isEmail } from "./form";
import { todayISO } from "./format";
import { inSendingHours, REMINDER_PLAN, reminderDue, renderReminderEmail } from "./reminder-email";

// El recordatorio de la evaluación (reminder-email.ts), automático: el servidor se fija una vez por hora (y al arrancar)
// a qué cliente Premium se le cumplió el mes de su última evaluación y le manda el correo, de 9 a 21 h. Cada envío se
// anota en users.evaluation_reminder_on antes de mandarlo, en la misma consulta que se fija que no se haya mandado: si
// durante un despliegue corren dos servidores, le llega uno solo. Si Resend no lo acepta, se borra la marca y se vuelve a
// intentar a la hora siguiente.

const EVERY_MS = 60 * 60 * 1000;

type Row = {
  id: number;
  name: string;
  email: string | null;
  reminded: string | null;
  next_control_at: Date | null;
  booked: boolean;
  legacy: boolean;
  last_date: string | null;
  last_weight: number | null;
  last_fat: number | null;
  prev_date: string | null;
  prev_weight: number | null;
  prev_fat: number | null;
};

/** Manda los recordatorios que correspondan hoy. Devuelve cuántos salieron. */
export async function sendEvaluationReminders() {
  const now = new Date();
  const today = todayISO();
  const { rows } = await db.query<Row>(
    `select u.id, u.name, u.email, u.evaluation_reminder_on as reminded, u.next_control_at,
            exists (select 1 from appointments a where a.client_id = u.id and a.status in ('requested', 'confirmed')
                    and a.ends_at > now()) as booked,
            l.date is null as legacy,
            coalesce(l.date, u.legacy_last_checkin) as last_date,
            coalesce(l.weight_kg, u.legacy_last_weight) as last_weight,
            l.body_fat_pct as last_fat,
            p.date as prev_date, p.weight_kg as prev_weight, p.body_fat_pct as prev_fat
     from users u
     ${LAST_CHECKINS_JOIN}
     where 'user' = any(u.scopes) and u.active and u.plan = $1`,
    [REMINDER_PLAN]
  );

  let sent = 0;
  for (const r of rows) {
    const due = reminderDue({ last: r.last_date, reminded: r.reminded, nextControl: r.next_control_at, booked: r.booked }, today, now);
    if (!due || !isEmail(r.email)) continue;
    // La marca, sólo si nadie la puso desde que se cumplió el mes: si otro servidor ya lo está mandando, no sale de nuevo.
    const claimed = await db.query(
      "update users set evaluation_reminder_on = $2 where id = $1 and (evaluation_reminder_on is null or evaluation_reminder_on < $3)",
      [r.id, today, due]
    );
    if (!claimed.rowCount) continue;
    if (sent) await sleep(RESEND_GAP_MS);
    const mail = renderReminderEmail({
      name: r.name,
      today,
      last: { date: r.last_date!, weight: r.last_weight, fat: r.last_fat },
      prev: r.prev_date ? { date: r.prev_date, weight: r.prev_weight!, fat: r.prev_fat! } : null,
      legacy: r.legacy,
    });
    if (await sendMail({ to: r.email!, ...mail })) {
      sent++;
    } else {
      await db.query("update users set evaluation_reminder_on = $3 where id = $1 and evaluation_reminder_on = $2", [r.id, today, r.reminded]);
    }
  }
  if (sent) console.log(`Recordatorios de evaluación: ${sent} enviado${sent === 1 ? "" : "s"}.`);
  return sent;
}

/** Arranca el recordatorio automático (instrumentation.ts): ahora y una vez por hora, sólo de día. Una sola vez. */
export function startEvaluationReminders() {
  const g = globalThis as unknown as { evaluationReminders?: NodeJS.Timeout };
  if (g.evaluationReminders) return;
  let running = false;
  const tick = async () => {
    if (running || !inSendingHours(new Date())) return;
    running = true;
    try {
      await sendEvaluationReminders();
    } catch (err) {
      console.error("No se pudieron mandar los recordatorios de evaluación:", err);
    } finally {
      running = false;
    }
  };
  g.evaluationReminders = setInterval(tick, EVERY_MS);
  g.evaluationReminders.unref();
  void tick();
}
