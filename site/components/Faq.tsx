"use client";

import { useId, useState } from "react";
import { Icon } from "./Icon";
import { faqs, links } from "@/lib/content";
import styles from "./Faq.module.css";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();

  return (
    <section className={`section ${styles.faq}`} id="faq">
      <div className={`container ${styles.grid}`}>
        <header className={styles.head}>
          <p className="eyebrow" data-reveal>
            <span className="num">07</span> Preguntas frecuentes
          </p>
          <h2 className="h2" data-lines>
            <span className="ln">
              <span>¿Dudas?</span>
            </span>
            <span className="ln">
              <span>
                <em className="serif gold-text">Las resolvemos.</em>
              </span>
            </span>
          </h2>
          <p className="section-head__lead" data-reveal>
            ¿No encontrás tu respuesta? Contanos y un profesor te responde a la brevedad.
          </p>
          <div data-reveal style={{ marginTop: 28 }}>
            <a className="btn btn--outline" href={links.waDudas}>
              <Icon name="wa" />
              <span>Preguntar mis dudas</span>
            </a>
          </div>
        </header>

        <div className={styles.list}>
          {faqs.map(([q, a], i) => {
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
