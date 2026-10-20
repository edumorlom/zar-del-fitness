"use client";

import { gsap, ScrollTrigger, useGSAP, finePointer } from "@/lib/gsap";

/**
 * Controlador global de animaciones al hacer scroll. Las secciones son Server Components
 * y declaran su animación con atributos data-*; este componente las conecta con GSAP.
 *
 *  data-lines            título con líneas .ln > span que suben desde la máscara
 *  data-reveal           fade + subida (data-reveal="left" | "scale" para variantes)
 *  data-reveal-stagger   los hijos directos entran escalonados
 *  data-reveal-img       revela con clip-path y des-zoom de la imagen interna
 *  data-speed="0.2"      parallax (positivo sube más rápido, negativo más lento)
 *  data-words            párrafo cuyas palabras (span) se iluminan con el scroll
 *  data-count="2000"     contador animado (data-from, data-format="thousands")
 *  data-magnetic         botón magnético (sólo puntero fino)
 */
export function Reveals() {
  useGSAP(() => {
    if (location.search.includes("noreveals")) return;
    const mm = gsap.matchMedia();
    const q = <T extends Element = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Títulos por líneas
      q("[data-lines]").forEach((el) => {
        gsap.from(el.querySelectorAll(".ln > span"), {
          yPercent: 115,
          rotate: 3,
          duration: 1.15,
          ease: "expo.out",
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      // Fade-up en lotes
      const variants: Record<string, gsap.TweenVars> = {
        "": { y: 44 },
        left: { x: -60 },
        scale: { scale: 0.92 },
      };
      Object.entries(variants).forEach(([key, from]) => {
        const els = q(key ? `[data-reveal="${key}"]` : '[data-reveal=""], [data-reveal="true"]');
        if (!els.length) return;
        gsap.set(els, { opacity: 0, ...from });
        ScrollTrigger.batch(els, {
          start: "top 90%",
          once: true,
          onEnter: (batch) => {
            // En un salto de scroll entran muchos a la vez: lo que ya quedó arriba aparece directo
            // y el resto se escalona con un total acotado.
            const above = batch.filter((el) => el.getBoundingClientRect().bottom < 0);
            const visible = batch.filter((el) => !above.includes(el));
            if (above.length) gsap.set(above, { opacity: 1, x: 0, y: 0, scale: 1, overwrite: true });
            gsap.to(visible, {
              opacity: 1, x: 0, y: 0, scale: 1,
              duration: 1.1, ease: "power3.out", overwrite: true,
              stagger: Math.min(0.09, 0.5 / Math.max(1, visible.length)),
            });
          },
        });
      });

      // Hijos escalonados
      q("[data-reveal-stagger]").forEach((el) => {
        gsap.from(el.children, {
          opacity: 0,
          y: 36,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      // Imágenes con máscara
      q("[data-reveal-img]").forEach((el) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%" } });
        tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" });
        const img = el.querySelector("img, iframe");
        if (img) tl.from(img, { scale: 1.35, duration: 1.8, ease: "expo.out" }, 0.1);
      });

      // Parallax
      q("[data-speed]").forEach((el) => {
        const speed = parseFloat(el.dataset.speed || "0");
        gsap.fromTo(
          el,
          { yPercent: speed * 50 },
          {
            yPercent: speed * -50,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });

      // Palabras que se iluminan. Arrancan en 0.36 y no menos: blanco sobre negro con esa opacidad es el mínimo
      // contraste (3:1, texto grande) que pide Lighthouse en Accesibilidad, que mide la página sin scrollear.
      q("[data-words]").forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll("span"),
          { opacity: 0.36 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: true },
          }
        );
      });
    });

    // Contadores (también con reduced-motion: muestran el valor final)
    const fmt = (el: HTMLElement, v: number) =>
      el.dataset.format === "thousands" ? Math.round(v).toLocaleString(document.documentElement.lang) : String(Math.round(v));
    q("[data-count]").forEach((el) => {
      const to = parseFloat(el.dataset.count || "0");
      const from = parseFloat(el.dataset.from || "0");
      const obj = { v: from };
      el.textContent = fmt(el, from);
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () =>
          gsap.to(obj, {
            v: to,
            duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 2.2,
            ease: "power3.out",
            onUpdate: () => {
              el.textContent = fmt(el, obj.v);
            },
          }),
      });
    });

    // Botones magnéticos
    const cleanups: (() => void)[] = [];
    if (finePointer()) {
      q("[data-magnetic]").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
        };
        const leave = () => {
          xTo(0);
          yTo(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    // Orden correcto con secciones fijadas (pin) y recalcular al cargar imágenes/fuentes.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);

    return () => {
      cleanups.forEach((fn) => fn());
      window.removeEventListener("load", refresh);
      mm.revert();
    };
  });

  return null;
}
