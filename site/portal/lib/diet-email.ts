// El correo que le llega al cliente cuando el admin o su coach le cambian el plan de alimentación sin cargar una
// evaluación (saveDiet en portal/actions.ts): el plan completo, con el diseño del de la evaluación. La cabecera y el
// botón (public/correo/dieta-*) son la foto y las tipografías de los otros correos.
import type { Diet } from "./data";
import { ANTON, box, buttonRow, esc, F, greeting, heroRow, image, page, SITE, textRow } from "./email-layout.ts";
import { mealsTable } from "./evaluation-email.ts";

export const DIET_SUBJECT = "Tu nuevo plan de alimentación";
export const DIET_IMAGES = [image("hero", "dieta-hero.jpg"), image("boton", "dieta-boton.png")];

export type DietEmail = { name: string; diet: Omit<Diet, "date"> };

/** El objetivo, grande y dorado, entre dos líneas: donde el de la evaluación tiene el peso y el % graso. */
const goalRow = (goal: string) =>
  `<tr><td class="p" style="padding:32px 40px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #2a2a2a;border-bottom:1px solid #2a2a2a"><tr><td style="padding:24px 0">${box(
    `<div style="${F};font-size:12px;line-height:18px;letter-spacing:2px;color:#8a8a8a;font-weight:700;text-transform:uppercase">Tu objetivo</div><div class="nc" style="padding-top:6px;${ANTON};font-size:30px;line-height:38px;color:#e7c152;text-transform:uppercase">${esc(goal)}</div>`
  )}</td></tr></table></td></tr>\n`;

/** El HTML del correo. Lo que viene de la base (nombre, plan) va escapado. */
export function renderDietEmail(e: DietEmail) {
  const meals = mealsTable(e.diet);
  const rows =
    heroRow("Zar del Fitness. Tu nuevo plan de alimentación.") +
    textRow(`${greeting(e.name)} Te armamos un nuevo plan de alimentación. Acá lo tenés completo, y siempre a mano en Mi Portal.`) +
    (e.diet.goal ? goalRow(e.diet.goal) : "") +
    (meals ? `<tr><td class="p" style="padding:32px 40px 0">${box(meals)}</td></tr>\n` : "") +
    buttonRow(`${SITE}/portal/mi-progreso#alimentacion`, "Ver mi plan", 185);
  return page({
    title: DIET_SUBJECT,
    preheader: "Tu plan de alimentación cambió: acá lo tenés completo.",
    rows,
    help: "¿Dudas sobre tu plan? Escribinos por WhatsApp.",
  });
}
