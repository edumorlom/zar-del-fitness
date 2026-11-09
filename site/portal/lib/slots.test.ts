import assert from "node:assert/strict";
import { test } from "node:test";
import { freeSlots, hoursFrom } from "./slots.ts";

const hours = hoursFrom({ dias: ["lunes", "viernes"], turnos: [{ abre: "08:00", cierra: "12:00" }] });
const now = new Date("2026-11-08T12:00:00Z");
const appointments = Array.from({ length: 5 }, (_, i) => ({
  start: new Date(Date.parse("2026-11-13T11:00:00Z") + i * 30 * 60_000),
  end: new Date(Date.parse("2026-11-13T11:30:00Z") + i * 30 * 60_000),
}));

test("el quinto turno se puede pedir y después se cierra la disponibilidad de todo el viernes", () => {
  assert.equal(freeSlots("2026-11-13", hours, appointments.slice(0, 4), now, 4).length, 4);
  assert.deepEqual(freeSlots("2026-11-13", hours, appointments, now, 5), []);
  assert.deepEqual(freeSlots("2026-11-13", hours, appointments, now, 6), []);
});

test("los eventos de Google bloquean horarios pero no consumen los 5 cupos de control", () => {
  assert.equal(freeSlots("2026-11-13", hours, appointments, now, 0).length, 3);
});

test("cancelar o rechazar libera cupo; mover dentro de un viernes lleno excluye al propio turno", () => {
  const others = appointments.slice(0, 4);
  assert.ok(freeSlots("2026-11-13", hours, others, now, others.length).some((s) => s.start.getTime() === appointments[4].start.getTime()));
});
