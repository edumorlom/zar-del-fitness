import { deleteCheckin } from "~/actions";
import Link from "next/link";
import type { Appointment, Checkin, Client } from "~/lib/data";
import { dateOf, days, daysUntil, longDate, monthYear, num, shortDate, timeOf, todayISO } from "~/lib/format";
import { Evolution } from "./Evolution";
import { Form } from "./Form";
import { initials } from "./Shell";
import { ScrollTable } from "./ScrollTable";
import { pick, type Lang } from "@/lib/i18n";

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
// Lo que lee el propio cliente (`you`) va en su idioma; lo que ve sólo el equipo, en castellano.
function win(checkins: Checkin[], you: boolean, lang: Lang) {
  const n = (v: number) => num(v, 1, lang);
  if (checkins.length < 2) return null;
  const first = checkins[0];
  const last = checkins[checkins.length - 1];
  const fatDrop = first.body_fat_pct - last.body_fat_pct;
  const leanGain = lean(last) - lean(first);
  if (lang === "en") {
    if (fatDrop >= 0.5 && leanGain >= 0.5)
      return {
        title: "Body recomposition!",
        text: <>Since you started, you&apos;ve lost <b>{n(fatDrop)} points</b> of body fat and gained <b>{n(leanGain)} kg</b> of lean mass. That&apos;s how it&apos;s done.</>,
      };
    if (fatDrop >= 0.5) return { title: "Losing fat!", text: <>Since you started, you&apos;ve lost <b>{n(fatDrop)} points</b> of body fat.</> };
    if (leanGain >= 0.5) return { title: "Building muscle!", text: <>Since you started, you&apos;ve gained <b>{n(leanGain)} kg</b> of lean mass.</> };
    return null;
  }
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

function nextControl(at: Date | null, you: boolean, lang: Lang) {
  const tr = pick(lang);
  if (!at) return { fact: tr("A coordinar", "To be scheduled"), note: you ? tr("Lo arreglás con tu coach.", "Set it up with your coach.") : "Sin fecha todavía.", warn: false };
  const n = daysUntil(dateOf(at));
  const d = (k: number) => days(k, lang);
  const note =
    n === 0 ? tr("Hoy", "Today") : n === 1 ? tr("Mañana", "Tomorrow") : n > 0 ? tr(`En ${d(n)}`, `In ${d(n)}`) : tr(`Fue hace ${d(-n)}`, `${d(-n)} ago`);
  return { fact: longDate(dateOf(at), lang), note: `${note} · ${timeOf(at)} h`, warn: n < 0 };
}

function pass(expires: string | null, lang: Lang) {
  if (!expires) return null;
  const tr = pick(lang);
  const n = daysUntil(expires);
  const d = (k: number) => days(k, lang);
  const note = n > 0 ? tr(`Quedan ${d(n)}`, `${d(n)} left`) : n === 0 ? tr("Vence hoy", "Expires today") : tr(`Venció hace ${d(-n)}`, `Expired ${d(-n)} ago`);
  const on = shortDate(expires).slice(0, 5);
  return { fact: n < 0 ? tr(`Venció el ${on}`, `Expired on ${on}`) : tr(`Vence el ${on}`, `Expires on ${on}`), note, warn: n <= 3 };
}

/** El saludo, los datos del plan y el coach. `you`: lo ve el propio cliente (le habla de vos, en su idioma). */
export function Hero({ client, checkins, you, appointment, lang = "es" }: { client: Client; checkins: Checkin[]; you: boolean; appointment?: Appointment | null; lang?: Lang }) {
  const tr = pick(lang);
  const [firstName, ...rest] = client.name.split(/\s+/);
  const w = win(checkins, you, lang);
  const control = nextControl(appointment?.starts_at ?? client.next_control_at, you, lang);
  if (appointment?.status === "requested") control.note = `${timeOf(appointment.starts_at)} h · ${tr("esperando confirmación", "awaiting confirmation")}`;
  else if (appointment?.requested_at) control.note += tr(" · reprogramado", " · rescheduled");
  const p = pass(client.pass_expires, lang);

  return (
    <div className="hero-grid">
      <div className="card hello">
        <p className="eyebrow intro">
          <span className="dot" /> {longDate(todayISO(), lang)}
        </p>
        <h1 className="h2 intro-lines">
          <span className="ln">
            <span>{you ? tr("Hola,", "Hi,") : firstName}</span>
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
            {you ? tr("Entrenando con nosotros desde", "Training with us since") : `${client.email} · cliente desde`} {monthYear(client.client_since, lang)}
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
            <dt className="label">{you ? tr("Tu objetivo", "Your goal") : "Objetivo"}</dt>
            <dd className="fact">{client.goal ?? (you ? tr("Lo definís con tu coach", "You'll set it with your coach") : "Sin definir")}</dd>
          </div>
          <div>
            <dt className="label">{you ? tr("Tu próximo control", "Your next check-in") : "Próximo control"}</dt>
            <dd className="fact">{control.fact}</dd>
            <dd className={control.warn ? "note note--warn" : "note"}>{control.note}</dd>
            {you && (
              <dd>
                <Link className="link-arrow" href="/portal/turno">
                  {appointment ? tr("Ver tu turno", "See your booking") : tr("Pedí tu turno", "Book your check-in")}
                </Link>
              </dd>
            )}
          </div>
          {p && (
            <div>
              <dt className="label">{you ? tr("Tu pase", "Your pass") : "Pase"}</dt>
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
                <span className="num">{you ? tr("Tu coach", "Your coach") : "Coach"}</span>
              </p>
              <p className="coach__name">{client.coach_name}</p>
              <p className="muted">Personal trainer · Zar del Fitness</p>
              {client.coach_phone && (
                <a className="btn btn--ghost btn--sm" href={`https://wa.me/${client.coach_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener">
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <use href="#i-wa" />
                  </svg>
                  {tr("Escribile por WhatsApp", "Message on WhatsApp")}
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="coach__body coach__body--empty">
            <p className="eyebrow">
              <span className="num">{you ? tr("Tu coach", "Your coach") : "Coach"}</span>
            </p>
            <p className="muted">{you ? tr("Todavía no tenés coach asignado.", "You don't have a coach assigned yet.") : "Sin coach asignado."}</p>
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
      <polyline points={pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ")} />
      <path className="spark__dot" d={`M${x} ${y.toFixed(1)}h0`} />
    </svg>
  );
}

const STATS = [
  { label: "Peso", en: "Weight", unit: "kg", of: (c: Checkin) => c.weight_kg, better: 0, delta: "kg" },
  { label: "% Graso", en: "Body fat %", unit: "%", of: (c: Checkin) => c.body_fat_pct, better: -1, delta: "puntos" },
  { label: "Masa magra", en: "Lean mass", unit: "kg", of: lean, better: 1, delta: "kg" },
  { label: "Grasa", en: "Fat", unit: "kg", of: fat, better: -1, delta: "kg" },
];

/** El último control, la composición corporal y el historial. `manage`: lo ve el coach o el admin (puede borrar). */
export function Results({ checkins, you, manage, number = "01", lang = "es" }: { checkins: Checkin[]; you: boolean; manage: boolean; number?: string; lang?: Lang }) {
  const tr = pick(lang);
  const n = (v: number) => num(v, 1, lang);
  const last = checkins[checkins.length - 1];
  const prev = checkins[checkins.length - 2];

  if (!last)
    return (
      <section>
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{number}</span> {tr("Resultados", "Results")}
            </p>
            <Title plain={you ? tr("Tus", "Your") : "Sus"} accent={tr("controles", "check-ins")} />
          </div>
        </div>
        <div className="card empty" data-reveal>
          <p className="fact">{tr("Todavía no hay controles", "No check-ins yet")}</p>
          <p className="muted">
            {you
              ? tr("Tu coach los carga después de cada medición: acá vas a ver cómo cambia tu cuerpo.", "Your coach adds them after each measurement: this is where you'll see how your body changes.")
              : "Cargá el primero con el formulario de arriba."}
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
              <span className="num">{number}</span> {tr("Resultados", "Results")}
            </p>
            <Title plain={you ? tr("Tu último", "Your latest") : "Último"} accent={tr("control", "check-in")} />
            <p className="sub">
              {longDate(last.date, lang)} {prev ? tr("· comparado con el anterior", "· compared with the previous one") : tr("· el primero", "· your first")}
            </p>
          </div>
          <a className="btn btn--outline btn--sm" href="#controles">
            {you ? tr("Ver todos mis controles", "See all my check-ins") : "Ver todos los controles"}
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
                <p className="label">{tr(s.label, s.en)}</p>
                <p className="stat__val">
                  <span data-count={value.toFixed(1)} data-format="decimal">
                    {n(value)}
                  </span>
                  <small>{s.unit}</small>
                </p>
                <p className={good ? "delta delta--good" : "delta"}>
                  {d === null
                    ? tr("Primer control", "First check-in")
                    : flat
                      ? tr("= Sin cambios", "= No change")
                      : `${d > 0 ? "↑" : "↓"} ${n(Math.abs(d))} ${s.delta === "puntos" ? tr("puntos", "points") : s.delta}`}
                </p>
                <Spark values={checkins.map(s.of)} />
              </div>
            );
          })}
        </div>

        <div className="card comp" data-reveal>
          <div className="comp__head">
            <p className="label">{tr("Composición corporal", "Body composition")}</p>
            <span className="muted">{n(last.weight_kg)} {tr("kg en total", "kg total")}</span>
          </div>
          <div className="bar" aria-hidden="true">
            <span className="bar__lean" style={{ width: `${leanPct}%` }} />
            <span className="bar__fat" style={{ width: `${last.body_fat_pct}%` }} />
          </div>
          <div className="legend">
            <p>
              <span className="sw sw--lean" />
              <span className="muted">{tr("Masa magra", "Lean mass")}</span>
              <br />
              <b>{n(lean(last))} kg</b> <span className="muted">· {n(leanPct)} %</span>
            </p>
            <p>
              <span className="sw sw--fat" />
              <span className="muted">{tr("Grasa", "Fat")}</span>
              <br />
              <b>{n(fat(last))} kg</b> <span className="muted">· {n(last.body_fat_pct)} %</span>
            </p>
          </div>
        </div>

        {/* La tendencia necesita al menos dos controles */}
        {prev && (
          <Evolution
            you={you}
            lang={lang}
            points={checkins.map((c) => ({ date: c.date, weight: c.weight_kg, fatPct: c.body_fat_pct, lean: lean(c), fatKg: fat(c) }))}
          />
        )}
      </section>

      <section id="controles">
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{String(Number(number) + 1).padStart(2, "0")}</span> {tr("Historial", "History")}
            </p>
            <Title plain={you ? tr("Todos tus", "All your") : "Todos sus"} accent={tr("controles", "check-ins")} />
          </div>
          {you && (
            <a className="btn btn--outline btn--sm" href="/portal/mi-progreso/evaluaciones">
              {tr("Ver todas mis medidas", "See all my measurements")}
              <ArrowIcon />
            </a>
          )}
        </div>
        <ScrollTable>
          <table className="table table--pin">
            <thead>
              <tr>
                <th scope="col">{tr("Fecha", "Date")}</th>
                {STATS.map((s) => (
                  <th key={s.label} scope="col">
                    {tr(s.label, s.en)}
                  </th>
                ))}
                {manage && <th scope="col"><span className="sr-only">Borrar</span></th>}
              </tr>
            </thead>
            <tbody>
              {[...checkins].reverse().map((c, i) => (
                <tr key={c.id} className={i === 0 ? "is-latest" : undefined}>
                  <td className="strong">{shortDate(c.date)}</td>
                  <td>{n(c.weight_kg)} kg</td>
                  <td>{n(c.body_fat_pct)} %</td>
                  <td>{n(lean(c))} kg</td>
                  <td>{n(fat(c))} kg</td>
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
        </ScrollTable>
      </section>
    </>
  );
}
