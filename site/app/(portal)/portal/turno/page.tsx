import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelAppointment, requestAppointment } from "~/agenda-actions";
import { Form } from "~/components/Form";
import { Title } from "~/components/Progress";
import { Shell } from "~/components/Shell";
import { homeOf, isTeam } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { getOpenAppointment } from "~/lib/data";
import { dateOf, longDate, timeOf, todayISO } from "~/lib/format";
import { bookableDays } from "~/lib/slots";
import { availableSlots, HOURS } from "~/lib/turnos";
import { getLang } from "~/lib/lang";
import { locales, pick } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({ title: pick(await getLang())("Pedir turno", "Book a check-in") });

/** El cliente pide su control: elige un día y un horario libre. Lo confirma el Zar o su coach. */
export default async function BookingPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("user")) redirect(isTeam(viewer) ? "/portal/agenda" : homeOf(viewer));
  const sp = await searchParams;
  const open = await getOpenAppointment(viewer.id);
  const lang = await getLang();
  const tr = pick(lang);
  const DAY = new Intl.DateTimeFormat(locales[lang].intl, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  // En castellano, la fecha dentro de una frase va en minúscula ("el lunes 9"); en inglés, igual que sola.
  const inline = (d: string) => (lang === "en" ? longDate(d, lang) : longDate(d).toLowerCase());

  if (open)
    return (
      <Shell viewer={viewer}>
        <section className="narrow">
          <p className="eyebrow">
            <span className="dot" /> {tr("Tu turno", "Your booking")}
          </p>
          <Title
            as="h1"
            plain={open.status === "confirmed" ? tr("Tu control", "Your check-in is") : tr("Tu pedido", "Your booking")}
            accent={open.status === "confirmed" ? tr("confirmado", "confirmed") : tr("de turno", "request")}
            className="h2"
          />
          <div className="card turn" data-reveal>
            <span className={open.status === "confirmed" ? "chip chip--gold" : "chip chip--due"}>
              {open.status === "confirmed"
                ? open.requested_at
                  ? tr("Reprogramado", "Rescheduled")
                  : tr("Confirmado", "Confirmed")
                : tr("Esperando confirmación", "Awaiting confirmation")}
            </span>
            <p className="fact">{longDate(dateOf(open.starts_at), lang)}</p>
            <p className="turn__time">{timeOf(open.starts_at)} h</p>
            {open.requested_at && (
              <p className="muted">
                {tr(
                  `El Zar lo movió: habías pedido el ${inline(dateOf(open.requested_at))} a las ${timeOf(open.requested_at)}.`,
                  `The Zar moved it: you had asked for ${inline(dateOf(open.requested_at))} at ${timeOf(open.requested_at)}.`
                )}
              </p>
            )}
            {open.status === "requested" && (
              <p className="muted">
                {tr(
                  "Te va a llegar la invitación de Google Calendar a tu correo cuando esté confirmado.",
                  "You'll get the Google Calendar invite by email once it's confirmed."
                )}
              </p>
            )}
            <Form
              action={cancelAppointment}
              submit={tr("Cancelar turno", "Cancel booking")}
              button="btn btn--ghost btn--sm"
              confirm={tr("¿Cancelar el turno?", "Cancel this booking?")}
            >
              <input type="hidden" name="id" value={open.id} />
            </Form>
          </div>
          <Link className="back" href="/portal/mi-progreso">
            ← {tr("Mi progreso", "My progress")}
          </Link>
        </section>
      </Shell>
    );

  const today = todayISO();
  const days = bookableDays(today, HOURS);
  const day = days.includes(sp.dia ?? "") ? sp.dia! : days[0];
  const slots = await availableSlots(day);
  const groups = [
    { label: tr("Mañana", "Morning"), list: slots.filter((s) => Number(timeOf(s.start).slice(0, 2)) < 13) },
    { label: tr("Tarde", "Afternoon"), list: slots.filter((s) => Number(timeOf(s.start).slice(0, 2)) >= 13) },
  ].filter((g) => g.list.length);

  return (
    <Shell viewer={viewer}>
      <section>
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="dot" /> {tr("Tu próximo control", "Your next check-in")}
            </p>
            <Title as="h1" plain={tr("Pedí tu", "Book your")} accent={tr("turno", "check-in")} className="h2" />
            <p className="sub">
              {tr(
                "Los controles se agendan los viernes, con un máximo de 5 turnos por día. Elegí un horario; lo confirma el Zar y te llega la invitación a tu correo.",
                "Check-ins are booked on Fridays, with up to 5 per day. Pick a time; the Zar confirms it and you get the invite by email."
              )}
            </p>
          </div>
        </div>

        <nav className="days" aria-label={tr("Día", "Day")}>
          {days.map((d) => (
            <Link key={d} className="days__chip" href={`/portal/turno?dia=${d}`} aria-current={d === day ? "date" : undefined}>
              {DAY.format(new Date(`${d}T12:00:00Z`)).replace(/\./g, "")}
            </Link>
          ))}
        </nav>

        <div className="card form" data-reveal>
          <h2 className="card-title">{longDate(day, lang)}</h2>
          {groups.length === 0 ? (
            <p className="muted">{tr("No quedan horarios libres este día: probá con otro.", "No free times left on this day: try another one.")}</p>
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
                      confirm={tr(`¿Pedir turno el ${inline(day)} a las ${timeOf(s.start)} h?`, `Book ${inline(day)} at ${timeOf(s.start)}?`)}
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
