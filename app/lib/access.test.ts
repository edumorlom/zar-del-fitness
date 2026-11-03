import assert from "node:assert/strict";
import { test } from "node:test";
import { canManage } from "./access.ts";
import { days, fromLocalInput, longDate, num, shortDate, toLocalInput } from "./format.ts";

test("el admin maneja a cualquiera; el coach, sólo a los suyos; el socio, a nadie", () => {
  const admin = { id: 1, role: "admin" } as const;
  const coach = { id: 2, role: "coach" } as const;
  const user = { id: 3, role: "user" } as const;
  assert.equal(canManage(admin, { coach_id: null }), true);
  assert.equal(canManage(coach, { coach_id: 2 }), true);
  assert.equal(canManage(coach, { coach_id: 9 }), false);
  assert.equal(canManage(coach, { coach_id: null }), false);
  assert.equal(canManage(user, { coach_id: 3 }), false);
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
