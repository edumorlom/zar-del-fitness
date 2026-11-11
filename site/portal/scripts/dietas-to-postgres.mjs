// Sube las dietas de un SQLite del portal anterior (tablas alumnos y dietas) a la tabla diets del portal.
//
//   node --env-file=.env.local portal/scripts/dietas-to-postgres.mjs zar_fitness_dietas.sqlite          (prueba: no guarda)
//   node --env-file=.env.local portal/scripts/dietas-to-postgres.mjs zar_fitness_dietas.sqlite --write  (guarda)
//
// Cada dieta va a la evaluación del mismo alumno (users.external_id = dietas.alumno_id) y el mismo día. Sólo se carga
// si esa evaluación todavía no tiene dieta: nunca pisa una ya cargada. Las que no encuentran evaluación se listan y quedan.
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const [path, flag] = process.argv.slice(2);
if (!path) throw new Error("Uso: node portal/scripts/dietas-to-postgres.mjs dietas.sqlite [--write]");
const lite = new DatabaseSync(path, { readOnly: true });
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const clean = (s) => (typeof s === "string" && s.trim() ? s.trim() : null);
const count = { new: 0, had: 0 };
const missing = [];

try {
  await db.query("begin");
  for (const d of lite.prepare("select * from dietas order by alumno_id, fecha_dieta").all()) {
    const day = clean(d.fecha_dieta)?.slice(0, 10);
    // La evaluación de ese día; si hubiera dos, la primera que todavía no tiene dieta.
    const { rows } = day
      ? await db.query(
          `select c.id, exists (select 1 from diets where checkin_id = c.id) as has_diet
           from checkins c join users u on u.id = c.client_id
           where u.external_id = $1 and c.date = $2::date
           order by has_diet, c.created_at, c.id limit 1`,
          [d.alumno_id, day]
        )
      : { rows: [] };
    if (!rows.length) {
      missing.push(`${d.alumno_nombre} (${day ?? "sin fecha"})`);
      continue;
    }
    const { rowCount } = await db.query(
      `insert into diets (checkin_id, goal, breakfast, morning_snack, lunch, afternoon_snack, dinner, supplements)
       values ($1, $2, $3, $4, $5, $6, $7, $8) on conflict (checkin_id) do nothing`,
      [rows[0].id, ...["objetivo", "desayuno", "colacion_desayuno", "almuerzo", "colacion_almuerzo", "cena", "suplemento"].map((k) => clean(d[k]))]
    );
    rowCount ? count.new++ : count.had++;
  }
  await db.query(flag === "--write" ? "commit" : "rollback");
} catch (e) {
  await db.query("rollback");
  throw e;
} finally {
  await db.end();
}

console.log(`${flag === "--write" ? "guardado" : "PRUEBA (nada guardado; --write para guardar)"}`);
console.log(`dietas nuevas: ${count.new} · ya tenían dieta: ${count.had} · sin evaluación: ${missing.length}`);
if (missing.length) console.log(missing.map((m) => `  - ${m}`).join("\n"));
