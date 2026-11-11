// El correo que avisa al cliente que su evaluación ya está en Mi Portal: el resumen (peso y % graso contra la anterior)
// y, si vino con uno, el plan de alimentación. Mismo diseño que portal/scripts/email-cuenta-lista/correo.html: el
// encabezado y el botón son imágenes (public/correo/) porque Gmail y Outlook recolorean el HTML en modo oscuro; las
// clases gl/gs/gd/nc mantienen el negro en Gmail para iPhone.
import { MEALS } from "./clients.ts";
import type { Diet } from "./data";
import { num } from "./format.ts";

export type EvaluationEmail = {
  name: string;
  date: string;
  weight: number;
  fat: number;
  prev: { date: string; weight: number; fat: number } | null;
  diet: Omit<Diet, "date"> | null;
};

export const SUBJECT = "Tu evaluación ya está disponible";
const SITE = "https://zardelfitness.com.ar";
// Resend las baja de acá y las adjunta: el correo las muestra como cid:hero y cid:boton.
export const IMAGES = [
  { filename: "hero.jpg", path: `${SITE}/correo/evaluacion-hero.jpg`, content_id: "hero" },
  { filename: "boton.png", path: `${SITE}/correo/evaluacion-boton.png`, content_id: "boton" },
];

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const dayMonth = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "AAAA-MM-DD" → "11 de noviembre", con el año si no es el de `ref`. */
export const niceDate = (date: string, ref = date) =>
  (date.slice(0, 4) === ref.slice(0, 4) ? dayMonth : dayMonthYear).format(new Date(`${date}T00:00:00Z`));

/** "Hola, Melanie." aunque en la base esté "MELANIE WOLMAN". */
export function greeting(name: string) {
  const first = name.trim().split(/\s+/)[0];
  const nice = first === first.toUpperCase() ? first.slice(0, 1) + first.slice(1).toLowerCase() : first;
  return nice ? `Hola, ${esc(nice)}.` : "Hola.";
}

/** "−1,4 kg desde el 3 de octubre", "Igual que el 3 de octubre" o, sin una anterior, "Tu primera evaluación". */
export function change(now: number, before: number | undefined, unit: string, since: string | undefined) {
  if (before === undefined || since === undefined) return "Tu primera evaluación";
  const d = Math.round((now - before) * 10) / 10;
  if (d === 0) return `Igual que el ${since}`;
  return `${d > 0 ? "+" : "−"}${num(Math.abs(d))} ${unit} desde el ${since}`;
}

const F = "font-family:Manrope,'Helvetica Neue',Helvetica,Arial,sans-serif";
const ANTON = "font-family:Anton,Impact,'Arial Narrow',Arial,sans-serif";
const box = (inner: string) => `<div class="gs"><div class="gd">${inner}</div></div>`;

const stat = (label: string, value: string, unit: string, diff: string) =>
  `<td width="50%" valign="top" style="padding:0 12px 0 0">${box(
    `<div style="${F};font-size:12px;line-height:18px;letter-spacing:2px;color:#8a8a8a;font-weight:700;text-transform:uppercase">${label}</div><div style="padding-top:6px;${ANTON};font-size:40px;line-height:46px;color:#ffffff">${value}<span style="font-size:20px;color:#dcdcdc"> ${unit}</span></div><div style="padding-top:4px;${F};font-size:14px;line-height:22px;color:#a3a3a3">${diff}</div>`
  )}</td>`;

function dietRows(diet: Omit<Diet, "date">) {
  const goal = diet.goal
    ? `<div style="padding-top:8px;${F};font-size:15px;line-height:25px;color:#a3a3a3">Objetivo: <strong style="color:#e7c152">${esc(diet.goal)}</strong></div>`
    : "";
  const meals = MEALS.filter((m) => diet[m.key])
    .map(
      (m) =>
        `<tr><td style="padding:0 0 20px"><div style="${F};font-size:16px;line-height:24px;color:#ffffff;font-weight:700">${m.label}</div><div style="padding-top:4px;${F};font-size:15px;line-height:25px;color:#a3a3a3">${esc(diet[m.key]!).replace(/\r?\n/g, "<br>")}</div></td></tr>`
    )
    .join("");
  return (
    `<tr><td class="p" style="padding:56px 40px 24px">${box(`<h2 style="margin:0;font-weight:400;${ANTON};font-size:30px;line-height:38px;color:#ffffff;text-transform:uppercase;">Tu plan de alimentación</h2>${goal}`)}</td></tr>\n` +
    (meals ? `<tr><td class="p" style="padding:0 40px 8px">${box(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${meals}</table>`)}</td></tr>\n` : "")
  );
}

/** El HTML del correo. Lo que viene de la base (nombre, plan) va escapado. */
export function renderEvaluationEmail(e: EvaluationEmail) {
  const date = niceDate(e.date);
  const since = e.prev ? niceDate(e.prev.date, e.date) : undefined;
  const hasDiet = Boolean(e.diet && Object.values(e.diet).some(Boolean));
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${SUBJECT}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;600;700;800&display=swap');</style>
<style>body{margin:0;padding:0;background:#000000}
u + .body .gl{background-image:linear-gradient(#000,#000)!important}
u + .body .gs{background:#000000;mix-blend-mode:screen}
u + .body .gd{background:#000000;mix-blend-mode:difference}
u + .body .nc{color:#ffffff!important;border-color:#ffffff!important}
@media (max-width:480px){.p{padding-left:24px!important;padding-right:24px!important}}
</style></head>
<body class="body" style="margin:0;padding:0;background-color:#000000">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Tu evaluación del ${date} ya está en Mi Portal.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#000000" class="gl" style="background-color:#000000"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px">
<tr><td><img src="cid:hero" width="600" alt="Zar del Fitness. Tu evaluación ya está lista." style="display:block;border:0;width:100%;height:auto;font-family:Arial,sans-serif;font-size:26px;line-height:34px;color:#ffffff"></td></tr>
<tr><td class="p" style="padding:24px 40px 0;${F};font-size:17px;line-height:28px;color:#dcdcdc;">${box(`${greeting(e.name)} Ya está cargada tu evaluación del ${date}. En Mi Portal vas a ver tus medidas y cómo venís evolucionando.${hasDiet ? " Abajo te dejamos tu plan de alimentación." : ""}`)}</td></tr>
<tr><td class="p" style="padding:32px 40px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #2a2a2a;border-bottom:1px solid #2a2a2a"><tr><td style="padding:24px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
${stat("Peso", num(e.weight), "kg", change(e.weight, e.prev?.weight, "kg", since))}
${stat("% graso", num(e.fat), "%", change(e.fat, e.prev?.fat, "puntos", since))}
</tr></table></td></tr></table></td></tr>
<tr><td class="p" style="padding:30px 40px 0"><a href="${SITE}/portal/mi-progreso" style="display:inline-block;text-decoration:none"><img src="cid:boton" width="250" height="56" alt="Ver mi evaluación" style="display:block;border:0;width:250px;height:56px;font-family:Arial,sans-serif;font-size:17px;font-weight:700;line-height:24px;color:#e7c152"></a></td></tr>
${hasDiet ? dietRows(e.diet!) : ""}<tr><td class="p" align="left" style="padding:56px 40px 40px;${F};font-size:13px;line-height:21px;color:#8a8a8a;">${box(`<div style="border-top:1px solid #2a2a2a;padding-top:28px">
<a class="nc" href="https://wa.me/5491127336258" style="color:#e7c152;font-weight:700;text-decoration:underline">¿Dudas sobre tu evaluación? Escribinos por WhatsApp.</a><br>
The VIP by Zar del Fitness, Av. Álvarez Thomas 847, Colegiales, CABA.<br>Este correo es automático y no recibe respuestas.</div>`)}</td></tr></table>
</td></tr></table></body></html>`;
}
