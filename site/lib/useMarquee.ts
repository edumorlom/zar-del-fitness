"use client";

import type { RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP, reducedMotion } from "./gsap";

type Options = {
  /** -1 hacia la izquierda, 1 hacia la derecha */
  direction?: 1 | -1;
  /** % del track por segundo (el contenido va duplicado, así que 50% = un ciclo) */
  speed?: number;
  /** inclina el track según la velocidad del scroll */
  skew?: boolean;
  /** pausa al pasar el mouse */
  pauseOnHover?: boolean;
};

/**
 * Cinta infinita que acelera y cambia de sentido con la velocidad del scroll.
 * El track debe contener el contenido duplicado dos veces.
 */
export function useMarquee(root: RefObject<HTMLElement | null>, trackSelector: string, opts: Options = {}) {
  const { direction = -1, speed = 2.2, skew = false, pauseOnHover = false } = opts;

  useGSAP(
    () => {
      if (reducedMotion()) return;
      const tracks = gsap.utils.toArray<HTMLElement>(root.current!.querySelectorAll(trackSelector));
      const wrap = gsap.utils.wrap(-50, 0);
      const setters = tracks.map((t) => gsap.quickSetter(t, "xPercent"));
      const skewTo = skew ? tracks.map((t) => gsap.quickTo(t, "skewX", { duration: 0.6, ease: "power3.out" })) : [];

      let x = direction === 1 ? -50 : 0;
      let boost = 0;
      let dir = direction;
      let paused = false;
      let visible = true;

      const tick = (_t: number, dt: number) => {
        if (!visible) return;
        const base = paused ? 0 : speed;
        x += (dir * (base + boost) * dt) / 1000;
        boost *= 0.94;
        const v = wrap(x);
        setters.forEach((s) => s(v));
      };
      gsap.ticker.add(tick);

      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (visible = self.isActive),
        onUpdate: (self) => {
          const vel = self.getVelocity();
          boost = Math.min(Math.abs(vel) / 90, 40);
          dir = (self.direction === 1 ? direction : -direction) as 1 | -1;
          skewTo.forEach((s) => s(gsap.utils.clamp(-8, 8, vel / -300) * direction));
        },
      });
      visible = st.isActive;

      const settle = gsap.delayedCall(0.2, () => skewTo.forEach((s) => s(0))).pause();
      const onScroll = () => settle.restart(true);
      window.addEventListener("scroll", onScroll, { passive: true });

      const el = root.current!;
      const enter = () => (paused = true);
      const leave = () => (paused = false);
      if (pauseOnHover) {
        el.addEventListener("pointerenter", enter);
        el.addEventListener("pointerleave", leave);
      }

      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("scroll", onScroll);
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: root }
  );
}
