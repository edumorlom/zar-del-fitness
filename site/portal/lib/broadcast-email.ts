// El correo masivo que el admin les manda a los clientes desde Broadcast (portal/broadcast-actions.ts): el texto de la
// plantilla, con {nombre} cambiado por el nombre de cada uno, con el logo arriba y el pie de los otros correos.
import { esc, firstName, heroRow, image, page, textRow } from "./email-layout.ts";

export const BROADCAST_IMAGES = [image("hero", "logo.jpg")];
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
  const rows = heroRow("Zar del Fitness") + paragraphs.map((p, i) => textRow(esc(p).replace(/\n/g, "<br>"), i ? 16 : 32)).join("");
  return { subject: title, html: page({ title: esc(title), preheader: esc(paragraphs[0] ?? title), rows }) };
}
