import assert from "node:assert/strict";
import { test } from "node:test";
import { elapsed, inSendingHours, REMINDER_IMAGES, reminderDue, renderReminderEmail } from "./reminder-email.ts";

const now = new Date("2026-11-13T15:00:00Z");
const base = { last: "2026-10-13", reminded: null, nextControl: null, booked: false };

test("le toca desde el día que se cumple el mes de su última evaluación", () => {
  assert.equal(reminderDue(base, "2026-11-12", now), null);
  assert.equal(reminderDue(base, "2026-11-13", now), "2026-11-13");
  assert.equal(reminderDue(base, "2026-12-20", now), "2026-11-13"); // más tarde, también (si no se le mandó)
  assert.equal(reminderDue({ ...base, last: "2026-01-31" }, "2026-02-28", now), "2026-02-28"); // fin de mes, como Postgres
  assert.equal(reminderDue({ ...base, last: null }, "2026-11-13", now), null); // sin evaluaciones
});

test("uno por evaluación: con uno mandado desde el mes no le llega otro; con una evaluación nueva, sí", () => {
  assert.equal(reminderDue({ ...base, reminded: "2026-11-13" }, "2026-11-20", now), null);
  assert.equal(reminderDue({ ...base, reminded: "2026-11-13" }, "2027-01-20", now), null);
  // El anterior fue por la evaluación de septiembre: ésta es otra.
  assert.equal(reminderDue({ ...base, reminded: "2026-10-05" }, "2026-11-13", now), "2026-11-13");
});

test("con el próximo control ya pedido o puesto, no le llega", () => {
  assert.equal(reminderDue({ ...base, booked: true }, "2026-11-13", now), null);
  assert.equal(reminderDue({ ...base, nextControl: new Date("2026-11-20T13:00:00Z") }, "2026-11-13", now), null);
  assert.equal(reminderDue({ ...base, nextControl: new Date("2026-11-06T13:00:00Z") }, "2026-11-13", now), "2026-11-13"); // ya pasó
});

test("se manda sólo de día, en hora de Buenos Aires", () => {
  assert.equal(inSendingHours(new Date("2026-11-13T11:59:00Z")), false); // 8:59
  assert.equal(inSendingHours(new Date("2026-11-13T12:00:00Z")), true); // 9:00
  assert.equal(inSendingHours(new Date("2026-11-13T23:59:00Z")), true); // 20:59
  assert.equal(inSendingHours(new Date("2026-11-14T00:00:00Z")), false); // 21:00
});

test("cuánto pasó desde la última evaluación", () => {
  assert.equal(elapsed("2026-10-13", "2026-11-13"), "Ya pasó un mes");
  assert.equal(elapsed("2026-10-13", "2026-11-20"), "Ya pasó más de un mes");
  assert.equal(elapsed("2026-08-13", "2026-11-13"), "Ya pasaron 3 meses");
  assert.equal(elapsed("2026-08-13", "2026-11-14"), "Ya pasaron más de 3 meses");
  assert.equal(elapsed("2025-10-13", "2026-11-13"), "Ya pasó más de un año");
  assert.equal(elapsed("2023-10-13", "2026-11-13"), "Ya pasaron más de 3 años");
});

test("el correo: saludo, cuándo fue, sus números contra la anterior y el botón para pedir turno", () => {
  const { subject, html, attachments } = renderReminderEmail({
    name: "JUAN <b>PÉREZ",
    today: "2026-11-13",
    last: { date: "2026-10-13", weight: 78.6, fat: 15.2 },
    prev: { date: "2026-09-10", weight: 80, fat: 16 },
    legacy: false,
  });
  assert.equal(subject, "Es hora de tu nueva evaluación");
  assert.match(html, /Hola, Juan\. Ya pasó un mes desde tu última evaluación, el 13 de octubre\./);
  assert.match(html, />78,6<span[^>]*> kg</);
  assert.match(html, /−1,4 kg desde el 10 de septiembre/);
  assert.match(html, />15,2<span[^>]*> %</);
  assert.match(html, /−0,8 puntos desde el 10 de septiembre/);
  assert.match(html, /href="https:\/\/zardelfitness\.com\.ar\/portal\/turno"/);
  assert.match(html, /alt="Pedir mi turno"/);
  assert.match(html, /src="cid:hero"/);
  assert.match(html, /src="cid:boton"/);
  assert.match(html, /Escribinos/);
  assert.doesNotMatch(html, /<b>/);
  assert.deepEqual(attachments, REMINDER_IMAGES);
  assert.deepEqual(
    REMINDER_IMAGES.map((i) => i.path),
    ["https://zardelfitness.com.ar/correo/recordatorio-hero.jpg", "https://zardelfitness.com.ar/correo/recordatorio-boton.png"]
  );
});

test("la primera evaluación, y la del portal anterior (sólo el peso, sin decir que es la primera)", () => {
  const first = renderReminderEmail({ name: "Ana", today: "2026-11-13", last: { date: "2026-10-13", weight: 60, fat: 25 }, prev: null, legacy: false }).html;
  assert.match(first, /Tu primera evaluación/);

  const legacy = renderReminderEmail({ name: "Ana", today: "2026-11-13", last: { date: "2025-06-02", weight: 61.5, fat: null }, prev: null, legacy: true }).html;
  assert.match(legacy, /Ya pasó más de un año desde tu última evaluación, el 2 de junio de 2025\./);
  assert.match(legacy, />61,5<span/);
  assert.doesNotMatch(legacy, /% graso|Tu primera evaluación/);

  const none = renderReminderEmail({ name: "Ana", today: "2026-11-13", last: { date: "2025-06-02", weight: null, fat: null }, prev: null, legacy: true }).html;
  assert.doesNotMatch(none, /Estos fueron tus números|Peso/);
});
