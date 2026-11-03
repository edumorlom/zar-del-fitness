import { db } from "./db";

// Las tablas. Corre al arrancar el servidor (instrumentation.ts): sólo crea lo que falta, nunca borra.
// El ingreso lo maneja Clerk: acá no hay contraseñas, sólo el id de Clerk de cada cuenta (se enlaza por correo).
const SCHEMA = `
-- Antes las columnas decían "member" (socio): las bases creadas con esos nombres se renombran a "client".
do $$ begin
  if exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'member_since') then
    alter table users rename column member_since to client_since;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'checkins' and column_name = 'member_id') then
    alter table checkins rename column member_id to client_id;
  end if;
end $$;
drop index if exists checkins_member;

create table if not exists users (
  id serial primary key,
  role text not null default 'user' check (role in ('admin', 'coach', 'user')),
  email text unique,
  clerk_id text unique,
  name text not null,
  coach_id int references users(id) on delete set null,
  phone text,
  photo_url text,
  plan text,
  client_since date not null default current_date,
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
alter table users alter column email drop not null;
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
`;

export async function migrate() {
  await db.query(SCHEMA);

  // El primer admin: el correo de ADMIN_EMAIL (variable de Railway), si todavía no hay ninguno. Entra con Google o con
  // el código que le manda Clerk a ese correo.
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (email) {
    await db.query(
      `insert into users (role, email, name)
       select 'admin', $1, 'Admin' where not exists (select 1 from users where role = 'admin')
       on conflict (email) do nothing`,
      [email]
    );
  }
}
