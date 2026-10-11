"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, reducedMotion } from "@/lib/gsap";
import { scroll } from "@/lib/scroll";

export function SmoothScroll() {
  useEffect(() => {
    let lenis: Lenis | null = null;
    let raf: ((time: number) => void) | null = null;

    if (!reducedMotion()) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true, autoRaf: false });
      scroll.set(lenis);
      lenis.on("scroll", ScrollTrigger.update);
      raf = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    // Anclas internas (#seccion) con scroll suave y offset del header. Las del menú llevan el inicio adelante
    // ("/#seccion", "/en/#seccion") para que también funcionen desde otras páginas: en el inicio se tratan
    // igual que "#seccion".
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
      if (!a) return;
      const url = new URL(a.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname) return;
      const hash = url.hash || "#";
      const target = hash === "#top" || hash === "#" ? 0 : document.querySelector<HTMLElement>(hash);
      if (target === null) return;
      e.preventDefault();
      scroll.to(target);
      history.replaceState(null, "", hash === "#" ? " " : hash);
    };
    document.addEventListener("click", onClick);

    // Saltos de scroll nativos (foco con Tab, buscar en la página): Lenis avisa a ScrollTrigger
    // antes de que éste actualice su caché de posición, así que forzamos un update en el próximo frame.
    let pending = 0;
    const onNativeScroll = () => {
      if (!pending) pending = requestAnimationFrame(() => {
        pending = 0;
        ScrollTrigger.update();
      });
    };
    window.addEventListener("scroll", onNativeScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onNativeScroll);
      cancelAnimationFrame(pending);
      document.removeEventListener("click", onClick);
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
      scroll.set(null);
    };
  }, []);

  return null;
}
