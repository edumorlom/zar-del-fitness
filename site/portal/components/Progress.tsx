// Mi progreso (app/(portal)/portal/mi-progreso): lo que ve el cliente de sí mismo, en su idioma y hablándole de vos.
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { payWithMercadoPago } from "~/payment-actions";
import { BODY_STATS, bodyPoint, fatMass, leanMass } from "~/lib/clients";
import type { Appointment, Checkin, Client } from "~/lib/data";
import { dateOf, days, daysUntil, longDate, monthYear, num, shortDate, timeOf, todayISO } from "~/lib/format";
import { Empty } from "./Cards";
import { Evolution } from "./Evolution";
import { Form } from "./Form";
import { initials } from "./Person";
import { ScrollTable } from "./ScrollTable";
import { Title } from "./Title";
import { content } from "@/lib/content";
import { pick, type Lang } from "@/lib/i18n";

/** Lo que logró desde el primer control, si hay algo para festejar. */
function win(checkins: Checkin[], lang: Lang) {
  const n = (v: number) => num(v, 1, lang);
  if (checkins.length < 2) return null;
  const first = checkins[0];
  const last = checkins[checkins.length - 1];
  const fatDrop = first.body_fat_pct - last.body_fat_pct;
  const leanGain = leanMass(last) - leanMass(first);
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
  if (fatDrop >= 0.5 && leanGain >= 0.5)
    return {
      title: "¡Recomposición corporal!",
      text: (
        <>
          Desde que empezaste bajaste <b>{num(fatDrop)} puntos</b> de grasa y sumaste <b>{num(leanGain)} kg</b> de masa magra. Así se hace.
        </>
      ),
    };
  if (fatDrop >= 0.5) return { title: "¡Bajando grasa!", text: <>Desde que empezaste bajaste <b>{num(fatDrop)} puntos</b> de grasa.</> };
  if (leanGain >= 0.5) return { title: "¡Sumando músculo!", text: <>Desde que empezaste sumaste <b>{num(leanGain)} kg</b> de masa magra.</> };
  return null;
}

function nextControl(at: Date | null, lang: Lang) {
  const tr = pick(lang);
  if (!at) return { fact: tr("A coordinar", "To be scheduled"), note: tr("Lo arreglás con tu coach.", "Set it up with your coach."), warn: false };
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

/**
 * El botón de Mercado Pago del pase: `amount`, el precio ya escrito; `processing`, si tiene un pago en proceso; `early`,
 * si el pase todavía no está por vencer (pagar es adelantar un mes).
 */
export type PayOffer = { amount: string; processing: boolean; early: boolean };

/** El saludo, los datos del plan y el coach. `pay`: puede pagar el pase con Mercado Pago (mi-progreso decide si su plan se paga desde el portal). */
export function Hero({ client, checkins, appointment, pay, lang }: { client: Client; checkins: Checkin[]; appointment: Appointment | null; pay: PayOffer | null; lang: Lang }) {
  const tr = pick(lang);
  const firstName = client.name.split(/\s+/)[0];
  const w = win(checkins, lang);
  const control = nextControl(appointment?.starts_at ?? client.next_control_at, lang);
  if (appointment?.status === "requested") control.note = `${timeOf(appointment.starts_at)} h · ${tr("esperando confirmación", "awaiting confirmation")}`;
  else if (appointment?.requested_at) control.note += tr(" · reprogramado", " · rescheduled");
  const p = pass(client.pass_expires, lang);

  return (
    <div className="hero-grid">
      <div className="card hello">
        <p className="eyebrow intro">
          <span className="dot" /> {longDate(todayISO(), lang)}
        </p>
        <Title as="h1" className="h2" intro plain={tr("Hola,", "Hi,")} accent={firstName} />
        <div className="meta intro">
          {client.plan && <span className="pill">★ {client.plan}</span>}
          <span>
            {tr("Entrenando con nosotros desde", "Training with us since")} {monthYear(client.client_since, lang)}
          </span>
        </div>

        {w && (
          <div className="win intro">
            <span className="win__icon" aria-hidden="true">
              <Icon name="trophy" />
            </span>
            <div>
              <h2>{w.title}</h2>
              <p>{w.text}</p>
            </div>
          </div>
        )}

        <dl className="facts intro">
          <div>
            <dt className="label">{tr("Tu objetivo", "Your goal")}</dt>
            <dd className="fact">{client.goal ?? tr("Lo definís con tu coach", "You'll set it with your coach")}</dd>
          </div>
          <div>
            <dt className="label">{tr("Tu próximo control", "Your next check-in")}</dt>
            <dd className="fact">{control.fact}</dd>
            <dd className={control.warn ? "note note--warn" : "note"}>{control.note}</dd>
            <dd>
              <Link className="link-arrow" href="/portal/turno">
                {appointment ? tr("Ver tu turno", "See your booking") : tr("Pedí tu turno", "Book your check-in")}
              </Link>
            </dd>
          </div>
          {(p || pay) && (
            <div>
              <dt className="label">{tr("Tu pase", "Your pass")}</dt>
              <dd className="fact">{p?.fact ?? tr("Sin vencimiento", "No expiry date yet")}</dd>
              {p && <dd className={p.warn ? "note note--warn" : "note"}>{p.note}</dd>}
              {pay && (
                <dd className="pay">
                  {pay.processing && (
                    <p className="note">
                      {tr(
                        "Tenés un pago con Mercado Pago en proceso: cuando se apruebe, el pase se extiende solo.",
                        "You have a Mercado Pago payment in process: once it's approved, your pass is extended automatically."
                      )}
                    </p>
                  )}
                  {/* Antes de pagar, a la vista: los términos (art. 1107 del CCyC). */}
                  <p className="note note--legal">
                    {tr("Al pagar aceptás los ", "By paying you accept the ")}
                    <a href={content(lang).pages.terminos}>{content(lang).t.legal.terminos}</a>
                    {tr(". Sin débitos automáticos.", ". No automatic debits.")}
                  </p>
                  <Form action={payWithMercadoPago} submit={tr(`Pagar ${pay.amount}`, `Pay ${pay.amount}`)} button="btn btn--gold btn--sm" className="inline-form" />
                  <p className="note">
                    {pay.early
                      ? tr("Si pagás antes, el mes se suma a tu vencimiento: no perdés días.", "Paying early adds the month to your current expiry: you don't lose any days.")
                      : tr("Se extiende un mes apenas se aprueba.", "It's extended one month as soon as it's approved.")}
                  </p>
                </dd>
              )}
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
                <span className="num">{tr("Tu coach", "Your coach")}</span>
              </p>
              <p className="coach__name">{client.coach_name}</p>
              <p className="muted">Personal trainer · Zar del Fitness</p>
              {client.coach_phone && (
                <a className="btn btn--ghost btn--sm" href={`https://wa.me/${client.coach_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener">
                  <Icon name="wa" />
                  {tr("Escribile por WhatsApp", "Message on WhatsApp")}
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="coach__body coach__body--empty">
            <p className="eyebrow">
              <span className="num">{tr("Tu coach", "Your coach")}</span>
            </p>
            <p className="muted">{tr("Todavía no tenés coach asignado.", "You don't have a coach assigned yet.")}</p>
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

/** El último control, la composición corporal, la evolución y el historial. Las secciones van numeradas desde `number`. */
export function Results({ checkins, number = "01", lang }: { checkins: Checkin[]; number?: string; lang: Lang }) {
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
            <Title plain={tr("Tus", "Your")} accent={tr("controles", "check-ins")} />
          </div>
        </div>
        <Empty
          reveal
          title={tr("Todavía no hay controles", "No check-ins yet")}
          text={tr("Tu coach los carga después de cada medición: acá vas a ver cómo cambia tu cuerpo.", "Your coach adds them after each measurement: this is where you'll see how your body changes.")}
        />
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
            <Title plain={tr("Tu último", "Your latest")} accent={tr("control", "check-in")} />
            <p className="sub">
              {longDate(last.date, lang)} {prev ? tr("· comparado con el anterior", "· compared with the previous one") : tr("· el primero", "· your first")}
            </p>
          </div>
          <a className="btn btn--outline btn--sm" href="#controles">
            {tr("Ver todos mis controles", "See all my check-ins")}
            <Icon name="arrow" />
          </a>
        </div>

        <div className="stats" data-reveal-stagger>
          {BODY_STATS.map((s) => {
            const value = s.of(last);
            const d = prev ? value - s.of(prev) : null;
            const flat = d !== null && Math.abs(d) < 0.05;
            const good = d !== null && !flat && s.better !== 0 && Math.sign(d) === s.better;
            return (
              <div className="card stat" key={s.key}>
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
              <b>{n(leanMass(last))} kg</b> <span className="muted">· {n(leanPct)} %</span>
            </p>
            <p>
              <span className="sw sw--fat" />
              <span className="muted">{tr("Grasa", "Fat")}</span>
              <br />
              <b>{n(fatMass(last))} kg</b> <span className="muted">· {n(last.body_fat_pct)} %</span>
            </p>
          </div>
        </div>

        {/* La tendencia necesita al menos dos controles */}
        {prev && <Evolution you lang={lang} points={checkins.map(bodyPoint)} />}
      </section>

      <section id="controles">
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{String(Number(number) + 1).padStart(2, "0")}</span> {tr("Historial", "History")}
            </p>
            <Title plain={tr("Todos tus", "All your")} accent={tr("controles", "check-ins")} />
          </div>
          <a className="btn btn--outline btn--sm" href="/portal/mi-progreso/evaluaciones">
            {tr("Ver todas mis medidas", "See all my measurements")}
            <Icon name="arrow" />
          </a>
        </div>
        <ScrollTable>
          <table className="table table--pin">
            <thead>
              <tr>
                <th scope="col">{tr("Fecha", "Date")}</th>
                {BODY_STATS.map((s) => (
                  <th key={s.key} scope="col">
                    {tr(s.label, s.en)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {checkins.toReversed().map((c, i) => (
                <tr key={c.id} className={i === 0 ? "is-latest" : undefined}>
                  <td className="strong">{shortDate(c.date)}</td>
                  {BODY_STATS.map((s) => (
                    <td key={s.key}>
                      {n(s.of(c))} {s.unit}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </section>
    </>
  );
}
