"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Icon } from "./Icon";
import { Sparkles } from "./Sparkles";
import { VideoButton } from "./motion/VideoButton";
import { useMotion } from "./motion/MotionProvider";
import { gsap, useGSAP, reducedMotion, finePointer } from "@/lib/gsap";
import { Lines } from "./Lines";
import { Rich } from "./Rich";
import type { Content } from "@/lib/content";
import styles from "./Hero.module.css";

/** Los textos y links del inicio, ya en el idioma de la página (los arma components/HomePage.tsx). */
export type HeroProps = {
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
  const intro = useRef<gsap.core.Timeline | null>(null);
  const { ready } = useMotion();

  useGSAP(
    () => {
      if (reducedMotion()) return;
      const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      tl.from(`.${styles.title} .ln > span`, { yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.1 })
        .fromTo(
          `.${styles.frame}`,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" },
          0
        )
        .from(`.${styles.frame} img`, { scale: 1.4, duration: 2.2 }, 0.2)
        .from(`.${styles.seal}`, { scale: 0, rotate: -120, duration: 1.4, ease: "back.out(1.6)" }, 0.8)
        .from("[data-hero-fade]", { autoAlpha: 0, y: 30, duration: 1.1, stagger: 0.08 }, 0.5);
      intro.current = tl;

      // Parallax suave con el mouse
      if (!finePointer()) return;
      const layers = Array.from(root.current!.querySelectorAll<HTMLElement>("[data-depth]"));
      const setters = layers.map((el) => ({
        x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" }),
        d: parseFloat(el.dataset.depth || "0"),
      }));
      const move = (e: PointerEvent) => {
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

  useEffect(() => {
    if (ready) intro.current?.play();
  }, [ready]);

  return (
    <section className={styles.hero} id="top" ref={root}>
      <Sparkles className={styles.sparkles} />
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.bgWord} aria-hidden="true" data-speed="0.35">
        ZAR
      </div>

      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className="eyebrow" data-hero-fade>
            <span className="dot" /> {t.antetitulo}
          </p>
          <h1 className={styles.title}>
            <Lines lines={t.titulo} accent="gold" />
          </h1>
          <p className={styles.script} data-hero-fade>
            {t.sumate} <a href={hashtag.href}>{hashtag.text}</a>
          </p>
          <p className={styles.lead} data-hero-fade>
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
              <a className={styles.tag} href={featuredPress.href} target="_blank" rel="noopener noreferrer" data-cursor={cursorVideo} data-hero-fade>
                <Icon name="spark" />
                <div>
                  <strong>{featuredPress.label}</strong>
                  <span>{featuredPress.title}</span>
                </div>
                <Icon name="arrow-ur" className={styles.tagArrow} />
              </a>
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
