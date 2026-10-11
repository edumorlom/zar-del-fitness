"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { gsap, useGSAP, reducedMotion } from "@/lib/gsap";
import { scroll } from "@/lib/scroll";
import styles from "./Preloader.module.css";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function Preloader({ onDone, labels }: { onDone: () => void; labels: { reto: string; dias: string } }) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useGSAP(
    () => {
      const el = root.current!;

      // Sin animaciones, se llegó con un #ancla (ver app/layout.tsx), o el JS llegó tarde y el fallback CSS
      // ya lo está ocultando: no volver a mostrarlo.
      const skip = document.documentElement.hasAttribute("data-skip-intro");
      if (reducedMotion() || skip || getComputedStyle(el).opacity !== "1") {
        setGone(true);
        onDone();
        return;
      }
      el.style.animation = "none"; // desactiva el fallback CSS: JS toma el control de la salida

      let locked = true;
      let cancelled = false;
      const release = () => {
        if (locked) scroll.unlock();
        locked = false;
      };
      scroll.lock();

      // La intro (logo, contador, barra) es CSS y ya viene corriendo desde el primer pintado.
      // Se espera a que termine y a las fuentes, ambas con tope para no quedar nunca colgados.
      const bar = el.querySelector<HTMLElement>(`.${styles.bar} i`)!;
      const introDone = Promise.all((bar.getAnimations?.() ?? []).map((a) => a.finished.catch(() => {})));
      const fontsReady = document.fonts?.ready ?? Promise.resolve();

      Promise.race([introDone, wait(2500)])
        .then(() => Promise.race([fontsReady, wait(1000)]))
        .then(() => {
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
        <Image className={styles.logo} src="/img/logo.webp" alt="Zar del Fitness" width={666} height={361} preload />
        <div className={styles.meta}>
          <span className={styles.label}>{labels.reto}</span>
          <span className={styles.count}>
            <span className={styles.num} />
            <small>{labels.dias}</small>
          </span>
        </div>
        <div className={styles.bar}>
          <i />
        </div>
      </div>
    </div>
  );
}
