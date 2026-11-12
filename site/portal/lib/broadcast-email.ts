// El correo masivo que el admin les manda a los clientes desde Broadcast (portal/broadcast-actions.ts), con el diseño de
// los otros correos de Resend: la foto del Zar arriba (public/correo/broadcast-hero.jpg, la de la dieta sin el título),
// el asunto como título, el texto de la plantilla con {nombre} cambiado por el nombre de cada uno, el botón de Mi Portal
// (el del correo de cuenta lista) y el pie con WhatsApp.
import { buttonRow, esc, firstName, heading, heroRow, image, page, SITE, textRow } from "./email-layout.ts";

export const BROADCAST_IMAGES = [image("hero", "broadcast-hero.jpg"), image("boton", "broadcast-boton.png")];
export const DEFAULT_TEMPLATE = {
  subject: "Novedades de Zar del Fitness",
  body: "Hola, {nombre}.\n\nTe escribimos para contarte...\n\nUn abrazo,\nEl equipo de Zar del Fitness",
};

/** Cambia {nombre} por el nombre del cliente (sin escapar: el que escapa es quien lo pone en HTML). */
export const fill = (text: string, name: string) => text.replace(/\{nombre\}/gi, firstName(name));

/** El asunto y el HTML para un cliente. Cada párrafo (separado por una línea en blanco) va en su fila; todo escapado. */
export function renderBroadcastEmail({ name, subject, body }: { name: string; subject: string; body: string }) {
  const title = fill(subject, name);
  const paragraphs = fill(body, name)
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const rows =
    heroRow(`Zar del Fitness. ${esc(title)}`) +
    textRow(heading(esc(title)), 32) +
    paragraphs.map((p, i) => textRow(esc(p).replace(/\n/g, "<br>"), i ? 16 : 24)).join("") +
    buttonRow(`${SITE}/portal/ingresar`, "Ingresar a Mi Portal", 271);
  return {
    subject: title,
    html: page({ title: esc(title), preheader: esc(paragraphs[0] ?? title), rows, help: "¿Dudas? Escribinos por WhatsApp." }),
  };
}
