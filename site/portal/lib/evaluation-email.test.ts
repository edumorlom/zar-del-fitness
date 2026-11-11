import assert from "node:assert/strict";
import { test } from "node:test";
import { change, greeting, niceDate, renderEvaluationEmail } from "./evaluation-email.ts";

const empty = { goal: null, breakfast: null, morning_snack: null, lunch: null, afternoon_snack: null, dinner: null, supplements: null };

test("la diferencia contra la anterior, con signo, redondeada y sin la anterior", () => {
  assert.equal(change(78.6, 80, "kg", "3 de octubre"), "−1,4 kg desde el 3 de octubre");
  assert.equal(change(15.2, 14.6, "puntos", "3 de octubre"), "+0,6 puntos desde el 3 de octubre");
  assert.equal(change(80.04, 80, "kg", "3 de octubre"), "Igual que el 3 de octubre");
  assert.equal(change(80, undefined, "kg", undefined), "Tu primera evaluación");
});

test("la fecha lleva el año sólo si es de otro año", () => {
  assert.equal(niceDate("2026-11-11"), "11 de noviembre");
  assert.equal(niceDate("2025-12-03", "2026-01-10"), "3 de diciembre de 2025");
});

test("el saludo usa el primer nombre, sin mayúsculas sostenidas, y escapado", () => {
  assert.equal(greeting("MELANIE WOLMAN"), "Hola, Melanie.");
  assert.equal(greeting("<b>Ana"), "Hola, &#60;b&#62;Ana.");
  assert.equal(greeting("  "), "Hola.");
});

test("el plan aparece sólo si tiene algo, escapado y con sus saltos de línea", () => {
  const base = { name: "Juan", date: "2026-11-11", weight: 78.6, fat: 15.2, prev: { date: "2026-10-03", weight: 80, fat: 16 } };
  const withDiet = renderEvaluationEmail({ ...base, diet: { ...empty, goal: "Bajar <grasa>", lunch: "Pollo\nEnsalada" } });
  assert.match(withDiet, /Tu plan de alimentación/);
  assert.match(withDiet, /Bajar &#60;grasa&#62;/);
  assert.match(withDiet, /Pollo<br>Ensalada/);
  assert.doesNotMatch(withDiet, /Desayuno/);
  for (const diet of [null, empty]) assert.doesNotMatch(renderEvaluationEmail({ ...base, diet }), /plan de alimentación/);
});
