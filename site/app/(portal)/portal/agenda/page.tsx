import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelAppointment, confirmAppointment, moveAppointment, rejectAppointment } from "~/agenda-actions";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { ConnectCalendar } from "~/components/ConnectCalendar";
import { Form } from "~/components/Form";
import { requireViewer } from "~/lib/auth";
import { listAppointments, pendingRequests, type Appointment } from "~/lib/data";
import { dateOf, longDate, shortDate, timeOf, todayISO, toLocalInput } from "~/lib/format";
import { CALENDAR_OWNER, CALENDAR_SCOPES, calendarStatus } from "~/lib/google";
import { monthGrid, shiftMonth } from "~/lib/slots";

export const metadata: Metadata = { title: "Agenda" };

const MONTH = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
const WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const first = (name: string) => name.split(/\s+/)[0];

/** Mover un turno: a otro horario libre, y queda confirmado. */
function Move({ a }: { a: Appointment }) {
  return (
    <details className="move">
      <summary className="btn btn--ghost btn--sm">Mover</summary>
      <Form action={moveAppointment} submit="Mover y confirmar" button="btn btn--outline btn--sm" className="move__form">
        <input type="hidden" name="id" value={a.id} />
        <label className="field">
          <span className="field__label">Nuevo horario</span>
          <input name="start" type="datetime-local" step={1800} defaultValue={toLocalInput(a.starts_at)} />
          <span className="field__hint">De lunes a viernes, en el horario del gimnasio, a las y media o en punto.</span>
        </label>
      </Form>
    </details>
  );
}

function Row({ a, pending }: { a: Appointment; pending?: boolean }) {
  return (
    <li className={`appt appt--${a.status}`}>
      <div className="appt__main">
        <span className={`st-dot ${a.status === "requested" ? "st--por-vencer" : "st--gold"}`} aria-hidden="true" />
        <span>
          <Link className="strong" href={`/portal/clientes/${a.client_id}`}>
            {a.client_name}
          </Link>
          <span className="person__sub">
            {pending ? `${longDate(dateOf(a.starts_at))} · ` : ""}
            {timeOf(a.starts_at)} h · {a.status === "requested" ? "Pedido, sin confirmar" : "Confirmado"}
            {a.requested_at && ` · había pedido el ${shortDate(dateOf(a.requested_at))} a las ${timeOf(a.requested_at)}`}
            {a.coach_name && ` · coach: ${a.coach_name}`}
          </span>
        </span>
      </div>
      <div className="appt__actions">
        {a.status === "requested" && (
          <Form action={confirmAppointment} submit="Confirmar" button="btn btn--gold btn--sm" className="inline-form">
            <input type="hidden" name="id" value={a.id} />
          </Form>
        )}
        <Move a={a} />
        {a.status === "requested" ? (
          <Form action={rejectAppointment} submit="Rechazar" button="link-sm" className="inline-form" confirm={`¿Rechazar el pedido de ${a.client_name}?`}>
            <input type="hidden" name="id" value={a.id} />
          </Form>
        ) : (
          <Form action={cancelAppointment} submit="Cancelar" button="link-sm" className="inline-form" confirm={`¿Cancelar el turno de ${a.client_name}? Le llega el aviso.`}>
            <input type="hidden" name="id" value={a.id} />
          </Form>
        )}
      </div>
    </li>
  );
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ mes?: string; dia?: string }> }) {
  const viewer = await requireViewer();
  if (viewer.role === "user") redirect("/portal/turno");
  const sp = await searchParams;
  const today = todayISO();
  const month = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes! : today.slice(0, 7);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(sp.dia ?? "") ? sp.dia! : month === today.slice(0, 7) ? today : `${month}-01`;
  const grid = monthGrid(month);
  const from = new Date(`${grid[0]}T00:00:00-03:00`);
  const to = new Date(new Date(`${grid[41]}T00:00:00-03:00`).getTime() + 86_400_000);
  const [appts, pending, status] = await Promise.all([listAppointments(viewer, from, to), pendingRequests(viewer), calendarStatus()]);
  const byDay = new Map<string, Appointment[]>();
  for (const a of appts) byDay.set(dateOf(a.starts_at), [...(byDay.get(dateOf(a.starts_at)) ?? []), a]);
  const title = MONTH.format(new Date(`${month}-15T12:00:00Z`));
  const href = (m: string, d?: string) => `/portal/agenda?mes=${m}${d ? `&dia=${d}` : ""}`;

  return (
    <AdminShell viewer={viewer}>
      <PageHead title="Agenda" sub="Los turnos de control que piden los clientes desde su panel. Van al Google Calendar del Zar." />

      {status !== "connected" && (
        <div className="card notice notice--row" data-reveal>
          <div>
            <p className="strong">El Google Calendar del Zar no está conectado</p>
            <p className="muted">
              {status === "not-signed-in"
                ? `El Zar tiene que entrar al portal con ${CALENDAR_OWNER} y conectarlo acá. Mientras tanto se ofrece todo el horario del gimnasio y los turnos no van al calendario.`
                : "Falta darle permiso al portal para ver lo ocupado y crear los turnos en su calendario."}
            </p>
          </div>
          {viewer.email === CALENDAR_OWNER && <ConnectCalendar scopes={CALENDAR_SCOPES} />}
        </div>
      )}

      {pending.length > 0 && (
        <section className="card panel-card" data-reveal>
          <h2 className="card-title">
            Pedidos por responder <span className="pill">{pending.length}</span>
          </h2>
          <ul className="appts">
            {pending.map((a) => (
              <Row key={a.id} a={a} pending />
            ))}
          </ul>
        </section>
      )}

      <div className="dash-row">
        <section className="card cal" data-reveal>
          <div className="cal__head">
            <h2 className="card-title">{title[0].toUpperCase() + title.slice(1)}</h2>
            <div className="cal__nav">
              <Link className="btn btn--ghost btn--sm" href={href(today.slice(0, 7), today)}>
                Hoy
              </Link>
              <Link className="icon-btn icon-btn--sm" href={href(shiftMonth(month, -1))} aria-label="Mes anterior">
                ‹
              </Link>
              <Link className="icon-btn icon-btn--sm" href={href(shiftMonth(month, 1))} aria-label="Mes siguiente">
                ›
              </Link>
            </div>
          </div>
          <div className="cal__grid" role="grid" aria-label={title}>
            {WEEK.map((w) => (
              <span key={w} className="cal__wd" role="columnheader">
                {w}
              </span>
            ))}
            {grid.map((d) => {
              const list = byDay.get(d) ?? [];
              return (
                <Link
                  key={d}
                  role="gridcell"
                  href={href(month, d)}
                  className="cal__day"
                  data-out={d.slice(0, 7) !== month}
                  data-today={d === today}
                  aria-current={d === day ? "date" : undefined}
                  aria-label={`${longDate(d)}: ${list.length ? `${list.length} turnos` : "sin turnos"}`}
                >
                  <span className="cal__n">{Number(d.slice(8))}</span>
                  {list.slice(0, 2).map((a) => (
                    <span key={a.id} className={`cal__item cal__item--${a.status}`}>
                      <span className="mono">{timeOf(a.starts_at)}</span> {first(a.client_name)}
                    </span>
                  ))}
                  {list.length > 2 && <span className="cal__more">+{list.length - 2} más</span>}
                  {list.length > 0 && <span className="cal__dots" aria-hidden="true">{list.map((a) => <span key={a.id} className={`cal__dot cal__dot--${a.status}`} />)}</span>}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="card panel-card" data-reveal>
          <h2 className="card-title">{longDate(day)}</h2>
          {(byDay.get(day) ?? []).length === 0 ? (
            <p className="muted">Sin turnos este día.</p>
          ) : (
            <ul className="appts">
              {(byDay.get(day) ?? []).map((a) => (
                <Row key={a.id} a={a} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
