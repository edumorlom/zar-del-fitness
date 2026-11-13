// El recordatorio de la evaluación: al cliente Premium al que se le cumple un mes de su última evaluación le llega un
// correo para que pida el turno de la próxima, con los números de la última (peso y % graso contra la anterior), con el
// diseño del de la evaluación. Lo manda solo el servidor, una vez por hora (reminders.ts). La cabecera y el botón
// (public/correo/recordatorio-*) son la foto y las tipografías de los otros correos.
import { addMonths } from "./payments.ts";
import { buttonRow, greeting, heroRow, image, page, SITE, textRow } from "./email-layout.ts";
import { niceDate, statsRow } from "./evaluation-email.ts";

/** A quiénes les llega: por ahora, sólo a los Premium (users.plan). */
export const REMINDER_PLAN = "Premium";
/** Cuántos meses después de la última evaluación. */
export const REMINDER_MONTHS = 1;
/** Entre qué horas de Buenos Aires se mandan (de 9 a 20:59), para que no le lleguen de madrugada. */
export const REMINDER_HOURS = { from: 9, to: 21 };

export const REMINDER_SUBJECT = "Es hora de tu nueva evaluación";
export const REMINDER_IMAGES = [image("hero", "recordatorio-hero.jpg"), image("boton", "recordatorio-boton.png")];

export type ReminderEmail = {
  name: string;
  /** Hoy, "AAAA-MM-DD". */
  today: string;
  /** La última evaluación. Las del portal anterior traen sólo el peso (o nada), sin % graso ni la anterior. */
  last: { date: string; weight: number | null; fat: number | null };
  prev: { date: string; weight: number; fat: number } | null;
  /** Si la última es del portal anterior: sin la anterior, no dice "Tu primera evaluación". */
  legacy: boolean;
};

const hourIn = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" });

/** ¿Es hora de mandarlos? Sólo de día en Buenos Aires. */
export function inSendingHours(now: Date) {
  const h = Number(hourIn.format(now));
  return h >= REMINDER_HOURS.from && h < REMINDER_HOURS.to;
}

export type ReminderCandidate = {
  /** La fecha de la última evaluación (la del portal o, si no hay, la del portal anterior). */
  last: string | null;
  /** El día que se le mandó el último recordatorio (users.evaluation_reminder_on). */
  reminded: string | null;
  /** El próximo control que le puso su coach (users.next_control_at). */
  nextControl: Date | null;
  /** Si ya tiene un turno pedido o confirmado por delante. */
  booked: boolean;
};

/**
 * ¿Le toca el recordatorio? Devuelve el día en que se le cumplió el mes ("AAAA-MM-DD"), o null. Le toca desde ese día
 * si no se le mandó uno desde entonces (uno por evaluación: con una nueva, otro al mes de esa) y si todavía no tiene el
 * próximo control pedido o puesto. Si después lo cancela, le llega.
 */
export function reminderDue(c: ReminderCandidate, today: string, now: Date) {
  if (!c.last || c.booked || (c.nextControl && c.nextControl > now)) return null;
  const due = addMonths(c.last, REMINDER_MONTHS);
  if (due > today || (c.reminded && c.reminded >= due)) return null;
  return due;
}

/** "Ya pasó un mes", "Ya pasó más de un mes", "Ya pasaron 3 meses", "Ya pasó más de un año"… desde `date` hasta `today`. */
export function elapsed(date: string, today: string) {
  let months = 0;
  while (addMonths(date, months + 1) <= today) months++;
  if (months >= 12) {
    const years = Math.floor(months / 12);
    return years === 1 ? "Ya pasó más de un año" : `Ya pasaron más de ${years} años`;
  }
  const more = addMonths(date, months) === today ? "" : "más de ";
  return months <= 1 ? `Ya pasó ${more}un mes` : `Ya pasaron ${more}${months} meses`;
}

/** El asunto, el HTML y las imágenes del correo. Lo que viene de la base (el nombre) va escapado. */
export function renderReminderEmail(e: ReminderEmail) {
  const date = niceDate(e.last.date, e.today);
  const since = e.prev ? niceDate(e.prev.date, e.last.date) : undefined;
  const stats = statsRow(e.last, e.prev, since, e.legacy ? "" : "Tu primera evaluación");
  const rows =
    heroRow("Zar del Fitness. Es hora de tu nueva evaluación.") +
    textRow(
      `${greeting(e.name)} ${elapsed(e.last.date, e.today)} desde tu última evaluación, el ${date}. Es momento de hacer la próxima: así vemos cómo venís y ajustamos tu entrenamiento y tu alimentación.${stats ? " Estos fueron tus números:" : ""}`
    ) +
    stats +
    textRow("Pedí tu turno de control desde Mi Portal y elegí el horario que te quede mejor.", stats ? 32 : 24) +
    buttonRow(`${SITE}/portal/turno`, "Pedir mi turno", 216);
  return {
    subject: REMINDER_SUBJECT,
    html: page({
      title: REMINDER_SUBJECT,
      preheader: `${elapsed(e.last.date, e.today)} desde tu última evaluación. Pedí tu turno desde Mi Portal.`,
      rows,
      help: "¿Preferís coordinarlo por WhatsApp? Escribinos.",
    }),
    attachments: REMINDER_IMAGES,
  };
}
