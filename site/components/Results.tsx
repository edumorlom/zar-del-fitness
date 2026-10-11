"use client";

import { useRef } from "react";
import Image from "next/image";
import { Icon } from "./Icon";
import { useMarquee } from "@/lib/useMarquee";
import { links, transformations, type Shot } from "@/lib/content";
import styles from "./Results.module.css";

function Row({ shots, direction }: { shots: Shot[]; direction: 1 | -1 }) {
  const ref = useRef<HTMLDivElement>(null);
  useMarquee(ref, `.${styles.track}`, { direction, speed: 1.4, pauseOnHover: true });

  return (
    <div className={styles.row} ref={ref}>
      <div className={styles.track}>
        {[0, 1].map((copy) =>
          shots.map((s) => (
            <div
              key={`${copy}-${s.src}`}
              className={styles.shot}
              style={{ aspectRatio: `${s.w} / ${s.h}` }}
              aria-hidden={copy === 1 || undefined}
            >
              <Image src={s.src} alt={s.alt} width={s.w} height={s.h} sizes="(max-width: 700px) 70vw, 30vw" />
              <span className={styles.label}>Antes / Después</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function Results() {
  return (
    <section className={`section ${styles.results}`} id="resultados">
      <div className="container section-head section-head--row">
        <div>
          <p className="eyebrow" data-reveal>
            <span className="num">04</span> #LosCuerposDelZar
          </p>
          <h2 className="h2" data-lines>
            <span className="ln">
              <span>Ellos también</span>
            </span>
            <span className="ln">
              <span>
                <em className="serif gold-text">lo lograron.</em>
              </span>
            </span>
          </h2>
        </div>
        <a className="link-arrow" href={links.hashtag} data-reveal>
          Ver más en Instagram <Icon name="arrow-ur" />
        </a>
      </div>

      <div className={styles.gallery} data-reveal>
        <Row shots={transformations[0]} direction={-1} />
        <Row shots={transformations[1]} direction={1} />
      </div>
    </section>
  );
}
