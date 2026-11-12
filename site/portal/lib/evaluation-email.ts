// El correo que avisa al cliente que su evaluación ya está en Mi Portal: el resumen (peso y % graso contra la anterior)
// y, si vino con uno, el plan de alimentación.
import { MEALS } from "./clients.ts";
import type { Diet } from "./data";
import { ANTON, box, buttonRow, esc, F, greeting, heading, heroRow, image, page, SITE, textRow } from "./email-layout.ts";
import { num } from "./format.ts";

export { greeting };

export type EvaluationEmail = {
  name: string;
  date: string;
  weight: number;
  fat: number;
  prev: { date: string; weight: number; fat: number } | null;
  diet: Omit<Diet, "date"> | null;
};

export const SUBJECT = "Tu evaluación ya está disponible";
export const IMAGES = [image("hero", "evaluacion-hero.jpg"), image("boton", "evaluacion-boton.png")];

const dayMonth = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "AAAA-MM-DD" → "11 de noviembre", con el año si no es el de `ref`. */
export const niceDate = (date: string, ref = date) =>
  (date.slice(0, 4) === ref.slice(0, 4) ? dayMonth : dayMonthYear).format(new Date(`${date}T00:00:00Z`));

/** "−1,4 kg desde el 3 de octubre", "Igual que el 3 de octubre" o, sin una anterior, "Tu primera evaluación". */
export function change(now: number, before: number | undefined, unit: string, since: string | undefined) {
  if (before === undefined || since === undefined) return "Tu primera evaluación";
  const d = Math.round((now - before) * 10) / 10;
  if (d === 0) return `Igual que el ${since}`;
  return `${d > 0 ? "+" : "−"}${num(Math.abs(d))} ${unit} desde el ${since}`;
}

const stat = (label: string, value: string, unit: string, diff: string) =>
  `<td width="50%" valign="top" style="padding:0 12px 0 0">${box(
    `<div style="${F};font-size:12px;line-height:18px;letter-spacing:2px;color:#8a8a8a;font-weight:700;text-transform:uppercase">${label}</div><div style="padding-top:6px;${ANTON};font-size:40px;line-height:46px;color:#ffffff">${value}<span style="font-size:20px;color:#dcdcdc"> ${unit}</span></div><div style="padding-top:4px;${F};font-size:14px;line-height:22px;color:#a3a3a3">${diff}</div>`
  )}</td>`;

/** Las comidas del plan que tienen algo, una debajo de la otra (también las usa el correo del plan solo). */
export function mealsTable(diet: Omit<Diet, "date">) {
  const meals = MEALS.filter((m) => diet[m.key])
    .map(
      (m) =>
        `<tr><td style="padding:0 0 20px"><div style="${F};font-size:16px;line-height:24px;color:#ffffff;font-weight:700">${m.label}</div><div style="padding-top:4px;${F};font-size:15px;line-height:25px;color:#a3a3a3">${esc(diet[m.key]!).replace(/\r?\n/g, "<br>")}</div></td></tr>`
    )
    .join("");
  return meals ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${meals}</table>` : "";
}

function dietRows(diet: Omit<Diet, "date">) {
  const goal = diet.goal
    ? `<div style="padding-top:8px;${F};font-size:15px;line-height:25px;color:#a3a3a3">Objetivo: <strong style="color:#e7c152">${esc(diet.goal)}</strong></div>`
    : "";
  const meals = mealsTable(diet);
  return (
    `<tr><td class="p" style="padding:56px 40px 24px">${box(`${heading("Tu plan de alimentación")}${goal}`)}</td></tr>\n` +
    (meals ? `<tr><td class="p" style="padding:0 40px 8px">${box(meals)}</td></tr>\n` : "")
  );
}

/** El HTML del correo. Lo que viene de la base (nombre, plan) va escapado. */
export function renderEvaluationEmail(e: EvaluationEmail) {
  const date = niceDate(e.date);
  const since = e.prev ? niceDate(e.prev.date, e.date) : undefined;
  const hasDiet = Boolean(e.diet && Object.values(e.diet).some(Boolean));
  const rows =
    heroRow("Zar del Fitness. Tu evaluación ya está lista.") +
    textRow(
      `${greeting(e.name)} Ya está cargada tu evaluación del ${date}. En Mi Portal vas a ver tus medidas y cómo venís evolucionando.${hasDiet ? " Abajo te dejamos tu plan de alimentación." : ""}`
    ) +
    `<tr><td class="p" style="padding:32px 40px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #2a2a2a;border-bottom:1px solid #2a2a2a"><tr><td style="padding:24px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
${stat("Peso", num(e.weight), "kg", change(e.weight, e.prev?.weight, "kg", since))}
${stat("% graso", num(e.fat), "%", change(e.fat, e.prev?.fat, "puntos", since))}
</tr></table></td></tr></table></td></tr>\n` +
    buttonRow(`${SITE}/portal/mi-progreso`, "Ver mi evaluación", 250) +
    (hasDiet ? dietRows(e.diet!) : "");
  return page({ title: SUBJECT, preheader: `Tu evaluación del ${date} ya está en Mi Portal.`, rows, help: "¿Dudas sobre tu evaluación? Escribinos por WhatsApp." });
}
