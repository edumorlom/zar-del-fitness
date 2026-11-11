// Los correos de los turnos: al Zar, cuando alguien pide uno (desde el portal o por Digui), y al cliente, cuando el
// admin o su coach se lo confirma (o se lo mueve, que también lo deja confirmado).
import { ANTON, box, buttonRow, esc, F, greeting, heading, heroRow, image, page, SITE, textRow } from "./email-layout.ts";
import { dateOf, longDate, timeOf } from "./format.ts";

/** "viernes 13 de noviembre a las 10:00 h", para ir a mitad de una frase. */
const when = (d: Date) => `${longDate(dateOf(d)).toLowerCase()} a las ${timeOf(d)} h`;

/** El día y la hora, grandes, entre dos líneas. */
const whenRow = (label: string, d: Date) =>
  `<tr><td class="p" style="padding:32px 40px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #2a2a2a;border-bottom:1px solid #2a2a2a"><tr><td style="padding:24px 0">${box(
    `<div style="${F};font-size:12px;line-height:18px;letter-spacing:2px;color:#8a8a8a;font-weight:700;text-transform:uppercase">${label}</div><div style="padding-top:6px;${ANTON};font-size:34px;line-height:42px;color:#ffffff;text-transform:uppercase">${longDate(dateOf(d))}</div><div class="nc" style="${ANTON};font-size:34px;line-height:42px;color:#e7c152">${timeOf(d)} h</div>`
  )}</td></tr></table></td></tr>\n`;

/** Una línea "Dato: valor" chica, gris. */
const fact = (label: string, value: string) =>
  `<div style="${F};font-size:15px;line-height:26px;color:#a3a3a3">${label}: <span style="color:#ffffff">${value}</span></div>`;

export type RequestEmail = { name: string; email: string | null; phone: string | null; coach: string | null; start: Date };

/** Al Zar: alguien pidió un turno. Lo que viene de la base va escapado. */
export function renderRequestEmail(r: RequestEmail) {
  const phone = r.phone?.replace(/\D/g, "");
  const facts = [
    r.email && fact("Correo", `<a class="nc" href="mailto:${esc(r.email)}" style="color:#e7c152">${esc(r.email)}</a>`),
    r.phone && fact("Teléfono", phone ? `<a class="nc" href="https://wa.me/${phone}" style="color:#e7c152">${esc(r.phone)}</a>` : esc(r.phone)),
    fact("Coach", r.coach ? esc(r.coach) : "sin coach"),
  ].filter(Boolean);
  const rows =
    `<tr><td><img src="cid:logo" width="600" alt="Zar del Fitness" style="display:block;border:0;width:100%;height:auto;font-family:Arial,sans-serif;font-size:22px;line-height:30px;color:#e7c152"></td></tr>\n` +
    `<tr><td class="p" style="padding:16px 40px 0">${box(heading("Nuevo pedido de turno"))}</td></tr>\n` +
    textRow(`<strong style="color:#ffffff">${esc(r.name)}</strong> pidió un turno de control.`, 16) +
    whenRow("Para el", r.start) +
    `<tr><td class="p" style="padding:24px 40px 0">${box(facts.join(""))}</td></tr>\n` +
    textRow("Confirmalo, movelo o rechazalo desde la agenda. Cuando lo confirmes, al cliente le llega un correo.") +
    buttonRow(`${SITE}/portal/agenda`, "Ver en la agenda", 238);
  return {
    subject: `Pedido de turno: ${r.name}, ${when(r.start)}`,
    html: page({ title: "Nuevo pedido de turno", preheader: `${esc(r.name)} pidió un turno para el ${when(r.start)}.`, rows }),
    attachments: [image("logo", "logo.jpg"), image("boton", "agenda-boton.png")],
  };
}

export type ConfirmedEmail = { name: string; start: Date; requested: Date | null };

/** Al cliente: su turno está confirmado. `requested` es lo que había pedido, si se lo movieron. */
export function renderConfirmedEmail(c: ConfirmedEmail) {
  const moved = c.requested && c.requested.getTime() !== c.start.getTime();
  const rows =
    heroRow("Zar del Fitness. Tu turno está confirmado.") +
    textRow(`${greeting(c.name)} Tu turno de control está confirmado. Te esperamos.`) +
    whenRow("Tu turno", c.start) +
    (moved ? textRow(`Lo habías pedido para el ${when(c.requested!)}: te lo pasamos a este horario.`, 20) : "") +
    textRow(
      `<strong style="color:#ffffff">Dónde:</strong> The VIP by Zar del Fitness, Av. Álvarez Thomas 847, Colegiales.<br>Si no podés venir, cancelalo desde Mi Portal así liberás el horario.`
    ) +
    buttonRow(`${SITE}/portal/turno`, "Ver mi turno", 198);
  return {
    subject: "Tu turno está confirmado",
    html: page({
      title: "Tu turno está confirmado",
      preheader: `Te esperamos el ${when(c.start)}.`,
      rows,
      help: "¿Necesitás cambiarlo? Escribinos por WhatsApp.",
    }),
    attachments: [image("hero", "turno-hero.jpg"), image("boton", "turno-boton.png")],
  };
}
