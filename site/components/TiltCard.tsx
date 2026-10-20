"use client";

import { useRef } from "react";
import { gsap, useGSAP, finePointer, reducedMotion } from "@/lib/gsap";

/** Tarjeta con inclinación 3D y brillo dorado que sigue al puntero (vars --mx / --my). */
export function TiltCard({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const el = ref.current!;
    if (!finePointer() || reducedMotion()) return;
    // Los quickTo se crean con el primer movimiento: crearlos lee el transform de la tarjeta (un recálculo de
    // estilos al hidratar).
    let tilt: { rx: gsap.QuickToFunc; ry: gsap.QuickToFunc } | undefined;

    const move = (e: PointerEvent) => {
      if (!tilt) {
        gsap.set(el, { transformPerspective: 1100 });
        tilt = {
          rx: gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3.out" }),
          ry: gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3.out" }),
        };
      }
      const { rx, ry } = tilt;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      ry((px - 0.5) * 8);
      rx((0.5 - py) * 8);
    };
    const leave = () => {
      tilt?.rx(0);
      tilt?.ry(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  });

  return (
    <article className={className} ref={ref}>
      {children}
    </article>
  );
}
