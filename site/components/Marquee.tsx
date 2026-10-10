"use client";

import { Fragment, useRef } from "react";
import { Icon } from "./Icon";
import { useMarquee } from "@/lib/useMarquee";
import styles from "./Marquee.module.css";

type Item = { text: string; outline?: boolean };

function Row({ items, direction, gold }: { items: Item[]; direction: 1 | -1; gold?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useMarquee(ref, `.${styles.track}`, { direction, speed: 2, skew: true });

  // Duplicado dos veces para que el loop sea continuo.
  const content = [0, 1].map((k) => (
    <Fragment key={k}>
      {items.map((item, i) => (
        <Fragment key={i}>
          <span className={item.outline ? styles.outline : undefined}>{item.text}</span>
          <Icon name="spark" className={styles.spark} />
        </Fragment>
      ))}
    </Fragment>
  ));

  return (
    <div className={`${styles.row} ${gold ? styles.gold : ""}`} ref={ref}>
      <div className={styles.track} aria-hidden={true}>
        {content}
        {content}
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    <section className={styles.band} aria-label="Reto de los 25 días · #LosCuerposDelZar · Online y presencial">
      <Row
        direction={-1}
        items={[
          { text: "Reto de los 25 días" },
          { text: "#LosCuerposDelZar", outline: true },
          { text: "Entrenamiento personalizado" },
          { text: "Online & presencial", outline: true },
        ]}
      />
      <Row
        direction={1}
        gold
        items={[
          { text: "The VIP by Zar del Fitness" },
          { text: "Resultados cada 25 días" },
          { text: "Alimentación · Entrenamiento · Acompañamiento" },
        ]}
      />
    </section>
  );
}
