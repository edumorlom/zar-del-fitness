"use client";

import { useRef } from "react";
import { Icon } from "./Icon";
import { gsap, useGSAP } from "@/lib/gsap";
import { steps } from "@/lib/content";
import styles from "./Method.module.css";

export function Method() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const day = root.current!.querySelector<HTMLElement>("[data-day]")!;

      // Desktop: la sección se fija y los pasos avanzan en horizontal; el contador va del día 1 al 25.
      mm.add("(min-width: 960px) and (prefers-reduced-motion: no-preference)", () => {
        const track = root.current!.querySelector<HTMLElement>(`.${styles.track}`)!;
        const distance = () => track.scrollWidth - window.innerWidth;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${distance()}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              day.textContent = String(Math.round(1 + self.progress * 24)).padStart(2, "0");
            },
          },
        });
        tl.to(track, { x: () => -distance() }, 0).fromTo(`.${styles.bar}`, { scaleX: 0 }, { scaleX: 1 }, 0);

        // Cada tarjeta se "enciende" al pasar por el centro
        gsap.utils.toArray<HTMLElement>(`.${styles.step}`).forEach((step) => {
          gsap.from(step.querySelector(`.${styles.num}`), {
            yPercent: 60,
            opacity: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: step,
              containerAnimation: tl,
              start: "left 85%",
              end: "left 45%",
              scrub: true,
            },
          });
        });
      });

      // Mobile: lista vertical que entra escalonada
      mm.add("(max-width: 959px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(`.${styles.step}`).forEach((step) => {
          gsap.from(step, {
            opacity: 0,
            y: 50,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 88%" },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section className={styles.method} id="metodo" ref={root}>
      <div className={styles.pin}>
        <div className={`container ${styles.head}`}>
          <div>
            <p className="eyebrow">
              <span className="num">03</span> Cómo funciona
            </p>
            <h2 className="h2" data-lines>
              <span className="ln">
                <span>25 días.</span>
              </span>
              <span className="ln">
                <span>
                  <em className="serif gold-text">Un antes y un después.</em>
                </span>
              </span>
            </h2>
          </div>
          <div className={styles.day} aria-hidden="true">
            <span className={styles.dayLabel}>Día</span>
            <span className={styles.dayNum} data-day>
              01
            </span>
          </div>
        </div>

        <div className={styles.track}>
          {steps.map((s, i) => {
            const final = i === steps.length - 1;
            return (
              <article key={s.n} className={`${styles.step} ${final ? styles.final : ""}`}>
                <span className={styles.num}>{s.n}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
                {final && (
                  <a className="btn btn--outline" href="#programas" style={{ alignSelf: "flex-start" }}>
                    <span>Quiero mi plan</span>
                    <Icon name="arrow" />
                  </a>
                )}
              </article>
            );
          })}
        </div>

        <div className={`container ${styles.progress}`} aria-hidden="true">
          <i className={styles.bar} />
          <span>Día 01</span>
          <span>Día 25</span>
        </div>
      </div>
    </section>
  );
}
