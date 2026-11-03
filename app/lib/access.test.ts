import assert from "node:assert/strict";
import { test } from "node:test";
import { canManage } from "./access.ts";
import { age, bmi, controlStatus } from "./clients.ts";
import { dashboard } from "./stats.ts";
import { days, fromLocalInput, longDate, num, shortDate, toLocalInput } from "./format.ts";

test("el admin maneja a cualquiera; el coach, sólo a los suyos; el cliente, a nadie", () => {
  const admin = { id: 1, role: "admin" } as const;
  const coach = { id: 2, role: "coach" } as const;
  const user = { id: 3, role: "user" } as const;
  assert.equal(canManage(admin, { coach_id: null }), true);
  assert.equal(canManage(coach, { coach_id: 2 }), true);
  assert.equal(canManage(coach, { coach_id: 9 }), false);
  assert.equal(canManage(coach, { coach_id: null }), false);
  assert.equal(canManage(user, { coach_id: 3 }), false);
});

test("estado del seguimiento: al día hasta 30 días, por vencer hasta 45, después atrasado", () => {
  assert.equal(controlStatus(null, "2026-11-03"), "sin-control");
  assert.equal(controlStatus("2026-10-04", "2026-11-03"), "al-dia"); // 30 días
  assert.equal(controlStatus("2026-10-03", "2026-11-03"), "por-vencer"); // 31
  assert.equal(controlStatus("2026-09-19", "2026-11-03"), "por-vencer"); // 45
  assert.equal(controlStatus("2026-09-18", "2026-11-03"), "atrasado"); // 46
  assert.equal(bmi(87.3, 170), 30.2);
  assert.equal(bmi(null, 170), null);
  assert.equal(age(1999, "2026-11-03"), 27);
});

test("dashboard: cobertura, controles por semana, mejoras y por coach", () => {
  const base = { plan: null, active: true, client_since: "2025-01-01", coach_id: 7, coach_name: "Zar", coach_photo: null, last_fat: null, prev_fat: null };
  const rows = [
    { ...base, id: 1, last_date: "2026-10-30", plan: "Premium", last_fat: 14, prev_fat: 16 }, // al día, mejoró
    { ...base, id: 2, last_date: "2026-09-25", last_fat: 20, prev_fat: 19 }, // por vencer, no mejoró
    { ...base, id: 3, last_date: "2026-01-01", client_since: "2026-10-20" }, // atrasado, alta reciente
    { ...base, id: 4, last_date: null }, // sin control
    { ...base, id: 5, last_date: "2026-10-30", active: false }, // dado de baja: no cuenta
  ];
  const checkins = [{ date: "2026-10-30", client_id: 1 }, { date: "2026-09-25", client_id: 2 }];
  const d = dashboard(rows, checkins, "2026-11-03");
  assert.equal(d.total, 4);
  assert.deepEqual(d.by, { "al-dia": 1, "por-vencer": 1, atrasado: 1, "sin-control": 1 });
  assert.equal(d.coverage, 25);
  assert.equal(d.coverageWithDue, 50);
  assert.equal(d.last30, 1);
  assert.equal(d.prev30, 1);
  assert.equal(d.improved, 1);
  assert.equal(d.comparable, 2);
  assert.equal(d.newLast, 1);
  assert.equal(d.weeks.length, 12);
  assert.equal(d.weeks.at(-1)!.week, "2026-11-02"); // el lunes de esta semana
  assert.equal(d.weeks.reduce((s, w) => s + w.count, 0), 2);
  assert.equal(d.plans.find((p) => p.plan === "Premium")!.n, 1);
  assert.deepEqual(d.perCoach[0], { id: 7, name: "Zar", photo: null, clients: 4, coverage: 25, checkins30: 1, late: 1 });
});

test("fechas y números en castellano, en hora de Buenos Aires", () => {
  assert.equal(longDate("2026-11-09"), "Lunes 9 de noviembre");
  assert.equal(shortDate("2026-11-09"), "09/11/2026");
  assert.equal(num(80.94), "80,9");
  assert.equal(days(1), "1 día");
  assert.equal(days(12), "12 días");
  // 19:00 en Buenos Aires es 22:00 UTC, y vuelve igual al input
  const at = fromLocalInput("2026-11-09T19:00")!;
  assert.equal(at.toISOString(), "2026-11-09T22:00:00.000Z");
  assert.equal(toLocalInput(at), "2026-11-09T19:00");
});
