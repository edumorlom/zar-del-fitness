import type Lenis from "lenis";

// Instancia única de Lenis compartida por los componentes (menú, modales, anclas).
let lenis: Lenis | null = null;
let locks = 0;

export const scroll = {
  set(instance: Lenis | null) {
    lenis = instance;
    if (lenis && locks > 0) lenis.stop(); // se puede bloquear antes de que exista Lenis
  },
  get: () => lenis,
  lock() {
    locks++;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
  },
  unlock() {
    locks = Math.max(0, locks - 1);
    if (locks > 0) return;
    lenis?.start();
    document.documentElement.style.overflow = "";
  },
  to(target: string | HTMLElement | number, offset = 0) {
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.4 });
      return;
    }
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (typeof el === "number") window.scrollTo({ top: el, behavior: "smooth" });
    else el?.scrollIntoView({ behavior: "smooth", block: "start" });
  },
};
