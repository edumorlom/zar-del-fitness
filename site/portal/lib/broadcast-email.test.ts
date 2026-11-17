import assert from "node:assert/strict";
import { test } from "node:test";
import { renderBroadcastEmail } from "./broadcast-email.ts";

test("el correo masivo: {nombre} en asunto y texto, párrafos, saltos de línea y todo escapado", () => {
  const { subject, html } = renderBroadcastEmail({
    name: "JUAN PÉREZ",
    subject: "{nombre}, novedades",
    body: "Hola, {Nombre}.\r\n\r\nPrimera línea\nsegunda <b>línea</b>\n\n\n\nChau",
  });
  assert.equal(subject, "Juan, novedades");
  assert.match(html, /Hola, Juan\./);
  assert.match(html, /Primera línea<br>segunda &#60;b&#62;línea&#60;\/b&#62;/);
  assert.match(html, />Chau</);
  assert.equal(html.match(/class="p" style="padding:\d+px 40px 0;/g)?.length, 4); // el título y los 3 párrafos
  assert.match(html, /text-transform:uppercase;">Juan, novedades<\/h2>/);
  assert.match(html, /src="cid:hero"/);
  assert.match(html, /src="cid:boton"/);
  assert.match(html, /href="https:\/\/zardelfitness\.com\.ar\/portal\/ingresar"/);
  assert.match(html, /Escribinos por WhatsApp/);
  assert.doesNotMatch(html, /\{nombre\}/i);
});

test("el correo de promociones trae el link de baja; el aviso, no", () => {
  const url = "https://zardelfitness.com.ar/portal/correos?c=7&t=abc";
  const promo = renderBroadcastEmail({ name: "Ana", subject: "Promo", body: "Hola", unsubscribe: url });
  assert.match(promo.html, /href="https:\/\/zardelfitness\.com\.ar\/portal\/correos\?c=7&#38;t=abc"/);
  assert.match(promo.html, /date de baja acá/);
  const notice = renderBroadcastEmail({ name: "Ana", subject: "Cerramos el lunes", body: "Hola" });
  assert.doesNotMatch(notice.html, /date de baja/);
});
