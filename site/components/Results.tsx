"use client";

import { useRef } from "react";
import Image from "next/image";
import { Icon } from "./Icon";
import { Lines } from "./Lines";
import { useMarquee } from "@/lib/useMarquee";
import type { Content, Shot } from "@/lib/content";
import styles from "./Results.module.css";

function Row({ shots, direction, label }: { shots: Shot[]; direction: 1 | -1; label: string }) {
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
              <span className={styles.label}>{label}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** Los textos de db/textos.json (resultados) y las fotos, ya en el idioma de la página. */
export function Results({ t, hashtag, shots }: {
  t: Content["t"]["resultados"];
  hashtag: { text: string; href: string };
  shots: Content["transformations"];
}) {
  return (
    <section className={`section ${styles.results}`} id="resultados">
      <div className="container section-head section-head--row">
        <div>
          <p className="eyebrow" data-reveal>
            <span className="num">04</span> {hashtag.text}
          </p>
          <h2 className="h2" data-lines>
            <Lines lines={t.titulo} />
          </h2>
        </div>
        <a className="link-arrow" href={hashtag.href} data-reveal>
          {t.instagram} <Icon name="arrow-ur" />
        </a>
      </div>

      <div className={styles.gallery} data-reveal>
        <Row shots={shots[0]} direction={-1} label={t.antesDespues} />
        <Row shots={shots[1]} direction={1} label={t.antesDespues} />
      </div>
    </section>
  );
}
