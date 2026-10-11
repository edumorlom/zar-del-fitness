import { Icon } from "./Icon";
import { NowMarker, OpenStatus } from "./OpenStatus";
import { contact, links, schedule } from "@/lib/content";
import styles from "./Visit.module.css";

const { from, to } = schedule.range;
const pct = (h: number) => `${((h - from) / (to - from)) * 100}%`;
const ticks = Array.from({ length: Math.ceil((to - from) / 2) }, (_, i) => from + i * 2);

export function Visit() {
  return (
    <section className={`section ${styles.visit}`}>
      <div className={`container ${styles.grid}`}>
        <div>
          <p className="eyebrow" data-reveal>
            Horarios y ubicación
          </p>
          <h2 className="h2 h2--sm" data-lines>
            <span className="ln">
              <span>{schedule.daysLabel},</span>
            </span>
            <span className="ln">
              <span>
                <em className="serif gold-text">a tu medida.</em>
              </span>
            </span>
          </h2>

          <div data-reveal>
            <OpenStatus />
          </div>

          <div className={styles.timeline} data-reveal>
            <div className={styles.bar} role="img" aria-label={`Franjas horarias: ${schedule.slots.map((s) => `de ${s.opens} a ${s.closes}`).join(" y ")}`}>
              {schedule.slots.map((s, i) => (
                <span
                  key={s.label}
                  className={styles.slot}
                  style={{ left: pct(s.from), width: `calc(${pct(s.to)} - ${pct(s.from)})`, animationDelay: `${0.3 + i * 0.2}s` }}
                >
                  <em>{s.label}</em>
                </span>
              ))}
              <NowMarker />
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
                <strong>Clases de ~{schedule.classLength}</strong>
                <span>Último ingreso {schedule.lastEntries}.</span>
              </div>
            </li>
            <li>
              <Icon name="pin" />
              <div>
                <strong>{contact.gym}</strong>
                <span>{contact.address}</span>
              </div>
            </li>
          </ul>

          <div className={styles.ctas} data-reveal>
            <a className="btn btn--gold" href={links.waPresencial} data-magnetic>
              <Icon name="wa" />
              <span>Reservá tu evaluación</span>
            </a>
            <a className="link-arrow" href={links.directions}>
              Cómo llegar <Icon name="arrow-ur" />
            </a>
          </div>
        </div>

        <div className={styles.map} data-reveal-img>
          <iframe
            title={`Mapa: ${contact.gym}, ${contact.address}`}
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
