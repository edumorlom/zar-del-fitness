"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Icon } from "./Icon";
import { Sparkles } from "./Sparkles";
import { VideoButton } from "./motion/VideoButton";
import { useMotion } from "./motion/MotionProvider";
import { gsap, useGSAP, reducedMotion, finePointer } from "@/lib/gsap";
import { Rich } from "./Rich";
import { featuredPress, heroChips, links, price, texts, videos } from "@/lib/content";
import styles from "./Hero.module.css";

export function Hero() {
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
            <span className="dot" /> Personal trainer · Buenos Aires · Online
          </p>
          <h1 className={styles.title}>
            <span className="ln">
              <span>Comenzá el</span>
            </span>
            <span className="ln">
              <span>reto de los</span>
            </span>
            <span className="ln">
              <span className="gold-text">25 días</span>
            </span>
          </h1>
          <p className={styles.script} data-hero-fade>
            y sumate a <a href={links.hashtag}>#LosCuerposDelZar</a>
          </p>
          <p className={styles.lead} data-hero-fade>
            <Rich text={texts.hero} />
          </p>
          <div className={styles.ctas} data-hero-fade>
            <a className="btn btn--gold btn--lg" href={links.retoOnline} data-magnetic>
              <span>Empezar el reto</span>
              <span className="btn__price">{price("reto-online")}</span>
            </a>
            <VideoButton videoId={videos.trailer} className="btn btn--ghost btn--lg" data-magnetic>
              <span className="btn__play">
                <Icon name="play" className="" />
              </span>
              <span>Ver trailer</span>
            </VideoButton>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.frameWrap} data-depth="-18">
            <div className={styles.frame}>
              <Image
                src="/img/ronald-hero.jpg"
                alt="Ronald Medina, el Zar del Fitness"
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
                  <textPath href="#seal-circle" textLength="486" lengthAdjust="spacing">COMENZÁ EL RETO ✦ DE LOS 25 DÍAS ✦ BY RONALD MEDINA ✦ </textPath>
                </text>
              </svg>
              <div className={styles.sealCore}>
                <span>25</span>
                <small>días</small>
              </div>
            </div>
          </div>

          {featuredPress && (
            <div className={styles.tagWrap} data-depth="22">
              <a className={styles.tag} href={featuredPress.href} target="_blank" rel="noopener noreferrer" data-cursor="Play" data-hero-fade>
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
          <i /> Scroll
        </span>
        <ul className={styles.chips}>
          {heroChips.map((c) => (
            <li key={c.label}>
              {c.label} <b>{c.value}</b>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
