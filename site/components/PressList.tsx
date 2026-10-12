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
      gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
      const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
      const rot = gsap.quickTo(el, "rotation", { duration: 0.8, ease: "power3.out" });
      let lastX = 0;

      const move = (e: PointerEvent) => {
        x(e.clientX);
        y(e.clientY);
        rot(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
        lastX = e.clientX;
      };
      const show = (e: PointerEvent) => {
        const row = (e.target as Element).closest<HTMLElement>("[data-preview]");
        if (!row) return;
        if (img.current && img.current.getAttribute("src") !== row.dataset.preview) {
          img.current.src = row.dataset.preview!;
        }
        gsap.to(el, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      };
      const hide = () => gsap.to(el, { scale: 0, autoAlpha: 0, duration: 0.4, ease: "power3.in", overwrite: "auto" });

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
        {/* lazy: si no, React la precarga en el <head> y el celular (que nunca la muestra) la baja antes que el inicio. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- src cambia en hover */}
        <img ref={img} alt={alt} src={press[0].preview} loading="lazy" />
      </div>
    </div>
  );
}
