import { db } from "./db";

// Las tablas. Corre al arrancar el servidor (instrumentation.ts): sólo crea lo que falta, nunca borra.
// El ingreso lo maneja Clerk: acá no hay contraseñas, sólo el id de Clerk de cada cuenta (se enlaza por correo).

/**
 * Las columnas con una lista de valores (las de portal/lib/consent.ts, payments.ts y turnos.ts). `create table if not
 * exists` no cambia el check de una tabla que ya estaba: si cambia una lista, fixCheck lo cambia en la base (a una
 * base creada con db91f6c, siete minutos antes de 'transferencia', le faltaba ese valor).
 */
const CHECKS = {
  "consents.kind": ["terminos", "transferencia", "salud", "huella", "imagen", "marketing"],
  "consents.source": ["portal", "equipo"],
  "appointments.status": ["requested", "confirmed", "cancelled", "rejected"],
  "payments.method": ["mercadopago", "cash", "card"],
  "payments.status": ["pending", "approved", "cancelled"],
};
type Checked = keyof typeof CHECKS;
const quoted = (col: Checked) => CHECKS[col].map((v) => `'${v}'`).join(", ");
const check = (col: Checked) => `check (${col.split(".")[1]} in (${quoted(col)}))`;

/** Saca los checks de la columna que no aceptan alguno de sus valores y, si no le queda ninguno, le pone el de ahora. */
function fixCheck(col: Checked) {
  const [table, column] = col.split(".");
  const ofColumn = `conrelid = '${table}'::regclass and contype = 'c'
    and conkey = array[(select attnum from pg_attribute where attrelid = '${table}'::regclass and attname = '${column}')]`;
  return `
do $$ declare c record; begin
  for c in select conname, pg_get_constraintdef(oid) as def from pg_constraint where ${ofColumn} loop
    if exists (select 1 from unnest(array[${quoted(col)}]) v where c.def not like '%''' || v || '''%') then
      execute format('alter table ${table} drop constraint %I', c.conname);
    end if;
  end loop;
  if not exists (select 1 from pg_constraint where ${ofColumn}) then
    alter table ${table} add constraint ${table}_${column}_check ${check(col)};
  end if;
end $$;`;
}

const SCHEMA = `
create table if not exists users (
  id serial primary key,
  -- Una cuenta puede tener varios scopes (portal/lib/access.ts).
  scopes text[] not null default '{user}' check (scopes <> '{}' and scopes <@ array['admin', 'coach', 'user', 'receptionist']),
  email text unique,
  clerk_id text unique,
  name text not null,
  coach_id int references users(id) on delete set null,
  phone text,
  photo_url text,
  plan text,
  client_since date not null default (now() at time zone 'America/Argentina/Buenos_Aires')::date,
  pass_expires date,
  next_control_at timestamptz,
  goal text,
  created_at timestamptz not null default now()
);

create table if not exists checkins (
  id serial primary key,
  client_id int not null references users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5, 1) not null check (weight_kg between 20 and 400),
  body_fat_pct numeric(4, 1) not null check (body_fat_pct between 1 and 80),
  created_by int references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists checkins_client on checkins(client_id, date);

-- La ficha del cliente (importada del portal anterior o cargada por el admin). Lo de salud lo ve sólo el equipo.
alter table users add column if not exists external_id text unique;
alter table users add column if not exists dni text;
alter table users add column if not exists sex text check (sex in ('M', 'F'));
alter table users add column if not exists birth_year int check (birth_year between 1900 and 2100);
alter table users add column if not exists height_cm int check (height_cm between 80 and 250);
alter table users add column if not exists body_type text;
alter table users add column if not exists conditions text[] not null default '{}';
alter table users add column if not exists medications text;
alter table users add column if not exists notes text;
alter table users add column if not exists active boolean not null default true;
alter table users add column if not exists title text;
-- Del portal anterior sólo vino la fecha y el peso de la última evaluación, sin el resto: hasta el próximo control.
alter table users add column if not exists legacy_last_checkin date;
alter table users add column if not exists legacy_last_weight numeric(5, 1);
-- El certificado médico, en el bucket (/archivos/...): lo ve el cliente y quien lo maneja.
alter table users add column if not exists certificate_url text;

-- Lo demás de una evaluación, todo opcional: perímetros (cm) y lo que da la balanza.
alter table checkins add column if not exists chest_cm numeric(5, 1);
alter table checkins add column if not exists abdomen_cm numeric(5, 1);
alter table checkins add column if not exists biceps_r_cm numeric(5, 1);
alter table checkins add column if not exists biceps_l_cm numeric(5, 1);
alter table checkins add column if not exists leg_r_cm numeric(5, 1);
alter table checkins add column if not exists leg_l_cm numeric(5, 1);
alter table checkins add column if not exists biological_age int;
alter table checkins add column if not exists visceral_fat numeric(4, 1);
alter table checkins add column if not exists bmr_kcal int;
alter table checkins add column if not exists waist_cm numeric(5, 1);
alter table checkins add column if not exists hip_cm numeric(5, 1);
alter table checkins add column if not exists bust_cm numeric(5, 1);

-- El plan de alimentación que se le da en una evaluación (como en el portal anterior). Lo ven el cliente y quien lo maneja.
create table if not exists diets (
  id serial primary key,
  checkin_id int not null unique references checkins(id) on delete cascade,
  goal text,
  breakfast text,
  morning_snack text,
  lunch text,
  afternoon_snack text,
  dinner text,
  supplements text
);

-- Los turnos de control, en el calendario de Google del Zar. El cliente pide (requested); el admin o su coach confirma,
-- mueve o rechaza. requested_at: lo que había pedido, si se lo movieron.
create table if not exists appointments (
  id serial primary key,
  client_id int not null references users(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'requested' ${check("appointments.status")},
  requested_at timestamptz,
  google_event_id text,
  created_by int references users(id) on delete set null,
  decided_by int references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists appointments_time on appointments(starts_at);
-- Un solo calendario: dos turnos vivos no pueden empezar a la misma hora.
create unique index if not exists appointments_slot on appointments(starts_at) where status in ('requested', 'confirmed');

-- Las fotos de progreso del cliente, en el bucket (/archivos/alumnos/<external_id>/progreso/<uuid>.jpg). Las suben su
-- coach o el admin; las ven él, su coach y el admin.
create table if not exists progress_photos (
  id serial primary key,
  client_id int not null references users(id) on delete cascade,
  key text not null unique,
  taken_on date not null default (now() at time zone 'America/Argentina/Buenos_Aires')::date,
  uploaded_by int references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists progress_photos_client on progress_photos(client_id, taken_on);

-- Los pagos del pase (por ahora, sólo Premium: portal/lib/payments.ts). Con Mercado Pago lo paga el cliente desde el
-- portal: la fila queda 'pending' hasta que Mercado Pago lo aprueba (mp_status: lo último que dijo). En efectivo o con
-- tarjeta en el local lo carga el admin o recepción, ya aprobado. Cada pago aprobado extiende el pase un mes:
-- pass_before y pass_after son el vencimiento antes y después, para poder anularlo.
create table if not exists payments (
  id serial primary key,
  client_id int not null references users(id) on delete cascade,
  method text not null ${check("payments.method")},
  status text not null default 'pending' ${check("payments.status")},
  plan text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'ARS',
  pass_before date,
  pass_after date,
  note text,
  mp_preference_id text,
  mp_payment_id text unique,
  mp_status text,
  created_by int references users(id) on delete set null,
  cancelled_by int references users(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
create index if not exists payments_client on payments(client_id, created_at);
create index if not exists payments_approved on payments(approved_at) where status = 'approved';

-- La plantilla del correo masivo (Broadcast, sólo el admin): una sola fila, la última que se mandó.
create table if not exists broadcast_template (
  id int primary key default 1 check (id = 1),
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

-- Los consentimientos de cada cliente (portal/lib/consent.ts, Ley 25.326): qué aceptó o retiró, de qué versión de los
-- términos y la privacidad (db/legal/), y si lo marcó en el portal o lo cargó el equipo. Una fila por cambio, nunca se
-- cambia ni se borra (salvo con la cuenta): vale la última de cada tipo.
create table if not exists consents (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  kind text not null ${check("consents.kind")},
  granted boolean not null,
  version text not null,
  source text not null default 'portal' ${check("consents.source")},
  recorded_by int references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists consents_user on consents(user_id, kind, created_at desc);
${(Object.keys(CHECKS) as Checked[]).map(fixCheck).join("\n")}

-- El día que se le mandó al cliente el último recordatorio de evaluación (portal/lib/reminders.ts): uno por evaluación.
alter table users add column if not exists evaluation_reminder_on date;
`;

export async function migrate() {
  await db.query(SCHEMA);

  // El primer admin: el correo de ADMIN_EMAIL (variable de Railway), si todavía no hay ninguno. Entra con Google o con
  // el código que le manda Clerk a ese correo.
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (email) {
    await db.query(
      `insert into users (scopes, email, name)
       select '{admin}'::text[], $1, 'Admin' where not exists (select 1 from users where 'admin' = any(scopes))
       on conflict (email) do nothing`,
      [email]
    );
  }
}
