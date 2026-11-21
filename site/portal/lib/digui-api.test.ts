import assert from "node:assert/strict";
import { test } from "node:test";
import { apiBase, customerId, dietReply, keyOk, parseDay, parseStart, phoneTail } from "./digui-api.ts";

test("la base de la API: el dominio en que se pidieron las instrucciones", () => {
  assert.equal(apiBase("zardelfitness.com.ar"), "https://zardelfitness.com.ar/portal/api/digui");
  assert.equal(apiBase("ZARdelfitness.com.ar, proxy.internal"), "https://zardelfitness.com.ar/portal/api/digui");
  assert.equal(apiBase("localhost:3000"), "http://localhost:3000/portal/api/digui");
});

test("la clave: solo Bearer con la clave exacta, y nunca sin clave configurada", () => {
  assert.equal(keyOk("Bearer s3cret", "s3cret"), true);
  for (const h of [null, "", "s3cret", "Bearer s3cre", "Bearer s3cret ", "bearer s3cret"]) assert.equal(keyOk(h, "s3cret"), false, String(h));
  assert.equal(keyOk("Bearer ", ""), false);
  assert.equal(keyOk("Bearer x", undefined), false);
});
test("el teléfono: los últimos 7 dígitos, con o sin 9, 0 y 15", () => {
  for (const p of ["+54 9 11 5555-1234", "11 5555-1234", "011 15 5555-1234", "+5491155551234"]) assert.equal(phoneTail(p), "5551234", p);
  assert.equal(phoneTail("0351 15 555-1234"), phoneTail("+54 9 351 555-1234"));
  for (const p of [null, undefined, "", "123456", "abc"]) assert.equal(phoneTail(p), null, String(p));
});
test("customer_id: entero positivo, como número o texto", () => {
  assert.equal(customerId(12), 12); assert.equal(customerId("12"), 12);
  for (const v of ["12abc", "", " 12", 0, -3, 1.5, null, undefined, "0"]) assert.equal(customerId(v), null, String(v));
});
test("el día y el inicio", () => {
  assert.equal(parseDay("2026-11-06"), "2026-11-06");
  for (const d of [null, "", "2026-13-01", "2026-02-30", "06/11/2026", "2026-11-6"]) assert.equal(parseDay(d), null, String(d));
  assert.equal(parseStart("2026-11-06T16:30")?.toISOString(), "2026-11-06T19:30:00.000Z");
  for (const s of [null, 5, "", "2026-11-06", "2026-11-06 16:30", "2026-11-06T25:00", "x"]) assert.equal(parseStart(s), null, String(s));
});

test("ver_dieta: el plan vigente, sólo las comidas cargadas y en el orden del portal", () => {
  const empty = { goal: null, breakfast: null, morning_snack: null, lunch: null, afternoon_snack: null, dinner: null, supplements: null };
  const r = dietReply({ ...empty, date: "2026-11-13", goal: " Bajar grasa ", dinner: "Merluza", breakfast: "Avena\nCafé", lunch: "  " });
  assert.equal(r.ok, true);
  assert.equal(r.mensaje, "Tu plan de alimentación es el de la evaluación del Viernes 13 de noviembre (objetivo: Bajar grasa). Tiene desayuno y cena.");
  assert.deepEqual(r.plan, {
    desde: "2026-11-13",
    objetivo: "Bajar grasa",
    comidas: [{ comida: "Desayuno", detalle: "Avena\nCafé" }, { comida: "Cena", detalle: "Merluza" }],
  });
  assert.match(dietReply({ ...empty, date: "2026-11-13", supplements: "Creatina" }).mensaje, /evaluación del Viernes 13 de noviembre\. Tiene suplementos\.$/);
  assert.match(dietReply({ ...empty, date: "2026-11-13", goal: "Ganar masa" }).mensaje, /No tiene comidas cargadas\.$/);
  assert.deepEqual(dietReply(null), { ok: true, mensaje: "Todavía no tenés un plan de alimentación cargado: te lo da tu coach en la evaluación.", plan: null });
});
