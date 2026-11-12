import assert from "node:assert/strict";
import { test } from "node:test";
import { addMonths, canPayOnline, extendPass, isPayable, money, mpMatches, notifiedPaymentId, passStatus } from "./payments.ts";

test("un mes más, con el último día del mes si ese día no existe", () => {
  assert.equal(addMonths("2026-11-12", 1), "2026-12-12");
  assert.equal(addMonths("2026-12-15", 1), "2027-01-15");
  assert.equal(addMonths("2027-01-31", 1), "2027-02-28");
  assert.equal(addMonths("2028-01-31", 1), "2028-02-29");
  assert.equal(addMonths("2026-03-31", 1), "2026-04-30");
  assert.equal(addMonths("2026-11-30", 3), "2027-02-28");
});

test("pagar antes de que venza suma desde el vencimiento; vencido o sin fecha, desde hoy", () => {
  const today = "2026-11-12";
  assert.equal(extendPass("2026-11-15", today), "2026-12-15");
  assert.equal(extendPass("2026-11-12", today), "2026-12-12");
  assert.equal(extendPass("2026-11-01", today), "2026-12-12");
  assert.equal(extendPass(null, today), "2026-12-12");
});

test("estado del pase: por vencer dentro de 7 días, vencido desde el día siguiente", () => {
  const today = "2026-11-12";
  assert.equal(passStatus(null, today), "sin-fecha");
  assert.equal(passStatus("2026-11-20", today), "al-dia"); // 8 días
  assert.equal(passStatus("2026-11-19", today), "por-vencer"); // 7
  assert.equal(passStatus("2026-11-12", today), "por-vencer"); // hoy
  assert.equal(passStatus("2026-11-11", today), "vencido");
});

test("Mercado Pago, cualquier cliente Premium activo, en cualquier momento", () => {
  const premium = { plan: "Premium", active: true };
  assert.equal(canPayOnline(premium), true);
  assert.equal(canPayOnline({ ...premium, active: false }), false);
  assert.equal(canPayOnline({ ...premium, plan: "General Dirigido" }), false);
  assert.equal(canPayOnline({ ...premium, plan: null }), false);
  assert.equal(isPayable("toString"), false);
});

test("el monto, en pesos", () => {
  assert.equal(money(450000).replace(/\s/g, " "), "$ 450.000");
  assert.equal(money(1234.5).replace(/\s/g, " "), "$ 1.234,5");
});

test("los avisos de Mercado Pago: Webhooks e IPN, sólo de pagos", () => {
  const q = (s: string) => new URLSearchParams(s);
  assert.equal(notifiedPaymentId(q("data.id=123456&type=payment"), null), "123456");
  assert.equal(notifiedPaymentId(q(""), { type: "payment", action: "payment.updated", data: { id: "987" } }), "987");
  assert.equal(notifiedPaymentId(q(""), { type: "payment", data: { id: 987 } }), "987");
  assert.equal(notifiedPaymentId(q("topic=payment&id=555"), null), "555");
  assert.equal(notifiedPaymentId(q("topic=merchant_order&id=555"), null), null);
  assert.equal(notifiedPaymentId(q("data.id=../../x&type=payment"), null), null);
  assert.equal(notifiedPaymentId(q(""), "basura"), null);
});

test("un pago acredita su fila sólo con la misma referencia, la misma moneda y el monto completo", () => {
  const row = { id: 42, amount: 450000, currency: "ARS" };
  const p = { id: 1, status: "approved", external_reference: "42", transaction_amount: 450000, currency_id: "ARS" };
  assert.equal(mpMatches(p, row), true);
  assert.equal(mpMatches({ ...p, external_reference: "43" }, row), false);
  assert.equal(mpMatches({ ...p, external_reference: null }, row), false);
  assert.equal(mpMatches({ ...p, transaction_amount: 1000 }, row), false);
  assert.equal(mpMatches({ ...p, currency_id: "USD" }, row), false);
});
