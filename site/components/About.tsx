import Image from "next/image";
import { Icon } from "./Icon";
import { VideoButton } from "./motion/VideoButton";
import { Lines } from "./Lines";
import { Rich } from "./Rich";
import { content, stats, videos } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import styles from "./About.module.css";

export function About({ lang }: { lang: Lang }) {
  const { t, peopleEvaluated } = content(lang);
  const z = t.elZar;
  return (
    <section className={`section ${styles.about}`} id="zar">
      <div className={`container ${styles.grid}`}>
        <div className={styles.media}>
          <div className={styles.frame} aria-hidden="true" data-speed="0.08" />
          <figure className={styles.img} data-reveal-img>
            <Image
              src="/img/ronald-seated.webp"
              alt={z.foto}
              width={841}
              height={1024}
              sizes="(max-width: 900px) 90vw, 45vw"
              // Sin lazy: la sección viene justo después del hero y, con lazy, el celular recién la pedía al llegar (y
              // la animación de entrada mostraba el fondo negro). Con prioridad baja no compite con el hero.
              loading="eager"
              fetchPriority="low"
            />
          </figure>
          <div className={styles.floatWrap} data-speed="0.25">
            <figure className={styles.float} data-reveal="scale">
              <Image
                src="/img/press-funcional.webp"
                alt={z.portada}
                width={819}
                height={1024}
                sizes="(max-width: 900px) 36vw, 204px"
              />
              <figcaption>{z.portadaPie}</figcaption>
            </figure>
          </div>
        </div>

        <div className={styles.copy}>
          <p className="eyebrow" data-reveal>
            <span className="num">01</span> {z.antetitulo}
          </p>
          <h2 className="h2" data-lines>
            <Lines lines={z.titulo} />
          </h2>
          <div className={styles.text} data-reveal>
            {z.parrafos.map((p) => (
              <p key={p}>
                <Rich text={p} />
              </p>
            ))}
          </div>
          <ul className={styles.chips} data-reveal-stagger>
            {z.credenciales.map((c) => (
              <li key={c}>
                <Icon name="check" />
                {c}
              </li>
            ))}
          </ul>
          <div data-reveal>
            <VideoButton videoId={videos.historia} cursor={t.general.cursorVideo} className="link-arrow">
              <span className="btn__play" style={{ marginLeft: 0 }}>
                <Icon name="play" className="" />
              </span>
              {z.historia}
            </VideoButton>
          </div>
        </div>
      </div>

      <div className="container">
        <blockquote className={styles.quote}>
          <p data-words>
            {`“${z.cita}”`.split(" ").map((w, i) => (
              <span key={i}>{w} </span>
            ))}
          </p>
          <footer data-reveal>— Ronald Medina</footer>
        </blockquote>

        <dl className={styles.stats} data-reveal-stagger>
          <div className={styles.stat}>
            <dt>{z.cifras.evaluadas}</dt>
            <dd>
              <small>{z.cifras.casi}</small>
              <span data-count={stats.peopleEvaluated} data-format="thousands">
                {peopleEvaluated}
              </span>
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>{z.cifras.ciclo}</dt>
            <dd>
              <span data-count="25">25</span>
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>{z.cifras.chiquinquira}</dt>
            <dd>
              <span data-count="2014" data-from="1990">
                2014
              </span>
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>{z.cifras.emmy}</dt>
            <dd>
              <span data-count="2024" data-from="2000">
                2024
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
