// Pasa la exportación del portal anterior (zardelfitness.sumar.dev) a un SQLite con las mismas tablas que portal/lib/migrate.ts
// (users y checkins), para revisarlo y después subirlo a Postgres.
//
//   node portal/scripts/sumar-to-sqlite.mjs sumar-export.json alumnos.sqlite [sumar-archivos.json]
//
// sumar-export.json: { activos, bajas, asignaciones, coaches, detalle: { [id]: { alumno, evaluaciones } }, turnos }, armado desde
// el portal anterior (las evaluaciones salen de la página de cada alumno). Los datos no van en el repo: son de salud.
// sumar-archivos.json (opcional): { dietas: { [id de evaluación]: { plan } } }; los archivos que trae van al bucket aparte.
import { readFileSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const [exportPath, outPath, filesPath] = process.argv.slice(2);
if (!exportPath || !outPath) throw new Error("Uso: node portal/scripts/sumar-to-sqlite.mjs sumar-export.json alumnos.sqlite");
const X = JSON.parse(readFileSync(exportPath, "utf8"));
const bundle = filesPath ? JSON.parse(readFileSync(filesPath, "utf8")) : {};
const diets = bundle.dietas ?? {};
// Los archivos ya subidos al bucket (alumnos/<id>/foto.jpg; las HEIC pasaron a JPEG): el portal los sirve en /archivos/.
// Relativa: el portal la sirve en cualquier dominio (mi.zardelfitness.com.ar ya no existe).
const PORTAL = "";
const fileUrl = {};
for (const f of bundle.archivos ?? []) {
  const ext = f.nombre.split(".").pop().toLowerCase().replace(/^(heic|jpeg)$/, "jpg");
  fileUrl[`${f.alumnoId}/${f.tipo}`] = `${PORTAL}/archivos/alumnos/${f.alumnoId}/${f.tipo}.${ext}`;
}

// Hoy en Buenos Aires, "AAAA-MM-DD" (toISOString da el día en UTC, que de 21 a 24 h ya es mañana).
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());

// Igual que import-sumar.mjs.
const EXPORT_YEAR = 2026;
const MASTER_EMAIL = "zardelfitnessgym@gmail.com";
const SITE_PHOTOS = {
  "edwchain@hotmail.com": "https://zardelfitness.com.ar/img/edwards-chacin.jpg",
  [MASTER_EMAIL]: "https://zardelfitness.com.ar/img/ronald-hero.jpg",
};
const PLANS = { premium: "Premium", dirigido: "General Dirigido", online: "Online" }; // → PLANS de portal/lib/clients.ts
const clean = (s) => (typeof s === "string" && s.trim() ? s.trim() : null);
const mail = (s) => clean(s)?.toLowerCase() ?? null;
const titleCase = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase()) : s);
// "20251017150717" → "2025-10-17T15:07:17"
const rawTime = (s) => (/^\d{14}$/.test(s ?? "") ? s.replace(/(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)/, "$1-$2-$3T$4:$5:$6") : null);

rmSync(outPath, { force: true });
const db = new DatabaseSync(outPath);
// Las mismas columnas y reglas que en Postgres. SQLite no tiene arrays: conditions va como JSON ("[...]").
db.exec(`
pragma foreign_keys = on;
create table users (
  id integer primary key,
  role text not null default 'user' check (role in ('admin', 'coach', 'user')),
  email text unique,
  clerk_id text unique,
  name text not null,
  coach_id integer references users(id) on delete set null,
  phone text,
  photo_url text,
  plan text,
  client_since text not null default (date('now', '-3 hours')), -- hoy en Argentina (UTC-3 fijo)
  pass_expires text,
  next_control_at text,
  goal text,
  created_at text not null default current_timestamp,
  external_id text unique,
  dni text,
  sex text check (sex in ('M', 'F')),
  birth_year integer check (birth_year between 1900 and 2100),
  height_cm integer check (height_cm between 80 and 250),
  body_type text,
  conditions text not null default '[]',
  medications text,
  notes text,
  active integer not null default 1,
  title text,
  legacy_last_checkin text,
  legacy_last_weight real,
  certificate_url text
);
create table checkins (
  id integer primary key,
  client_id integer not null references users(id) on delete cascade,
  date text not null,
  weight_kg real not null check (weight_kg between 20 and 400),
  body_fat_pct real not null check (body_fat_pct between 1 and 80),
  created_by integer references users(id) on delete set null,
  created_at text not null default current_timestamp,
  chest_cm real,
  abdomen_cm real,
  biceps_r_cm real,
  biceps_l_cm real,
  leg_r_cm real,
  leg_l_cm real,
  biological_age integer,
  visceral_fat real,
  bmr_kcal integer,
  -- Las trae el portal anterior en parte de las evaluaciones.
  waist_cm real,
  hip_cm real,
  bust_cm real
);
create index checkins_client on checkins(client_id, date);
-- La dieta que se le dio en cada evaluación (en Postgres, la tabla diets de lib/migrate.ts).
create table diets (
  id integer primary key,
  checkin_id integer not null unique references checkins(id) on delete cascade,
  goal text,
  breakfast text,
  morning_snack text,
  lunch text,
  afternoon_snack text,
  dinner text,
  supplements text
);
-- Los turnos de la agenda. Sin el índice único por horario de Postgres: el portal anterior dejaba dos alumnos en el
-- mismo turno, y qué hacer con eso se decide al subir.
create table appointments (
  id integer primary key,
  client_id integer not null references users(id) on delete cascade,
  starts_at text not null,
  ends_at text not null,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled', 'rejected')),
  requested_at text,
  google_event_id text,
  created_by integer references users(id) on delete set null,
  decided_by integer references users(id) on delete set null,
  created_at text not null default current_timestamp
);
`);

// Un coach que también figura como alumno (mismo correo) queda en una sola fila: sigue de coach, con la ficha de alumno.
const insertUser = (row) => {
  const cols = Object.keys(row);
  const merge = cols.filter((c) => c !== "role" && c !== "email").map((c) => `${c} = coalesce(excluded.${c}, users.${c})`);
  return db
    .prepare(`insert into users (${cols}) values (${cols.map(() => "?")}) on conflict (email) do update set ${merge} returning id`)
    .get(...Object.values(row)).id;
};
const coachIds = {}; // id del portal anterior → users.id

db.exec("begin");
for (const c of X.coaches) {
  const master = c.nivel === "master";
  coachIds[c.id] = insertUser({
    role: master ? "admin" : "coach",
    email: mail(c.email),
    name: master ? "Ronald Medina" : titleCase(clean(c.nombre)),
    phone: clean(c.telefono),
    title: clean(c.especialidad),
    photo_url: SITE_PHOTOS[mail(c.email)] ?? null,
    external_id: c.id,
    active: c.activo === false ? 0 : 1,
  });
}

const addCheckin = db.prepare(
  `insert into checkins (client_id, date, weight_kg, body_fat_pct, created_at, chest_cm, abdomen_cm, biceps_r_cm,
     biceps_l_cm, leg_r_cm, leg_l_cm, biological_age, visceral_fat, bmr_kcal, waist_cm, hip_cm, bust_cm)
   values (?, ?, ?, ?, coalesce(?, current_timestamp), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const addDiet = db.prepare(
  `insert into diets (checkin_id, goal, breakfast, morning_snack, lunch, afternoon_snack, dinner, supplements)
   values (?, ?, ?, ?, ?, ?, ?, ?)`
);
let checkins = 0;
let dietCount = 0;
for (const { id } of X.activos) {
  const { alumno: a, evaluaciones = [] } = X.detalle[id] ?? {};
  if (!a) throw new Error(`Falta el detalle del alumno ${id}`);
  const asignacion = X.asignaciones[id] ?? {};
  const birth = a.fechaNacimiento ? +a.fechaNacimiento.slice(0, 4) : a.edad ? EXPORT_YEAR - a.edad : null;
  const userId = insertUser({
    role: "user",
    name: clean(a.nombreCompleto) ?? `${a.nombre} ${a.apellido}`.trim(),
    email: mail(a.email),
    dni: clean(a.dni),
    phone: clean(a.telefono),
    sex: a.sexo === "M" || a.sexo === "F" ? a.sexo : null,
    birth_year: birth,
    height_cm: a.estaturaCm || null,
    body_type: clean(a.estadoFisico),
    conditions: JSON.stringify(Array.isArray(a.patologias) ? a.patologias.map((p) => p.trim()).filter(Boolean) : []),
    medications: clean(a.medicamentos),
    notes: clean(a.observaciones),
    active: a.activo === false ? 0 : 1,
    client_since: a.fechaAlta ?? TODAY,
    // Con el historial completo no hace falta el "último control" suelto; queda sólo si no vino ninguna evaluación.
    legacy_last_checkin: evaluaciones.length ? null : a.ultimaEvaluacion ?? null,
    legacy_last_weight: evaluaciones.length ? null : a.ultimoPeso ?? null,
    external_id: a.id,
    photo_url: fileUrl[`${a.id}/foto`] ?? null,
    certificate_url: fileUrl[`${a.id}/certificado`] ?? null,
    coach_id: coachIds[asignacion.coachId] ?? null,
    plan: PLANS[asignacion.plan] ?? null,
  });
  for (const e of evaluaciones) {
    const { lastInsertRowid } = addCheckin.run(
      userId, e.fecha, e.peso, e.porcentajeGraso, rawTime(e.fechaCruda), e.pecho, e.abdomen, e.bicepDerecho,
      e.bicepIzquierdo, e.piernaDerecha, e.piernaIzquierda, e.edadBiologica, e.grasaVisceral, e.metabolismoBasal,
      e.cintura, e.cadera, e.busto
    );
    checkins++;
    const d = diets[e.id]?.plan;
    if (d) {
      addDiet.run(
        lastInsertRowid, clean(d.objetivo), clean(d.desayuno), clean(d.colacionDesayuno), clean(d.almuerzo),
        clean(d.colacionAlmuerzo), clean(d.cena), clean(d.suplemento)
      );
      dietCount++;
    }
  }
}

// De los dados de baja el portal anterior sólo da nombre, DNI y fechas (la ficha ya no se puede abrir).
for (const b of X.bajas) {
  insertUser({
    role: "user",
    name: clean(b.nombreCompleto),
    dni: clean(b.dni),
    client_since: b.fechaAlta ?? TODAY,
    active: 0,
    notes: b.fechaBaja ? `Dado de baja el ${b.fechaBaja} en el portal anterior.` : null,
    external_id: b.id,
  });
}

// La agenda: fecha y hora de Argentina (UTC−3, sin horario de verano); cada turno dura SLOT_MINUTES (lib/slots.ts).
const SLOT_MS = 30 * 60_000;
const STATUS = { pendiente: "requested", confirmado: "confirmed", cancelado: "cancelled", rechazado: "rejected" };
const at = (fecha, hora) => new Date(`${fecha}T${hora}:00-03:00`);
const addAppointment = db.prepare(
  `insert into appointments (client_id, starts_at, ends_at, status, requested_at, created_at)
   values ((select id from users where external_id = ?), ?, ?, ?, ?, ?)`
);
for (const t of X.turnos ?? []) {
  if (!STATUS[t.estado]) throw new Error(`Estado de turno desconocido: ${t.estado}`);
  const start = at(t.fecha, t.hora);
  addAppointment.run(
    t.alumnoId, start.toISOString(), new Date(start.getTime() + SLOT_MS).toISOString(), STATUS[t.estado],
    t.pedido ? at(t.pedido.fecha, t.pedido.hora).toISOString() : null, t.creadoEn
  );
}
db.exec("commit");

// Control: cada persona y cada evaluación de la exportación quedó una vez, y las referencias cierran.
const count = (sql) => db.prepare(sql).get().n;
const coachEmails = new Set(X.coaches.map((c) => mail(c.email)).filter(Boolean));
const merged = X.activos.filter(({ id }) => coachEmails.has(mail(X.detalle[id].alumno.email))).length;
const expected = X.coaches.length + X.activos.length + X.bajas.length - merged;
const evals = X.activos.reduce((n, { id }) => n + (X.detalle[id].evaluaciones?.length ?? 0), 0);
if (count("select count(*) n from users") !== expected) throw new Error("No cierran las personas");
if (checkins !== evals || count("select count(*) n from checkins") !== evals) throw new Error("No cierran las evaluaciones");
if (dietCount !== Object.keys(diets).length) throw new Error("Hay dietas de evaluaciones que no vinieron");
if (count("select count(*) n from appointments") !== (X.turnos?.length ?? 0)) throw new Error("No cierran los turnos");
if (db.prepare("pragma foreign_key_check").all().length) throw new Error("Hay referencias rotas");

console.log(
  `${outPath}: coaches ${X.coaches.length} · alumnos activos ${X.activos.length} · dados de baja ${X.bajas.length} · ` +
    `evaluaciones ${evals} · dietas ${dietCount} · turnos ${X.turnos?.length ?? 0} · sin correo ${count("select count(*) n from users where email is null")}`
);
