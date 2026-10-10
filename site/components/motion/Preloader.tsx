"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { gsap, useGSAP, reducedMotion } from "@/lib/gsap";
import { scroll } from "@/lib/scroll";
import styles from "./Preloader.module.css";

export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useGSAP(
    () => {
      const el = root.current!;
      el.style.animation = "none"; // desactiva el fallback CSS: JS toma el control

      if (reducedMotion()) {
        setGone(true);
        onDone();
        return;
      }

      let locked = true;
      let cancelled = false;
      const release = () => {
        if (locked) scroll.unlock();
        locked = false;
      };
      scroll.lock();
      const count = el.querySelector<HTMLElement>("[data-pl-count]")!;
      const counter = { v: 0 };
      const fontsReady = document.fonts?.ready ?? Promise.resolve();

      const intro = gsap.timeline();
      intro
        .from(`.${styles.logo}`, { autoAlpha: 0, scale: 0.92, filter: "blur(10px)", duration: 1, ease: "power3.out" })
        .from(`.${styles.meta}`, { autoAlpha: 0, y: 16, duration: 0.6, ease: "power3.out" }, "-=0.6")
        .to(counter, {
          v: 25,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            count.textContent = String(Math.round(counter.v)).padStart(2, "0");
          },
        }, "-=0.4")
        .to(`.${styles.bar} i`, { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, "<");

      // Sale cuando terminó la intro y las fuentes están listas.
      Promise.all([intro.then(), fontsReady]).then(() => {
        if (cancelled) return;
        gsap
          .timeline({
            onComplete: () => {
              setGone(true);
            },
          })
          .to(`.${styles.inner}`, { y: -40, autoAlpha: 0, duration: 0.5, ease: "power2.in" })
          .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "expo.inOut" }, "-=0.1")
          .add(() => {
            release();
            onDone();
          }, "-=0.55");
      });

      // StrictMode/HMR: si se desmonta antes de terminar, liberar el scroll.
      return () => {
        cancelled = true;
        release();
      };
    },
    { scope: root }
  );

  if (gone) return null;

  return (
    <div className={styles.preloader} ref={root} aria-hidden="true">
      <div className={styles.inner}>
        <Image className={styles.logo} src="/img/logo.webp" alt="" width={666} height={361} preload />
        <div className={styles.meta}>
          <span className={styles.label}>Reto de los</span>
          <span className={styles.count}>
            <span data-pl-count>00</span>
            <small>días</small>
          </span>
        </div>
        <div className={styles.bar}>
          <i />
        </div>
      </div>
    </div>
  );
}
