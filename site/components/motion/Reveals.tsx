"use client";

import { gsap, ScrollTrigger, useGSAP, finePointer, reducedMotion } from "@/lib/gsap";

/**
 * Controlador global de animaciones al hacer scroll. Las secciones son Server Components
 * y declaran su animación con atributos data-*; este componente las conecta.
 *
 * Con CSS (app/globals.css), cuando el elemento entra en pantalla:
 *  data-lines            título con líneas .ln > span que suben desde la máscara
 *  data-reveal           fade + subida (data-reveal="left" | "scale" para variantes)
 *  data-reveal-stagger   los hijos directos entran escalonados
 *  data-reveal-img       revela con clip-path y des-zoom de la imagen interna
 * Con GSAP:
 *  data-speed="0.2"      parallax (positivo sube más rápido, negativo más lento)
 *  data-words            párrafo cuyas palabras (span) se iluminan con el scroll
 *  data-count="2000"     contador animado (data-from, data-format="thousands")
 *  data-magnetic         botón magnético (sólo puntero fino)
 *
 * Las de CSS eran tweens de GSAP con un ScrollTrigger cada uno (unos 70): al hidratar, GSAP leía el estilo y la
 * posición de cada elemento entre escritura y escritura, y el navegador recalculaba el layout cada vez. Con la CPU
 * 4 veces más lenta eran ~500 ms en una sola tarea, la mayor parte del Total Blocking Time de PageSpeed (2026-10-20).
 */

type Reveal = {
  sel: string;
  /** Entra cuando su borde de arriba pasa este % de la altura de la pantalla ("top 88%" en ScrollTrigger). */
  start: number;
  /** Lo que dura la animación más larga, en segundos (al terminar se saca data-anim). */
  duration: number;
  /** Los hijos que entran escalonados, y cada cuánto. */
  children?: string;
  stagger?: number;
  /** Los que entran juntos (un salto de scroll) se escalonan entre sí. */
  batch?: boolean;
};

const REVEALS: Reveal[] = [
  { sel: "[data-lines]", start: 88, duration: 1.15, children: ".ln > span", stagger: 0.09 },
  { sel: "[data-reveal]", start: 90, duration: 1.1, batch: true },
  { sel: "[data-reveal-stagger]", start: 88, duration: 0.9, children: ":scope > *", stagger: 0.08 },
  { sel: "[data-reveal-img]", start: 85, duration: 1.9 },
];

// Margen de arriba de los observers: lo que un salto de scroll dejó arriba también cuenta como "entró".
const ABOVE = 100000;

/**
 * Prepara las animaciones de CSS. Lo que ya se ve al cargar queda como está, sin animar: esconderlo al hidratar para
 * que vuelva a entrar era un parpadeo (lo mismo que el hero, ver Hero.module.css). Lo de más abajo se esconde
 * (data-anim="wait") hasta que entra (data-anim="in"). Devuelve la limpieza.
 */
function cssReveals() {
  const timers: number[] = [];
  const reveals = new Map<HTMLElement, Reveal>();
  for (const r of REVEALS) document.querySelectorAll<HTMLElement>(r.sel).forEach((el) => reveals.set(el, r));

  const play = (el: HTMLElement, r: Reveal, delay: number) => {
    const kids = r.children ? Array.from(el.querySelectorAll<HTMLElement>(r.children)) : [];
    kids.forEach((kid, i) => (kid.style.animationDelay = `${i * r.stagger!}s`));
    if (delay) el.style.animationDelay = `${delay}s`;
    el.dataset.anim = "in";
    const total = r.duration + delay + Math.max(0, kids.length - 1) * (r.stagger ?? 0);
    timers.push(
      window.setTimeout(() => {
        delete el.dataset.anim;
        el.style.animationDelay = "";
        kids.forEach((kid) => (kid.style.animationDelay = ""));
      }, total * 1000 + 100)
    );
  };

  // Un observer por línea de entrada (el margen de abajo: "12%", o en px cerca del final de la página).
  const watchers = new Map<string, IntersectionObserver>();
  const onEnter = (entries: IntersectionObserverEntry[], io: IntersectionObserver) => {
    const entered = entries.filter((e) => e.isIntersecting);
    entered.forEach((e) => io.unobserve(e.target));
    // Lo que quedó arriba aparece directo; el resto entra. Los data-reveal que entran juntos se escalonan, con un
    // total acotado si son varios.
    entered.filter((e) => e.boundingClientRect.bottom < 0).forEach((e) => delete (e.target as HTMLElement).dataset.anim);
    const visible = entered.filter((e) => e.boundingClientRect.bottom >= 0).map((e) => e.target as HTMLElement);
    const batch = visible.filter((el) => reveals.get(el)!.batch);
    const step = Math.min(0.09, 0.5 / Math.max(1, batch.length));
    visible.forEach((el) => {
      const r = reveals.get(el)!;
      const go = () => play(el, r, batch.includes(el) ? batch.indexOf(el) * step : 0);
      // La foto que todavía no bajó se descubre cuando llega: si no, la cortina abre sobre el fondo negro.
      const img = r.sel === "[data-reveal-img]" ? el.querySelector("img") : null;
      if (img && !img.complete) img.decode().catch(() => {}).then(go);
      else go();
    });
  };
  const watch = (el: HTMLElement, bottom: string) => {
    let io = watchers.get(bottom);
    if (!io) {
      io = new IntersectionObserver(onEnter, { rootMargin: `${ABOVE}px 0px -${bottom} 0px` });
      watchers.set(bottom, io);
    }
    io.observe(el);
  };

  const first = new IntersectionObserver((entries) => {
    const pageBottom = document.documentElement.scrollHeight - scrollY;
    for (const e of entries) {
      first.unobserve(e.target);
      if (e.isIntersecting || e.boundingClientRect.top < 0) continue;
      const el = e.target as HTMLElement;
      const r = reveals.get(el)!;
      el.dataset.anim = "wait";
      // Cerca del final de la página (el texto gigante del pie) la línea de entrada puede quedar más abajo de lo que
      // se llega scrolleando hasta el fondo, y no entraría nunca: entra 20 px antes de llegar abajo del todo.
      const toEnd = pageBottom - e.boundingClientRect.top;
      const line = (innerHeight * (100 - r.start)) / 100;
      watch(el, toEnd < line + 20 ? `${Math.max(0, Math.round(toEnd - 20))}px` : `${100 - r.start}%`);
    }
  });
  reveals.forEach((_, el) => first.observe(el));

  return () => {
    first.disconnect();
    watchers.forEach((io) => io.disconnect());
    timers.forEach(clearTimeout);
    reveals.forEach((_, el) => delete el.dataset.anim);
  };
}

export function Reveals() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    const q = <T extends Element = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel);
    const cleanups: (() => void)[] = [];

    if (!reducedMotion()) cleanups.push(cssReveals());

    mm.add("(prefers-reduced-motion: no-preference)", () => {
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
    const counters = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          counters.unobserve(e.target);
          const el = e.target as HTMLElement;
          const obj = { v: parseFloat(el.dataset.from || "0") };
          gsap.to(obj, {
            v: parseFloat(el.dataset.count || "0"),
            duration: reducedMotion() ? 0 : 2.2,
            ease: "power3.out",
            onUpdate: () => {
              el.textContent = fmt(el, obj.v);
            },
          });
        }
      },
      { rootMargin: `${ABOVE}px 0px -10% 0px` }
    );
    q("[data-count]").forEach((el) => {
      el.textContent = fmt(el, parseFloat(el.dataset.from || "0"));
      counters.observe(el);
    });
    cleanups.push(() => counters.disconnect());

    // Botones magnéticos. Los quickTo se crean con el primer movimiento: crearlos lee el transform de cada botón.
    if (finePointer()) {
      q("[data-magnetic]").forEach((el) => {
        let xTo: gsap.QuickToFunc | undefined;
        let yTo: gsap.QuickToFunc | undefined;
        const move = (e: PointerEvent) => {
          xTo ??= gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
          yTo ??= gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
        };
        const leave = () => {
          xTo?.(0);
          yTo?.(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    // Orden correcto con secciones fijadas (pin, en Method) y recalcular cuando cargan las fuentes. Sin
    // ScrollTrigger.refresh() acá: ScrollTrigger recalcula solo en el cuadro siguiente y al cargar la página (evento
    // load), en otra tarea; acá se sumaba a la de hidratar.
    ScrollTrigger.sort();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      cleanups.forEach((fn) => fn());
      mm.revert();
    };
  });

  return null;
}
