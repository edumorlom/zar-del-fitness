"use client";

import { useId, useState } from "react";
import { Icon } from "./Icon";
import { Lines } from "./Lines";
import type { Content } from "@/lib/content";
import styles from "./Faq.module.css";

/** Los textos de db/textos.json (preguntas) y las preguntas de db/preguntas.json, ya en el idioma de la página. */
export function Faq({ t, faqs, askHref }: { t: Content["t"]["preguntas"]; faqs: Content["faqs"]; askHref: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();

  return (
    <section className={`section ${styles.faq}`} id="faq">
      <div className={`container ${styles.grid}`}>
        <header className={styles.head}>
          <p className="eyebrow" data-reveal>
            <span className="num">07</span> {t.antetitulo}
          </p>
          <h2 className="h2" data-lines>
            <Lines lines={t.titulo} />
          </h2>
          <p className="section-head__lead" data-reveal>
            {t.introduccion}
          </p>
          <div data-reveal style={{ marginTop: 28 }}>
            <a className="btn btn--outline" href={askHref}>
              <Icon name="wa" />
              <span>{t.boton}</span>
            </a>
          </div>
        </header>

        <div className={styles.list}>
          {faqs.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <div key={q} className={styles.item} data-open={isOpen} data-reveal>
                <button
                  type="button"
                  className={styles.q}
                  aria-expanded={isOpen}
                  aria-controls={`${id}-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{q}</span>
                  <span className={styles.icon}>
                    <Icon name="plus" className="" />
                  </span>
                </button>
                <div className={styles.a} id={`${id}-${i}`} role="region">
                  <div>
                    <p>{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
