// Sube los turnos pendientes y los ya pasados de un SQLite del portal anterior (tabla turnos) a appointments.
//
//   node --env-file=.env.local portal/scripts/turnos-to-postgres.mjs agenda.sqlite          (prueba: no guarda)
//   node --env-file=.env.local portal/scripts/turnos-to-postgres.mjs agenda.sqlite --write  (guarda)
//
// Se puede correr de nuevo: un turno del mismo alumno a la misma hora no se vuelve a cargar. Los pendientes no van al
// calendario de Google: se confirman desde la Agenda del portal. Si la hora ya la tiene otro turno vivo, se lista y queda.
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const [path, flag] = process.argv.slice(2);
if (!path) throw new Error("Uso: node portal/scripts/turnos-to-postgres.mjs agenda.sqlite [--write]");
const lite = new DatabaseSync(path, { readOnly: true });
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// Como portal/scripts/sumar-to-sqlite.mjs: hora de Argentina (UTC−3 fijo) y turnos de SLOT_MINUTES (lib/slots.ts).
const SLOT_MS = 30 * 60_000;
const STATUS = { pendiente: "requested", confirmado: "confirmed", cancelado: "cancelled", rechazado: "rejected" };
const at = (fecha, hora) => new Date(`${fecha}T${hora}:00-03:00`);
const now = Date.now();
const count = { new: 0, had: 0 };
const skipped = [];

try {
  await db.query("begin");
  for (const t of lite.prepare("select * from turnos order by fecha, hora, creado_en").all()) {
    if (!STATUS[t.estado]) throw new Error(`Estado de turno desconocido: ${t.estado}`);
    const start = at(t.fecha, t.hora);
    if (t.estado !== "pendiente" && start.getTime() >= now) continue; // sólo los pendientes y los que ya pasaron
    const who = `${t.alumno_nombre} ${t.fecha} ${t.hora} (${t.estado})`;
    const { rows: [u] } = await db.query("select id from users where external_id = $1", [t.alumno_id]);
    if (!u) {
      skipped.push(`${who}: no está en el portal`);
      continue;
    }
    const { rows: [mine] } = await db.query("select 1 from appointments where client_id = $1 and starts_at = $2", [u.id, start]);
    if (mine) {
      count.had++;
      continue;
    }
    const status = STATUS[t.estado];
    if (status === "requested" || status === "confirmed") {
      const { rows: [taken] } = await db.query(
        `select u.name from appointments a join users u on u.id = a.client_id
         where a.starts_at = $1 and a.status in ('requested', 'confirmed')`,
        [start]
      );
      if (taken) {
        skipped.push(`${who}: esa hora ya la tiene ${taken.name}`);
        continue;
      }
    }
    await db.query(
      `insert into appointments (client_id, starts_at, ends_at, status, requested_at, created_at)
       values ($1, $2, $3, $4, $5, $6)`,
      [u.id, start, new Date(start.getTime() + SLOT_MS), status,
        t.pedido_fecha && t.pedido_hora ? at(t.pedido_fecha, t.pedido_hora) : null, t.creado_en]
    );
    count.new++;
  }
  await db.query(flag === "--write" ? "commit" : "rollback");
} catch (e) {
  await db.query("rollback");
  throw e;
} finally {
  await db.end();
}

console.log(`${flag === "--write" ? "guardado" : "PRUEBA (nada guardado; --write para guardar)"}`);
console.log(`turnos nuevos: ${count.new} · ya estaban: ${count.had} · no cargados: ${skipped.length}`);
if (skipped.length) console.log(skipped.map((s) => `  - ${s}`).join("\n"));
