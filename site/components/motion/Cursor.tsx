"use client";

import { useRef } from "react";
import { gsap, useGSAP, finePointer, reducedMotion } from "@/lib/gsap";
import styles from "./Cursor.module.css";

/** Anillo dorado que sigue al puntero; se agranda sobre links y muestra data-cursor="Texto". */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = root.current!;
    if (!finePointer() || reducedMotion()) return;
    el.dataset.on = "true";

    const ring = el.querySelector<HTMLElement>(`.${styles.ring}`)!;
    const dot = el.querySelector<HTMLElement>(`.${styles.dot}`)!;
    const label = el.querySelector<HTMLElement>(`.${styles.label}`)!;
    // Los quickTo se crean con el primer movimiento: crearlos lee el transform del anillo y del punto (recálculos de
    // estilos al hidratar).
    let to: Record<"rx" | "ry" | "dx" | "dy", gsap.QuickToFunc> | undefined;

    const move = (e: PointerEvent) => {
      to ??= {
        rx: gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" }),
        ry: gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" }),
        dx: gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" }),
        dy: gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" }),
      };
      const { rx, ry, dx, dy } = to;
      rx(e.clientX);
      ry(e.clientY);
      dx(e.clientX);
      dy(e.clientY);
      el.dataset.visible = "true";
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as Element).closest<HTMLElement>("a, button, [data-cursor], input, label");
      const text = t?.dataset.cursor;
      el.dataset.state = text ? "label" : t ? "link" : "";
      label.textContent = text ?? "";
    };
    const leave = () => (el.dataset.visible = "false");

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  });

  return (
    <div className={styles.cursor} ref={root} aria-hidden="true">
      <div className={styles.ring}>
        <span className={styles.label} />
      </div>
      <div className={styles.dot} />
    </div>
  );
}
