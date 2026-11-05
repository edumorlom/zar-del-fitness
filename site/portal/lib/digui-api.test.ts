import assert from "node:assert/strict";
import { test } from "node:test";
import { customerId, keyOk, parseDay, parseStart, phoneTail } from "./digui-api.ts";

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
