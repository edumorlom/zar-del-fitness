"use client";

import { useRef } from "react";
import Image from "next/image";
import { Icon } from "./Icon";
import { Sparkles } from "./Sparkles";
import { VideoButton } from "./motion/VideoButton";
import { gsap, useGSAP, reducedMotion, finePointer } from "@/lib/gsap";
import { Lines } from "./Lines";
import { Rich } from "./Rich";
import type { Content } from "@/lib/content";
import styles from "./Hero.module.css";

/** Los textos y links del inicio, ya en el idioma de la página (los arma components/HomePage.tsx). */
type HeroProps = {
  t: Content["t"]["inicio"];
  hashtag: { text: string; href: string };
  cta: { price: string; href: string };
  trailer: string;
  featuredPress: Content["featuredPress"];
  chips: Content["heroChips"];
  cursorVideo: string;
};

export function Hero({ t, hashtag, cta, trailer, featuredPress, chips, cursorVideo }: HeroProps) {
  const root = useRef<HTMLElement>(null);

  // La intro (título, foto, sello, textos) es con CSS (Hero.module.css), para que arranque con la primera pintada.
  // Acá sólo el parallax suave con el mouse.
  useGSAP(
    () => {
      if (reducedMotion() || !finePointer()) return;
      const layers = Array.from(root.current!.querySelectorAll<HTMLElement>("[data-depth]"));
      // Los quickTo se crean con el primer movimiento: crearlos lee el transform de cada capa, y al hidratar eran
      // recálculos de estilo dentro de la tarea más larga de la carga.
      let setters: { x: gsap.QuickToFunc; y: gsap.QuickToFunc; d: number }[] | undefined;
      const move = (e: PointerEvent) => {
        setters ??= layers.map((el) => ({
          x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" }),
          d: parseFloat(el.dataset.depth || "0"),
        }));
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        setters.forEach((s) => {
          s.x(nx * s.d);
          s.y(ny * s.d);
        });
      };
      root.current!.addEventListener("pointermove", move);
      return () => root.current?.removeEventListener("pointermove", move);
    },
    { scope: root }
  );

  return (
    <section className={styles.hero} id="top" ref={root}>
      <Sparkles className={styles.sparkles} />
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.bgWord} aria-hidden="true" data-speed="0.35">
        ZAR
      </div>

      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          {/* El h1 es el antetítulo ("El mejor entrenamiento personal en Buenos Aires"): es lo que buscan en Google.
              El título grande va aparte porque los dos juntos pasan los 70 caracteres que piden los analizadores SEO. */}
          <h1 className={`eyebrow ${styles.kicker}`} data-hero-fade>
            <span className="dot" /> {t.antetitulo}
          </h1>
          <p className={styles.title}>
            <Lines lines={t.titulo} accent="gold" />
          </p>
          <p className={styles.script} data-hero-fade>
            {t.sumate} <span>{hashtag.text}</span>
          </p>
          <p className={styles.lead}>
            <Rich text={t.descripcion} />
          </p>
          <div className={styles.ctas} data-hero-fade>
            <a className="btn btn--gold btn--lg" href={cta.href} data-magnetic>
              <span>{t.boton}</span>
              <span className="btn__price">{cta.price}</span>
            </a>
            <VideoButton videoId={trailer} cursor={cursorVideo} className="btn btn--ghost btn--lg" data-magnetic>
              <span className="btn__play">
                <Icon name="play" className="" />
              </span>
              <span>{t.trailer}</span>
            </VideoButton>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.frameWrap} data-depth="-18">
            <div className={styles.frame}>
              <Image
                src="/img/ronald-hero.jpg"
                alt={t.foto}
                width={1218}
                height={1291}
                sizes="(max-width: 900px) 90vw, 40vw"
                preload
              />
              <div className={styles.shine} aria-hidden="true" />
            </div>
          </div>

          <div className={styles.sealWrap} data-depth="30" aria-hidden="true">
            <div className={styles.seal}>
              <svg className={styles.sealRing} viewBox="0 0 200 200">
                <defs>
                  <path id="seal-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
                </defs>
                <text>
                  <textPath href="#seal-circle" textLength="486" lengthAdjust="spacing">{t.sello}</textPath>
                </text>
              </svg>
              <div className={styles.sealCore}>
                <span>25</span>
                <small>{t.dias}</small>
              </div>
            </div>
          </div>

          {featuredPress && (
            <div className={styles.tagWrap} data-depth="22">
              {featuredPress.videoId ? (
                <VideoButton videoId={featuredPress.videoId} cursor={cursorVideo} className={styles.tag} data-hero-fade>
                  <PressTag {...featuredPress} />
                </VideoButton>
              ) : (
                <a className={styles.tag} href={featuredPress.href} target="_blank" rel="noopener noreferrer" data-cursor={cursorVideo} data-hero-fade>
                  <PressTag {...featuredPress} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`container ${styles.foot}`} data-hero-fade>
        <span className={styles.scroll}>
          <i /> {t.scroll}
        </span>
        <ul className={styles.chips}>
          {chips.map((c) => (
            <li key={c.label}>
              {c.label} <span>{c.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** El contenido de la etiqueta de prensa del hero (un botón si es un video de YouTube, si no un link). */
function PressTag({ label, title }: { label: string; title: string }) {
  return (
    <>
      <Icon name="spark" />
      <span>
        <strong>{label}</strong>
        <span>{title}</span>
      </span>
      <Icon name="arrow-ur" className={styles.tagArrow} />
    </>
  );
}
