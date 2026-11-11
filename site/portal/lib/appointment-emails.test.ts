import assert from "node:assert/strict";
import { test } from "node:test";
import { renderConfirmedEmail, renderRequestEmail } from "./appointment-emails.ts";

const start = new Date("2026-11-13T13:00:00Z"); // viernes 13, 10:00 en Buenos Aires

test("el aviso al Zar: quién, cuándo (en hora de Buenos Aires) y cómo contactarlo, escapado", () => {
  const m = renderRequestEmail({ name: "Ana <b>", email: "ana@x.com", phone: "+54 9 11 5555-1234", coach: null, start });
  assert.equal(m.subject, "Pedido de turno: Ana <b>, viernes 13 de noviembre a las 10:00 h");
  assert.match(m.html, /Ana &#60;b&#62;<\/strong> pidió un turno/);
  assert.match(m.html, /Viernes 13 de noviembre/);
  assert.match(m.html, /10:00 h/);
  assert.match(m.html, /href="https:\/\/wa\.me\/5491155551234"/);
  assert.match(m.html, /sin coach/);
  assert.doesNotMatch(renderRequestEmail({ name: "Ana", email: null, phone: null, coach: "Ronald", start }).html, /Correo:|Teléfono:/);
});

test("la confirmación dice lo que había pedido sólo si se lo movieron", () => {
  const moved = renderConfirmedEmail({ name: "ANA PÉREZ", start, requested: new Date("2026-11-13T14:00:00Z") });
  assert.match(moved.html, /Hola, Ana\./);
  assert.match(moved.html, /Lo habías pedido para el viernes 13 de noviembre a las 11:00 h/);
  for (const requested of [null, start]) assert.doesNotMatch(renderConfirmedEmail({ name: "Ana", start, requested }).html, /Lo habías pedido/);
});
