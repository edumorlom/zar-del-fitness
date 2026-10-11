// Bloques de las páginas de cada programa (/entrenamiento-online/, /entrenamiento-presencial/,
// /sistema-general-dirigido/). Los datos salen de db/planes.json vía planInfo() de lib/content.ts.

import { Icon } from "./Icon";
import { planInfo, steps } from "@/lib/content";
import styles from "./PlanBlocks.module.css";

type Plan = ReturnType<typeof planInfo>;

/** Encabezado de sección: chiquito dorado + título en dos líneas, la segunda en cursiva. */
export function SectionHead({ eyebrow, title, accent, lead }: { eyebrow: string; title: string; accent?: string; lead?: string }) {
  return (
    <header className="section-head">
      <p className="eyebrow" data-reveal>
        {eyebrow}
      </p>
      <h2 className="h2 h2--sm" data-lines>
        <span className="ln">
          <span>{title}</span>
        </span>
        {accent && " "}
        {accent && (
          <span className="ln">
            <span>
              <em className="serif gold-text">{accent}</em>
            </span>
          </span>
        )}
      </h2>
      {lead && (
        <p className="section-head__lead" data-reveal>
          {lead}
        </p>
      )}
    </header>
  );
}

/** El precio de un plan con lo que incluye y el botón para inscribirse. */
export function PlanCard({
  plan,
  id,
  cta,
  more,
  featured,
}: {
  plan: Plan;
  id?: string;
  cta: { label: string; href: string };
  more?: { label: string; href: string };
  featured?: boolean;
}) {
  const [main, ...others] = plan.prices;
  return (
    <article className={`${styles.card} ${featured ? styles.featured : ""}`} id={id} data-reveal>
      <p className="tag">{plan.tag}</p>
      <h3 className={styles.cardTitle}>{plan.fullName}</h3>
      <p className={styles.price}>
        {main.text}
        <small>
          {main.currency === "ARS" && "ARS "}
          {plan.period}
        </small>
      </p>
      {others.length > 0 && <p className={styles.alt}>o {others.map((o) => o.text).join(" / ")}</p>}
      <p className={styles.summary}>{plan.summary}</p>
      {plan.highlights.length > 0 && (
        <ul className={styles.checks}>
          {plan.highlights.map((h) => (
            <li key={h}>
              <Icon name="check" />
              {h}
            </li>
          ))}
        </ul>
      )}
      {plan.payment && <p className={styles.payment}>Formas de pago: {plan.payment}</p>}
      <div className={styles.cardCtas}>
        <a className={`btn ${featured ? "btn--gold" : "btn--outline"}`} href={cta.href}>
          <span>{cta.label}</span>
          <Icon name="arrow" />
        </a>
        {more && (
          <a className="link-sm" href={more.href}>
            {more.label}
          </a>
        )}
      </div>
    </article>
  );
}

/** Lo que incluye un plan: título y, si hay, una explicación. */
export function Includes({ items }: { items: { title: string; text?: string }[] }) {
  return (
    <ul className={styles.includes} data-reveal-stagger>
      {items.map((it) => (
        <li key={it.title}>
          <Icon name="check" />
          <div>
            <h3>{it.title}</h3>
            {it.text && <p>{it.text}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Los "detalles" de un plan (condiciones, cómo funciona…): un bloque por título. */
export function Details({ details }: { details: Plan["details"] }) {
  return (
    <div className={styles.details}>
      {details.map((d) => (
        <div key={d.title} className={styles.detail} data-reveal>
          <h3>{d.title}</h3>
          <ul>
            {d.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Los pasos del método (db/textos.json), en una lista numerada. */
export function Steps() {
  return (
    <ol className={styles.steps} data-reveal-stagger>
      {steps.map((s) => (
        <li key={s.n}>
          <span className={styles.stepN}>{s.n}</span>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** Tarjetas de precio lado a lado. */
export function Cards({ children }: { children: React.ReactNode }) {
  return <div className={styles.cards}>{children}</div>;
}
