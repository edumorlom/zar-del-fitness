import { Icon } from "./Icon";
import { Lines } from "./Lines";
import { NowMarker, OpenStatus, type StatusProps } from "./OpenStatus";
import { content } from "@/lib/content";
import { fill, type Lang } from "@/lib/i18n";
import styles from "./Visit.module.css";

export function Visit({ lang }: { lang: Lang }) {
  const { t, contact, links, schedule } = content(lang);
  const v = t.visita;
  const { from, to } = schedule.range;
  const pct = (h: number) => `${((h - from) / (to - from)) * 100}%`;
  const ticks = Array.from({ length: Math.ceil((to - from) / 2) }, (_, i) => from + i * 2);
  const status: StatusProps = {
    timeZone: schedule.timeZone,
    days: schedule.days,
    slots: schedule.slots.map(({ from, to, opens, lastEntry }) => ({ from, to, opens, lastEntry })),
    range: schedule.range,
    text: {
      open: v.abierto,
      opensToday: v.abreHoy,
      closed: fill(v.cerrado, { dias: schedule.daysText, hora: schedule.slots[0].opens }),
      now: v.ahora,
      schedule: `${schedule.daysLabel} · ${schedule.slotsText}`,
    },
  };

  return (
    <section className={`section ${styles.visit}`}>
      <div className={`container ${styles.grid}`}>
        <div>
          <p className="eyebrow" data-reveal>
            {v.antetitulo}
          </p>
          <h2 className="h2 h2--sm" data-lines>
            <Lines lines={[`${schedule.daysLabel},`, `*${v.acento}*`]} />
          </h2>

          <div data-reveal>
            <OpenStatus {...status} />
          </div>

          <div className={styles.timeline} data-reveal>
            <div className={styles.bar} role="img" aria-label={fill(v.franjas, {
                franjas: schedule.slots.map((s) => fill(v.franja, { desde: s.opens, hasta: s.closes })).join(` ${t.horario.y} `),
              })}>
              {schedule.slots.map((s, i) => (
                <span
                  key={s.label}
                  className={styles.slot}
                  style={{ left: pct(s.from), width: `calc(${pct(s.to)} - ${pct(s.from)})`, animationDelay: `${0.3 + i * 0.2}s` }}
                >
                  <em>{s.label}</em>
                </span>
              ))}
              <NowMarker {...status} />
            </div>
            <div className={styles.ticks} aria-hidden="true">
              {ticks.map((t) => (
                <span key={t} style={{ left: pct(t) }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <ul className={styles.list} data-reveal-stagger>
            <li>
              <Icon name="clock" />
              <div>
                <strong>{fill(v.clases, { duracion: schedule.classLength })}</strong>
                <span>{fill(v.ultimoIngreso, { horas: schedule.lastEntries })}</span>
              </div>
            </li>
            <li>
              <Icon name="pin" />
              <div>
                <strong>{contact.gym}</strong>
                <span>
                  {contact.address}. {v.cerca}
                </span>
              </div>
            </li>
          </ul>

          <div className={styles.ctas} data-reveal>
            <a className="btn btn--gold" href={links.waPresencial} data-magnetic>
              <Icon name="wa" />
              <span>{v.boton}</span>
            </a>
            <a className="link-arrow" href={links.directions}>
              {v.comoLlegar} <Icon name="arrow-ur" />
            </a>
          </div>
        </div>

        <div className={styles.map} data-reveal-img>
          <iframe
            title={fill(v.mapa, { lugar: `${contact.gym}, ${contact.address}` })}
            src={links.mapEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className={styles.pin} aria-hidden="true">
            <Icon name="pin" className="" />
          </div>
        </div>
      </div>
    </section>
  );
}
