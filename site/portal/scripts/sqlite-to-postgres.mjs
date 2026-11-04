// Sube el SQLite que arma portal/scripts/sumar-to-sqlite.mjs a la base del portal.
//
//   node --env-file=.env.local portal/scripts/sqlite-to-postgres.mjs alumnos-sumar.sqlite
//
// Se puede correr de nuevo sin duplicar: cada persona se busca por correo o, sin correo, por su id del portal anterior, y
// una evaluación con la misma fecha, peso y % graso de la misma persona no se vuelve a cargar. Nunca le baja el rol a
// nadie ni le cambia el coach a quien ya tiene uno, y un dato vacío del SQLite no borra uno cargado en el portal.
// Sube las columnas que estén en las dos bases: lo que Postgres todavía no tiene (si faltara alguna) avisa y queda.
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const [path] = process.argv.slice(2);
if (!path) throw new Error("Uso: node portal/scripts/sqlite-to-postgres.mjs alumnos-sumar.sqlite");
const lite = new DatabaseSync(path, { readOnly: true });
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const columns = async (table, skip) => {
  const { rows } = await db.query("select column_name from information_schema.columns where table_name = $1", [table]);
  const have = new Set(rows.map((r) => r.column_name));
  const mine = lite.prepare(`select name from pragma_table_info('${table}')`).all().map((r) => r.name);
  const missing = mine.filter((c) => !have.has(c));
  if (missing.length) console.warn(`${table}: Postgres no tiene ${missing.join(", ")}; esas columnas no se suben.`);
  return mine.filter((c) => have.has(c) && !skip.includes(c));
};
// SQLite no tiene arrays ni booleanos: conditions viene como JSON y active como 0/1.
const value = (col, v) => (col === "conditions" ? JSON.parse(v ?? "[]") : col === "active" ? v !== 0 : v);

const userCols = await columns("users", ["id", "created_at", "coach_id"]);
const checkinCols = await columns("checkins", ["id", "client_id", "created_by"]);
const set = (c) =>
  c === "role"
    ? "role = case when users.role = 'admin' or excluded.role = 'user' then users.role else excluded.role end"
    : c.startsWith("legacy_") // con el historial completo, el "último control" suelto deja de hacer falta
      ? `${c} = excluded.${c}`
      : `${c} = coalesce(excluded.${c}, users.${c})`;
const update = [...userCols.filter((c) => c !== "email").map(set), "coach_id = coalesce(users.coach_id, excluded.coach_id)"];

const ids = {}; // users.id del SQLite → users.id de Postgres
const count = { usersNew: 0, usersUpdated: 0, checkinsNew: 0, checkinsSkipped: 0 };

try {
  await db.query("begin");

  // Primero los que no tienen coach (los coaches), así el coach de cada alumno ya tiene su id en Postgres.
  for (const u of lite.prepare("select * from users order by coach_id is not null, id").all()) {
    const cols = [...userCols, "coach_id"];
    const values = [...userCols.map((c) => value(c, u[c])), u.coach_id == null ? null : ids[u.coach_id]];
    if (u.coach_id != null && values.at(-1) == null) throw new Error(`El coach de ${u.name} no se subió antes`);
    const { rows } = await db.query(
      `insert into users (${cols}) values (${cols.map((_, i) => `$${i + 1}`)})
       on conflict (${u.email ? "email" : "external_id"}) do update set ${update}
       returning id, (xmax = 0) as inserted`,
      values
    );
    ids[u.id] = rows[0].id;
    rows[0].inserted ? count.usersNew++ : count.usersUpdated++;
  }

  for (const c of lite.prepare("select * from checkins order by client_id, date").all()) {
    const cols = ["client_id", ...checkinCols];
    const values = [ids[c.client_id], ...checkinCols.map((k) => c[k])];
    const { rowCount } = await db.query(
      `insert into checkins (${cols})
       select ${cols.map((_, i) => `$${i + 1}`)}
       where not exists (select 1 from checkins
                         where client_id = $1 and date = $2::date and weight_kg = $3::numeric and body_fat_pct = $4::numeric)`,
      values
    );
    rowCount ? count.checkinsNew++ : count.checkinsSkipped++;
  }

  await db.query("commit");
} catch (e) {
  await db.query("rollback");
  throw e;
} finally {
  await db.end();
}

console.log(
  `personas nuevas: ${count.usersNew} · actualizadas: ${count.usersUpdated} · ` +
    `evaluaciones nuevas: ${count.checkinsNew} · ya estaban: ${count.checkinsSkipped}`
);
