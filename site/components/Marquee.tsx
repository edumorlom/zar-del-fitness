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

/** Los textos de db/textos.json (cinta), ya en el idioma de la página. En la fila de arriba, uno sí y uno no van calados. */
export function Marquee({ label, top, bottom }: { label: string; top: string[]; bottom: string[] }) {
  return (
    <section className={styles.band} aria-label={label}>
      <Row direction={-1} items={top.map((text, i) => ({ text, outline: i % 2 === 1 }))} />
      <Row direction={1} gold items={bottom.map((text) => ({ text }))} />
    </section>
  );
}
