import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelAppointment, requestAppointment } from "~/agenda-actions";
import { Form } from "~/components/Form";
import { Title } from "~/components/Progress";
import { Shell } from "~/components/Shell";
import { requireViewer } from "~/lib/auth";
import { getOpenAppointment } from "~/lib/data";
import { dateOf, longDate, timeOf, todayISO } from "~/lib/format";
import { bookableDays } from "~/lib/slots";
import { availableSlots, HOURS } from "~/lib/turnos";

export const metadata: Metadata = { title: "Pedir turno" };

const DAY = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** El cliente pide su control: elige un día y un horario libre. Lo confirma el Zar o su coach. */
export default async function BookingPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const viewer = await requireViewer();
  if (viewer.role !== "user") redirect("/portal/agenda");
  const sp = await searchParams;
  const open = await getOpenAppointment(viewer.id);

  if (open)
    return (
      <Shell viewer={viewer}>
        <section className="narrow">
          <p className="eyebrow">
            <span className="dot" /> Tu turno
          </p>
          <Title as="h1" plain={open.status === "confirmed" ? "Tu control" : "Tu pedido"} accent={open.status === "confirmed" ? "confirmado" : "de turno"} className="h2" />
          <div className="card turn" data-reveal>
            <span className={open.status === "confirmed" ? "chip chip--gold" : "chip chip--due"}>
              {open.status === "confirmed" ? (open.requested_at ? "Reprogramado" : "Confirmado") : "Esperando confirmación"}
            </span>
            <p className="fact">{longDate(dateOf(open.starts_at))}</p>
            <p className="turn__time">{timeOf(open.starts_at)} h</p>
            {open.requested_at && (
              <p className="muted">
                El Zar lo movió: habías pedido el {longDate(dateOf(open.requested_at)).toLowerCase()} a las {timeOf(open.requested_at)}.
              </p>
            )}
            {open.status === "requested" && <p className="muted">Te va a llegar la invitación de Google Calendar a tu correo cuando esté confirmado.</p>}
            <Form action={cancelAppointment} submit="Cancelar turno" button="btn btn--ghost btn--sm" confirm="¿Cancelar el turno?">
              <input type="hidden" name="id" value={open.id} />
            </Form>
          </div>
          <Link className="back" href="/portal/mi-progreso">
            ← Mi progreso
          </Link>
        </section>
      </Shell>
    );

  const today = todayISO();
  const days = bookableDays(today, HOURS);
  const day = days.includes(sp.dia ?? "") ? sp.dia! : days[0];
  const slots = await availableSlots(day);
  const groups = [
    { label: "Mañana", list: slots.filter((s) => Number(timeOf(s.start).slice(0, 2)) < 13) },
    { label: "Tarde", list: slots.filter((s) => Number(timeOf(s.start).slice(0, 2)) >= 13) },
  ].filter((g) => g.list.length);

  return (
    <Shell viewer={viewer}>
      <section>
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="dot" /> Tu próximo control
            </p>
            <Title as="h1" plain="Pedí tu" accent="turno" className="h2" />
            <p className="sub">Los controles se agendan los viernes, con un máximo de 5 turnos por día. Elegí un horario; lo confirma el Zar y te llega la invitación a tu correo.</p>
          </div>
        </div>

        <nav className="days" aria-label="Día">
          {days.map((d) => (
            <Link key={d} className="days__chip" href={`/portal/turno?dia=${d}`} aria-current={d === day ? "date" : undefined}>
              {DAY.format(new Date(`${d}T12:00:00Z`)).replace(/\./g, "")}
            </Link>
          ))}
        </nav>

        <div className="card form" data-reveal>
          <h2 className="card-title">{longDate(day)}</h2>
          {groups.length === 0 ? (
            <p className="muted">No quedan horarios libres este día: probá con otro.</p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="slots">
                <p className="label">{g.label}</p>
                <div className="slots__grid">
                  {g.list.map((s) => (
                    <Form
                      key={s.start.toISOString()}
                      action={requestAppointment}
                      submit={`${timeOf(s.start)} h`}
                      button="slot"
                      className="inline-form"
                      confirm={`¿Pedir turno el ${longDate(day).toLowerCase()} a las ${timeOf(s.start)} h?`}
                    >
                      <input type="hidden" name="start" value={s.start.toISOString()} />
                    </Form>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </Shell>
  );
}
