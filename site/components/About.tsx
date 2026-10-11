import Image from "next/image";
import { Icon } from "./Icon";
import { VideoButton } from "./motion/VideoButton";
import { Rich } from "./Rich";
import { stats, texts, videos } from "@/lib/content";
import styles from "./About.module.css";

const credentials = [
  "Personal Trainer · IPEF",
  "Obesidad y enfermedades metabólicas",
  "Suplementación deportiva",
  "Nutrición para masa muscular",
];

export function About() {
  return (
    <section className={`section ${styles.about}`} id="zar">
      <div className={`container ${styles.grid}`}>
        <div className={styles.media}>
          <div className={styles.frame} aria-hidden="true" data-speed="0.08" />
          <figure className={styles.img} data-reveal-img>
            <Image
              src="/img/ronald-seated.webp"
              alt="Ronald Medina sentado, con ropa negra de Zar del Fitness"
              width={841}
              height={1024}
              sizes="(max-width: 900px) 90vw, 45vw"
            />
          </figure>
          <div className={styles.floatWrap} data-speed="0.25">
            <figure className={styles.float} data-reveal="scale">
              <Image
                src="/img/press-funcional.webp"
                alt="Ronald Medina en la portada de Funcional Magazine"
                width={819}
                height={1024}
                sizes="220px"
              />
              <figcaption>Portada · Funcional Magazine</figcaption>
            </figure>
          </div>
        </div>

        <div className={styles.copy}>
          <p className="eyebrow" data-reveal>
            <span className="num">01</span> El Zar
          </p>
          <h2 className="h2" data-lines>
            <span className="ln">
              <span>Soy Ronald Medina,</span>
            </span>
            <span className="ln">
              <span>
                <em className="serif gold-text">el Zar del Fitness.</em>
              </span>
            </span>
          </h2>
          <div className={styles.text} data-reveal>
            {texts.about.map((p) => (
              <p key={p}>
                <Rich text={p} />
              </p>
            ))}
          </div>
          <ul className={styles.chips} data-reveal-stagger>
            {credentials.map((c) => (
              <li key={c}>
                <Icon name="check" />
                {c}
              </li>
            ))}
          </ul>
          <div data-reveal>
            <VideoButton videoId={videos.historia} className="link-arrow">
              <span className="btn__play" style={{ marginLeft: 0 }}>
                <Icon name="play" className="" />
              </span>
              Conocé su historia
            </VideoButton>
          </div>
        </div>
      </div>

      <div className="container">
        <blockquote className={styles.quote}>
          <p data-words>
            {texts.quote.split(" ").map((w, i) => (
              <span key={i}>{w} </span>
            ))}
          </p>
          <footer data-reveal>— Ronald Medina</footer>
        </blockquote>

        <dl className={styles.stats} data-reveal-stagger>
          <div className={styles.stat}>
            <dt>Personas evaluadas</dt>
            <dd>
              <small>casi</small>
              <span data-count={stats.peopleEvaluated} data-format="thousands">
                {stats.peopleEvaluatedText}
              </span>
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Días por ciclo de resultados</dt>
            <dd>
              <span data-count="25">25</span>
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Chiquinquirá de Oro · Trainer del año</dt>
            <dd>
              <span data-count="2014" data-from="1990">
                2014
              </span>
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Emmy Winner</dt>
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
