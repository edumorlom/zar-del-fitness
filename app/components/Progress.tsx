import { deleteCheckin } from "~/app/actions";
import Link from "next/link";
import type { Appointment, Checkin, Client } from "~/lib/data";
import { dateOf, days, daysUntil, longDate, monthYear, num, shortDate, timeOf, todayISO } from "~/lib/format";
import { Evolution } from "./Evolution";
import { Form } from "./Form";
import { initials } from "./Shell";

const lean = (c: Checkin) => c.weight_kg * (1 - c.body_fat_pct / 100);
const fat = (c: Checkin) => (c.weight_kg * c.body_fat_pct) / 100;

const ArrowIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** Un título en dos líneas que entran animadas, la segunda en cursiva dorada (como Lines del sitio). */
export function Title({ plain, accent, as: Tag = "h2", className = "h2 h2--sm" }: { plain: string; accent?: string; as?: "h1" | "h2"; className?: string }) {
  return (
    <Tag className={className} data-lines>
      <span className="ln">
        <span>{plain}</span>
      </span>{" "}
      {accent && (
        <span className="ln">
          <span>
            <em className="serif gold-text">{accent}</em>
          </span>
        </span>
      )}
    </Tag>
  );
}

/** Lo que logró desde el primer control, si hay algo para festejar. */
function win(checkins: Checkin[], you: boolean) {
  if (checkins.length < 2) return null;
  const first = checkins[0];
  const last = checkins[checkins.length - 1];
  const fatDrop = first.body_fat_pct - last.body_fat_pct;
  const leanGain = lean(last) - lean(first);
  const since = you ? "Desde que empezaste" : "Desde el primer control";
  const [bajo, sumo] = you ? ["bajaste", "sumaste"] : ["bajó", "sumó"];
  if (fatDrop >= 0.5 && leanGain >= 0.5)
    return {
      title: "¡Recomposición corporal!",
      text: (
        <>
          {since} {bajo} <b>{num(fatDrop)} puntos</b> de grasa y {sumo} <b>{num(leanGain)} kg</b> de masa magra.{" "}
          {you && "Así se hace."}
        </>
      ),
    };
  if (fatDrop >= 0.5)
    return { title: "¡Bajando grasa!", text: <>{since} {bajo} <b>{num(fatDrop)} puntos</b> de grasa.</> };
  if (leanGain >= 0.5)
    return { title: "¡Sumando músculo!", text: <>{since} {sumo} <b>{num(leanGain)} kg</b> de masa magra.</> };
  return null;
}

function nextControl(at: Date | null, you: boolean) {
  if (!at) return { fact: "A coordinar", note: you ? "Lo arreglás con tu coach." : "Sin fecha todavía.", warn: false };
  const n = daysUntil(dateOf(at));
  const note = n === 0 ? "Hoy" : n === 1 ? "Mañana" : n > 0 ? `En ${days(n)}` : `Fue hace ${days(-n)}`;
  return { fact: longDate(dateOf(at)), note: `${note} · ${timeOf(at)} h`, warn: n < 0 };
}

function pass(expires: string | null) {
  if (!expires) return null;
  const n = daysUntil(expires);
  const note = n > 0 ? `Quedan ${days(n)}` : n === 0 ? "Vence hoy" : `Venció hace ${days(-n)}`;
  return { fact: `${n < 0 ? "Venció" : "Vence"} el ${shortDate(expires).slice(0, 5)}`, note, warn: n <= 3 };
}

/** El saludo, los datos del plan y el coach. `you`: lo ve el propio cliente (le habla de vos). */
export function Hero({ client, checkins, you, appointment }: { client: Client; checkins: Checkin[]; you: boolean; appointment?: Appointment | null }) {
  const [firstName, ...rest] = client.name.split(/\s+/);
  const w = win(checkins, you);
  const control = nextControl(appointment?.starts_at ?? client.next_control_at, you);
  if (appointment?.status === "requested") control.note = `${timeOf(appointment.starts_at)} h · esperando confirmación`;
  else if (appointment?.requested_at) control.note += " · reprogramado";
  const p = pass(client.pass_expires);

  return (
    <div className="hero-grid">
      <div className="card hello">
        <p className="eyebrow intro">
          <span className="dot" /> {longDate(todayISO())}
        </p>
        <h1 className="h2 intro-lines">
          <span className="ln">
            <span>{you ? "Hola," : firstName}</span>
          </span>{" "}
          <span className="ln">
            <span>
              <em className="serif gold-text">{you ? firstName : rest.join(" ")}</em>
            </span>
          </span>
        </h1>
        <div className="meta intro">
          {client.plan && <span className="pill">★ {client.plan}</span>}
          <span>
            {you ? "Entrenando con nosotros" : `${client.email} · cliente`} desde {monthYear(client.client_since)}
          </span>
        </div>

        {w && (
          <div className="win intro">
            <span className="win__icon" aria-hidden="true">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
              </svg>
            </span>
            <div>
              <h2>{w.title}</h2>
              <p>{w.text}</p>
            </div>
          </div>
        )}

        <dl className="facts intro">
          <div>
            <dt className="label">{you ? "Tu objetivo" : "Objetivo"}</dt>
            <dd className="fact">{client.goal ?? (you ? "Lo definís con tu coach" : "Sin definir")}</dd>
          </div>
          <div>
            <dt className="label">{you ? "Tu próximo control" : "Próximo control"}</dt>
            <dd className="fact">{control.fact}</dd>
            <dd className={control.warn ? "note note--warn" : "note"}>{control.note}</dd>
            {you && (
              <dd>
                <Link className="link-arrow" href="/turno">
                  {appointment ? "Ver tu turno" : "Pedí tu turno"}
                </Link>
              </dd>
            )}
          </div>
          {p && (
            <div>
              <dt className="label">{you ? "Tu pase" : "Pase"}</dt>
              <dd className="fact">{p.fact}</dd>
              <dd className={p.warn ? "note note--warn" : "note"}>{p.note}</dd>
            </div>
          )}
        </dl>
      </div>

      <aside className="card coach intro">
        {client.coach_name ? (
          <>
            <div className="coach__img">
              {client.coach_photo ? (
                <img src={client.coach_photo} alt={client.coach_name} />
              ) : (
                <span className="coach__mono" aria-hidden="true">
                  {initials(client.coach_name)}
                </span>
              )}
            </div>
            <div className="coach__body">
              <p className="eyebrow">
                <span className="num">{you ? "Tu coach" : "Coach"}</span>
              </p>
              <p className="coach__name">{client.coach_name}</p>
              <p className="muted">Personal trainer · Zar del Fitness</p>
              {client.coach_phone && (
                <a className="btn btn--ghost btn--sm" href={`https://wa.me/${client.coach_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener">
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <use href="#i-wa" />
                  </svg>
                  Escribile por WhatsApp
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="coach__body coach__body--empty">
            <p className="eyebrow">
              <span className="num">{you ? "Tu coach" : "Coach"}</span>
            </p>
            <p className="muted">{you ? "Todavía no tenés coach asignado." : "Sin coach asignado."}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

/** Mini gráfico de la serie, de izquierda (el primero) a derecha (el último). */
function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pts = values.map((v, i) => [(i * 120) / (values.length - 1), 37 - ((v - min) / span) * 34]);
  const [x, y] = pts[pts.length - 1];
  return (
    <svg className="spark" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline pathLength={1} points={pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ")} />
      <path className="spark__dot" d={`M${x} ${y.toFixed(1)}h0`} />
    </svg>
  );
}

const STATS = [
  { label: "Peso", unit: "kg", of: (c: Checkin) => c.weight_kg, better: 0, delta: "kg" },
  { label: "% Graso", unit: "%", of: (c: Checkin) => c.body_fat_pct, better: -1, delta: "puntos" },
  { label: "Masa magra", unit: "kg", of: lean, better: 1, delta: "kg" },
  { label: "Grasa", unit: "kg", of: fat, better: -1, delta: "kg" },
];

/** El último control, la composición corporal y el historial. `manage`: lo ve el coach o el admin (puede borrar). */
export function Results({ checkins, you, manage, number = "01" }: { checkins: Checkin[]; you: boolean; manage: boolean; number?: string }) {
  const last = checkins[checkins.length - 1];
  const prev = checkins[checkins.length - 2];

  if (!last)
    return (
      <section>
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{number}</span> Resultados
            </p>
            <Title plain={you ? "Tus" : "Sus"} accent="controles" />
          </div>
        </div>
        <div className="card empty" data-reveal>
          <p className="fact">Todavía no hay controles</p>
          <p className="muted">
            {you ? "Tu coach los carga después de cada medición: acá vas a ver cómo cambia tu cuerpo." : "Cargá el primero con el formulario de arriba."}
          </p>
        </div>
      </section>
    );

  const leanPct = 100 - last.body_fat_pct;
  return (
    <>
      <section>
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{number}</span> Resultados
            </p>
            <Title plain={you ? "Tu último" : "Último"} accent="control" />
            <p className="sub">
              {longDate(last.date)} {prev ? "· comparado con el anterior" : "· el primero"}
            </p>
          </div>
          <a className="btn btn--outline btn--sm" href="#controles">
            {you ? "Ver todos mis controles" : "Ver todos los controles"}
            <ArrowIcon />
          </a>
        </div>

        <div className="stats" data-reveal-stagger>
          {STATS.map((s) => {
            const value = s.of(last);
            const d = prev ? value - s.of(prev) : null;
            const flat = d !== null && Math.abs(d) < 0.05;
            const good = d !== null && !flat && s.better !== 0 && Math.sign(d) === s.better;
            return (
              <div className="card stat" key={s.label}>
                <p className="label">{s.label}</p>
                <p className="stat__val">
                  <span data-count={value.toFixed(1)} data-format="decimal">
                    {num(value)}
                  </span>
                  <small>{s.unit}</small>
                </p>
                <p className={good ? "delta delta--good" : "delta"}>
                  {d === null ? "Primer control" : flat ? "= Sin cambios" : `${d > 0 ? "↑" : "↓"} ${num(Math.abs(d))} ${s.delta}`}
                </p>
                <Spark values={checkins.map(s.of)} />
              </div>
            );
          })}
        </div>

        <div className="card comp" data-reveal>
          <div className="comp__head">
            <p className="label">Composición corporal</p>
            <span className="muted">{num(last.weight_kg)} kg en total</span>
          </div>
          <div className="bar" aria-hidden="true">
            <span className="bar__lean" style={{ width: `${leanPct}%` }} />
            <span className="bar__fat" style={{ width: `${last.body_fat_pct}%` }} />
          </div>
          <div className="legend">
            <p>
              <span className="sw sw--lean" />
              <span className="muted">Masa magra</span>
              <br />
              <b>{num(lean(last))} kg</b> <span className="muted">· {num(leanPct)} %</span>
            </p>
            <p>
              <span className="sw sw--fat" />
              <span className="muted">Grasa</span>
              <br />
              <b>{num(fat(last))} kg</b> <span className="muted">· {num(last.body_fat_pct)} %</span>
            </p>
          </div>
        </div>

        {/* La tendencia necesita al menos dos controles */}
        {prev && (
          <Evolution
            you={you}
            points={checkins.map((c) => ({ date: c.date, weight: c.weight_kg, fatPct: c.body_fat_pct, lean: lean(c), fatKg: fat(c) }))}
          />
        )}
      </section>

      <section id="controles">
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{String(Number(number) + 1).padStart(2, "0")}</span> Historial
            </p>
            <Title plain={you ? "Todos tus" : "Todos sus"} accent="controles" />
          </div>
        </div>
        <div className="card table-wrap" data-reveal>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Peso</th>
                <th scope="col">% Graso</th>
                <th scope="col">Masa magra</th>
                <th scope="col">Grasa</th>
                {manage && <th scope="col"><span className="sr-only">Borrar</span></th>}
              </tr>
            </thead>
            <tbody>
              {[...checkins].reverse().map((c, i) => (
                <tr key={c.id} className={i === 0 ? "is-latest" : undefined}>
                  <td className="strong">{shortDate(c.date)}</td>
                  <td>{num(c.weight_kg)} kg</td>
                  <td>{num(c.body_fat_pct)} %</td>
                  <td>{num(lean(c))} kg</td>
                  <td>{num(fat(c))} kg</td>
                  {manage && (
                    <td className="right">
                      <Form action={deleteCheckin} submit="Borrar" button="link-sm" confirm={`¿Borrar el control del ${shortDate(c.date)}?`}>
                        <input type="hidden" name="id" value={c.id} />
                      </Form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
