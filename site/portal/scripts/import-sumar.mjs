// Importa coaches y clientes del portal anterior (zardelfitness.sumar.dev) a la base del portal.
//
//   node --env-file=.env.local portal/scripts/import-sumar.mjs coaches.json [clientes.json]
//
// coaches.json: { "coaches": [...] } y clientes.json: { "items": [...] }, tal como los da el portal anterior. Los datos
// no van en el repo (son personales y de salud): se pasan como archivos. Se puede correr de nuevo sin duplicar a nadie:
// cada persona se busca por correo o, sin correo, por su id del portal anterior. Nunca le baja el rol a nadie.
import { readFileSync } from "node:fs";
import pg from "pg";

const [coachesPath, clientsPath] = process.argv.slice(2);
if (!coachesPath) throw new Error("Uso: node portal/scripts/import-sumar.mjs coaches.json [clientes.json]");
const coaches = JSON.parse(readFileSync(coachesPath, "utf8")).coaches;
const clients = clientsPath ? JSON.parse(readFileSync(clientsPath, "utf8")).items : [];

// El portal anterior da la edad, no la fecha de nacimiento: el año de nacimiento sale del año de la exportación.
const EXPORT_YEAR = 2026;
const MASTER_EMAIL = "zardelfitnessgym@gmail.com"; // "Zardelfitness" (nivel master): Ronald Medina, admin y coach
const SITE_PHOTOS = {
  "edwchain@hotmail.com": "https://zardelfitness.com.ar/img/edwards-chacin.jpg",
  [MASTER_EMAIL]: "https://zardelfitness.com.ar/img/ronald-hero.jpg",
};

const clean = (s) => (typeof s === "string" && s.trim() ? s.trim() : null);
const mail = (s) => clean(s)?.toLowerCase() ?? null;
// "ALEJANDRO ISLA" → "Alejandro Isla"; lo que ya viene con mayúsculas y minúsculas queda igual.
const titleCase = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase()) : s);

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const count = { coaches: 0, clientsNew: 0, clientsUpdated: 0, noEmail: 0 };

try {
  await db.query("begin");

  for (const c of coaches) {
    const master = c.nivel === "master";
    await db.query(
      `insert into users (scopes, email, name, phone, title, photo_url, external_id, active)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (email) do update set
         scopes = case when excluded.scopes <@ users.scopes then users.scopes else users.scopes || excluded.scopes end,
         name = case when 'admin' = any(users.scopes) then users.name else excluded.name end,
         phone = coalesce(excluded.phone, users.phone),
         title = excluded.title,
         photo_url = coalesce(users.photo_url, excluded.photo_url),
         external_id = coalesce(users.external_id, excluded.external_id),
         active = excluded.active`,
      [
        [master ? "admin" : "coach"],
        mail(c.email),
        master ? "Ronald Medina" : titleCase(clean(c.nombre)),
        clean(c.telefono),
        clean(c.especialidad),
        SITE_PHOTOS[mail(c.email)] ?? null,
        c.id,
        c.activo !== false,
      ]
    );
    count.coaches++;
  }

  // Todos tienen "profesor": "Zar" (o "Zar, Zar"): su coach es el Zar.
  const { rows } = await db.query("select id from users where email = $1", [MASTER_EMAIL]);
  const zarId = rows[0]?.id ?? null;

  const cols = `scopes, name, email, dni, phone, sex, birth_year, height_cm, body_type, conditions, medications, notes,
                active, client_since, legacy_last_checkin, legacy_last_weight, external_id, coach_id`;
  // El rol no se toca (un coach o un admin que también figura como cliente lo sigue siendo), ni el coach ya asignado.
  const update = `name = excluded.name, dni = excluded.dni, phone = coalesce(excluded.phone, users.phone),
    sex = excluded.sex, birth_year = excluded.birth_year, height_cm = excluded.height_cm, body_type = excluded.body_type,
    conditions = excluded.conditions, medications = excluded.medications, notes = excluded.notes, active = excluded.active,
    client_since = excluded.client_since, legacy_last_checkin = excluded.legacy_last_checkin,
    legacy_last_weight = excluded.legacy_last_weight, external_id = coalesce(users.external_id, excluded.external_id),
    coach_id = coalesce(users.coach_id, excluded.coach_id)`;

  for (const a of clients) {
    const email = mail(a.email);
    if (!email) count.noEmail++;
    const values = [
      ["user"],
      clean(a.nombreCompleto) ?? `${a.nombre} ${a.apellido}`.trim(),
      email,
      clean(a.dni),
      clean(a.telefono),
      a.sexo === "M" || a.sexo === "F" ? a.sexo : null,
      a.edad ? EXPORT_YEAR - a.edad : null,
      a.estaturaCm || null,
      clean(a.estadoFisico),
      Array.isArray(a.patologias) ? a.patologias.map((p) => p.trim()).filter(Boolean) : [],
      clean(a.medicamentos),
      clean(a.observaciones),
      a.activo !== false,
      a.fechaAlta ?? null,
      a.ultimaEvaluacion ?? null,
      a.ultimoPeso ?? null,
      a.id,
      zarId,
    ];
    const { rows: r } = await db.query(
      `insert into users (${cols})
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, coalesce($14::date, (now() at time zone 'America/Argentina/Buenos_Aires')::date), $15, $16, $17, $18)
       on conflict (${email ? "email" : "external_id"}) do update set ${update}
       returning (xmax = 0) as inserted`,
      values
    );
    r[0].inserted ? count.clientsNew++ : count.clientsUpdated++;
  }

  await db.query("commit");
} catch (e) {
  await db.query("rollback");
  throw e;
} finally {
  await db.end();
}

console.log(
  `coaches: ${count.coaches} · clientes nuevos: ${count.clientsNew} · actualizados: ${count.clientsUpdated} · sin correo: ${count.noEmail}`
);
