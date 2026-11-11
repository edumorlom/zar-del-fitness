// Avisa por Resend a los alumnos que su cuenta en el portal nuevo ya está creada y cómo ingresar.
//
//   node --env-file=.env.local portal/scripts/email-cuenta-lista.mjs                        ensayo: lista a quiénes les llegaría, no manda nada
//   node --env-file=.env.local portal/scripts/email-cuenta-lista.mjs --prueba=a@x.com,b@x.com   manda sólo a esas direcciones, sin mirar la base
//   node --env-file=.env.local portal/scripts/email-cuenta-lista.mjs --enviar               manda a todos los alumnos activos
//
// DATABASE_URL tiene que ser la de producción (la del proxy de Railway, con ?sslmode=no-verify): la de .env.local es la de
// desarrollo. Pasada en el comando, le gana al archivo. Pide RESEND_API_KEY para mandar.
// Se puede correr de nuevo sin repetir: quien ya lo recibió queda en email-cuenta-lista.enviados.txt (no va al repo: son
// correos de personas). shortcut: si la red se corta justo durante un envío, a esa persona le puede llegar dos veces.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import pg from "pg";

const FROM = "Zar del Fitness <no-reply@zardelfitness.com.ar>";
const SUBJECT = "Tu cuenta de Zar del Fitness ya está lista";
const DIR = new URL("./email-cuenta-lista/", import.meta.url);
const LOG = new URL("./email-cuenta-lista.enviados.txt", import.meta.url);
const VALID_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PAUSE_MS = 150; // Resend acepta hasta 10 pedidos por segundo

const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Reparte los alumnos: a quiénes les llega (una vez por correo) y por qué quedan afuera los demás. */
export function pick(rows, sent) {
  const to = new Map();
  const out = { inactive: 0, noEmail: 0, already: 0 };
  for (const r of rows) {
    if (!r.active) out.inactive++;
    else if (!VALID_EMAIL.test(r.email ?? "")) out.noEmail++;
    else if (sent.has(r.email)) out.already++;
    else to.set(r.email, r);
  }
  return { to: [...to.values()], ...out };
}

/** El correo de una persona: "Hola, Juan." y su dirección, escapados porque vienen de la base. */
export function render(html, { name, email }) {
  const first = name.trim().split(/\s+/)[0];
  const nice = first === first.toUpperCase() ? first.slice(0, 1) + first.slice(1).toLowerCase() : first;
  return html
    .replaceAll("{{saludo}}", () => (nice ? `Hola, ${esc(nice)}.` : "Hola."))
    .replaceAll("{{email}}", () => esc(email));
}

/** Manda de a uno. Una dirección rechazada no frena al resto; la clave, el dominio o el cupo sí, para no fallar cientos de veces. */
export async function sendAll(people, post, onSent, wait = sleep) {
  const rejected = [];
  let sent = 0;
  for (const person of people) {
    let r = await post(person);
    for (let tries = 0; r.name === "rate_limit_exceeded" && tries < 5; tries++) {
      await wait(r.retryAfter * 1000);
      r = await post(person);
    }
    if (r.ok) {
      sent++;
      onSent(person);
    } else if (r.status === 422) rejected.push(`${person.email}: ${r.message}`);
    else return { sent, rejected, stopped: `${r.status} ${r.name}: ${r.message}` };
    await wait(PAUSE_MS);
  }
  return { sent, rejected, stopped: null };
}

async function students() {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const { rows } = await db.query("select name, lower(btrim(email)) as email, active from users where 'user' = any(scopes) order by id");
  await db.end();
  const sent = new Set(existsSync(LOG) ? readFileSync(LOG, "utf8").split("\n") : []);
  const { to, inactive, noEmail, already } = pick(rows, sent);
  console.log(`${rows.length} alumnos. Reciben: ${to.length}. Dados de baja: ${inactive}. Sin correo válido: ${noEmail}. Ya lo recibieron: ${already}.`);
  return to;
}

if (import.meta.main) {
  const flag = process.argv.find((a) => a.startsWith("--prueba="));
  const test = flag?.slice("--prueba=".length).split(",").map((e) => e.trim().toLowerCase());
  const real = process.argv.includes("--enviar");
  if (test && real) throw new Error("Usá --prueba o --enviar, no los dos.");
  if (test?.some((e) => !VALID_EMAIL.test(e))) throw new Error("--prueba tiene una dirección que no es válida.");

  const people = test ? test.map((email) => ({ name: "Prueba", email })) : await students();
  if (!test && !real) {
    for (const p of people) console.log(p.email);
    console.log("Ensayo: no se mandó nada. Para mandarlo, agregá --enviar.");
  } else {
    if (!process.env.RESEND_API_KEY) throw new Error("Falta RESEND_API_KEY.");
    const html = readFileSync(new URL("correo.html", DIR), "utf8");
    // Encabezado y botón son imágenes porque Gmail y Outlook recolorean el HTML en modo oscuro, pero no las imágenes.
    // Las clases gl/gs/gd/nc de correo.html mantienen el negro en Gmail para iPhone: sólo sirven para texto blanco o gris.
    // Viajan en el correo para no depender de un deploy del sitio.
    const attachments = ["hero.jpg", "boton.png"].map((filename) => ({
      filename,
      content: readFileSync(new URL(filename, DIR)).toString("base64"),
      content_id: filename.split(".")[0],
    }));
    const post = async (person) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [person.email], subject: SUBJECT, html: render(html, person), attachments }),
      });
      const body = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, name: body.name, message: body.message, retryAfter: Number(res.headers.get("retry-after")) || 1 };
    };
    const { sent, rejected, stopped } = await sendAll(people, post, (p) => {
      if (real) appendFileSync(LOG, `${p.email}\n`);
    });
    console.log(`Enviados: ${sent} de ${people.length}.`);
    for (const r of rejected) console.warn(`Rechazado: ${r}`);
    if (stopped) {
      console.error(`Se frenó el envío (${stopped}). Corregilo y corré lo mismo: no se repite a quien ya lo recibió.`);
      process.exitCode = 1;
    }
  }
}
