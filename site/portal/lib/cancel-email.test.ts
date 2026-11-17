import assert from "node:assert/strict";
import { test } from "node:test";
import { cancelCode, renderCancelNotice, renderCancelReceipt, type CancelRequest } from "./cancel-email.ts";

const base: CancelRequest = {
  kind: "arrepentimiento",
  code: "ARR-20261117-7F3KQ",
  name: "Ana <Pérez>",
  email: "ana@example.com",
  phone: "",
  dni: "30111222",
  plan: "Sistema Premium",
  purchasedOn: "2026-11-10",
  message: "",
  deleteData: false,
  lang: "es",
  at: "17/11/2026 14:32",
};

test("el código: tipo, día y cinco letras sin las que se confunden", () => {
  const code = cancelCode("baja", "2026-11-17");
  assert.match(code, /^BAJ-20261117-[2-9A-HJKMNP-Z]{5}$/);
  assert.equal(cancelCode("arrepentimiento", "2026-01-02", () => 0), "ARR-20260102-22222");
});

test("la constancia del arrepentimiento: el código, la devolución y todo escapado", () => {
  const { subject, html } = renderCancelReceipt(base);
  assert.equal(subject, "Recibimos tu arrepentimiento · ARR-20261117-7F3KQ");
  assert.match(html, /ARR-20261117-7F3KQ/);
  assert.match(html, /Te devolvemos todo lo que pagaste/);
  assert.match(html, /Ana &#60;Pérez&#62;/);
  assert.doesNotMatch(html, /borremos tus datos/);
});

test("la constancia de la baja, en inglés y con el pedido de borrar los datos", () => {
  const { subject, html } = renderCancelReceipt({ ...base, kind: "baja", code: "BAJ-20261117-ABCDE", lang: "en", deleteData: true });
  assert.equal(subject, "We got your cancellation · BAJ-20261117-ABCDE");
  assert.match(html, /nothing else will be charged/);
  assert.match(html, /delete your personal data/);
});

test("el aviso al gimnasio trae los datos que hay y qué hacer", () => {
  const { subject, html } = renderCancelNotice(base);
  assert.equal(subject, "Botón de arrepentimiento · ARR-20261117-7F3KQ · Ana <Pérez>");
  assert.match(html, /<strong>DNI:<\/strong> 30111222/);
  assert.match(html, /devolverle todo lo que pagó/);
  assert.doesNotMatch(html, /Teléfono/);
});
