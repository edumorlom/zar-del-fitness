"use client";

import { useRef } from "react";
import { Icon } from "./Icon";
import { gsap, useGSAP, finePointer } from "@/lib/gsap";
import type { Content } from "@/lib/content";
import styles from "./Press.module.css";

/** Lista de prensa: al pasar el mouse por una fila aparece su imagen siguiendo al cursor. */
export function PressList({ items: press, alt }: { items: Content["press"]; alt: string }) {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      if (!finePointer()) return;
      const el = preview.current!;
      // Se prepara con el primer movimiento: crear los quickTo lee el transform del preview (un recálculo de estilos
      // al hidratar). Hasta entonces lo esconde el CSS (visibility: hidden).
      let follow: { x: gsap.QuickToFunc; y: gsap.QuickToFunc; rot: gsap.QuickToFunc } | undefined;
      const prepare = () => {
        if (follow) return follow;
        gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
        return (follow = {
          x: gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" }),
          rot: gsap.quickTo(el, "rotation", { duration: 0.8, ease: "power3.out" }),
        });
      };
      let lastX = 0;

      const move = (e: PointerEvent) => {
        const { x, y, rot } = prepare();
        x(e.clientX);
        y(e.clientY);
        rot(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
        lastX = e.clientX;
      };
      const show = (e: PointerEvent) => {
        const row = (e.target as Element).closest<HTMLElement>("[data-preview]");
        if (!row) return;
        prepare();
        if (img.current && img.current.getAttribute("src") !== row.dataset.preview) {
          img.current.src = row.dataset.preview!;
        }
        gsap.to(el, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      };
      const hide = () => {
        if (follow) gsap.to(el, { scale: 0, autoAlpha: 0, duration: 0.4, ease: "power3.in", overwrite: "auto" });
      };

      const list = root.current!;
      list.addEventListener("pointermove", move);
      list.addEventListener("pointerover", show);
      list.addEventListener("pointerleave", hide);
      return () => {
        list.removeEventListener("pointermove", move);
        list.removeEventListener("pointerover", show);
        list.removeEventListener("pointerleave", hide);
      };
    },
    { scope: root }
  );

  return (
    <div ref={root}>
      <ul className={styles.list}>
        {press.map((p) => {
          const inner = (
            <>
              <span className={styles.src}>{p.src}</span>
              <span className={styles.title}>{p.title}</span>
              <span className={styles.kind}>{p.kind}</span>
              {p.href ? <Icon name="arrow-ur" /> : <span />}
            </>
          );
          return (
            <li key={p.src} data-reveal>
              {p.href ? (
                <a className={styles.row} href={p.href} data-preview={p.preview} target="_blank" rel="noopener">
                  {inner}
                </a>
              ) : (
                <div className={styles.row} data-preview={p.preview}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className={styles.preview} ref={preview} aria-hidden="true">
        {/* Sin src: lo pone `show` al pasar el mouse por una fila. Con src, aunque fuera loading="lazy", se bajaba al
            abrir la página y con prioridad alta (el preview es position: fixed, así que siempre está "en pantalla"),
            también en el celular, que nunca lo muestra. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- src cambia en hover */}
        <img ref={img} alt={alt} />
      </div>
    </div>
  );
}
