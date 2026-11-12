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
  assert.equal(html.match(/class="p" style="padding:\d+px 40px 0;/g)?.length, 3);
  assert.match(html, /src="cid:hero"/);
  assert.doesNotMatch(html, /\{nombre\}/i);
});
