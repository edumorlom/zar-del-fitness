"use client";

import { useEffect, useRef, type RefObject } from "react";
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
              {/* La copia (para que el loop sea continuo) también lleva su alt: los analizadores SEO marcan alt="" como
                  faltante. El lector de pantalla no la repite porque el div tiene aria-hidden. */}
              <Image src={s.src} alt={s.alt} width={s.w} height={s.h} sizes="(max-width: 700px) 70vw, 30vw" />
              {/* "Antes / Después" lo escribe el CSS (data-label): repetido en cada foto, no es texto de la página para
                  Google ni los analizadores de palabras clave. */}
              <span className={styles.label} data-label={label} aria-hidden="true" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** Los textos de db/textos.json (resultados) y las fotos, ya en el idioma de la página. */
/**
 * Baja y decodifica todas las fotos de la galería cuando la sección está a una pantalla de distancia. Con lazy, cada
 * foto se bajaba al entrar en la cinta, ya en movimiento, y en el iPhone cada decodificación era un tirón (uno cada
 * dos o tres segundos).
 */
function usePreload(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        el.querySelectorAll("img").forEach((img) => {
          img.loading = "eager";
          img.decode().catch(() => {});
        });
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

export function Results({ t, hashtag, shots }: {
  t: Content["t"]["resultados"];
  hashtag: { text: string; href: string };
  shots: Content["transformations"];
}) {
  const gallery = useRef<HTMLDivElement>(null);
  usePreload(gallery);
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

      <div className={styles.gallery} ref={gallery} data-reveal>
        <Row shots={shots[0]} direction={-1} label={t.antesDespues} />
        <Row shots={shots[1]} direction={1} label={t.antesDespues} />
      </div>
    </section>
  );
}
