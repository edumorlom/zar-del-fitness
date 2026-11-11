import assert from "node:assert/strict";
import test from "node:test";
import { pick, render, sendAll } from "./email-cuenta-lista.mjs";

const person = (email: string) => ({ name: "Ana", email });
const ok = { ok: true, status: 200 };

test("sólo reciben los activos con correo válido, una vez, y nunca dos veces entre corridas", () => {
  const rows = [
    { name: "A", email: "a@x.com", active: true },
    { name: "A bis", email: "a@x.com", active: true },
    { name: "Baja", email: "b@x.com", active: false },
    { name: "Sin correo", email: null, active: true },
    { name: "Mal", email: "sin-arroba", active: true },
    { name: "Ya", email: "c@x.com", active: true },
  ];
  const { to, inactive, noEmail, already } = pick(rows, new Set(["c@x.com"]));
  assert.deepEqual(to.map((r: { email: string }) => r.email), ["a@x.com"]);
  assert.deepEqual([inactive, noEmail, already], [1, 2, 1]);
});

test("el correo saluda por el nombre y escapa lo que viene de la base", () => {
  const html = "{{saludo}} {{email}}";
  assert.equal(render(html, { name: "ALEJANDRO ISLA", email: "a@x.com" }), "Hola, Alejandro. a@x.com");
  assert.equal(render(html, { name: "<b>$&", email: "a&b@x.com" }), "Hola, &#60;b&#62;$&#38;. a&#38;b@x.com");
  assert.equal(render(html, { name: " ", email: "a@x.com" }), "Hola. a@x.com");
});

const run = async (answers: object[]) => {
  const noted: string[] = [];
  let i = 0;
  const noWait = (async () => {}) as never;
  const r = await sendAll(["a@x.com", "b@x.com"].map(person), async () => answers[i++], (p: { email: string }) => noted.push(p.email), noWait);
  return { ...r, noted, calls: i };
};

test("reintenta si va muy rápido y anota sólo lo enviado", async () => {
  const r = await run([{ ok: false, status: 429, name: "rate_limit_exceeded", retryAfter: 1 }, ok, ok]);
  assert.deepEqual(r, { sent: 2, rejected: [], stopped: null, noted: ["a@x.com", "b@x.com"], calls: 3 });
});

test("una dirección rechazada no frena al resto", async () => {
  const r = await run([{ ok: false, status: 422, name: "invalid_parameter", message: "mal" }, ok]);
  assert.deepEqual(r, { sent: 1, rejected: ["a@x.com: mal"], stopped: null, noted: ["b@x.com"], calls: 2 });
});

test("sin cupo o sin dominio verificado se frena enseguida", async () => {
  const quota = await run([ok, { ok: false, status: 429, name: "daily_quota_exceeded", message: "cupo" }]);
  assert.equal(quota.stopped, "429 daily_quota_exceeded: cupo");
  assert.deepEqual(quota.noted, ["a@x.com"]);
  const domain = await run([{ ok: false, status: 403, name: "validation_error", message: "dominio" }]);
  assert.equal(domain.calls, 1);
});
