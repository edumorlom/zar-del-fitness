"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Una tabla que se desliza de costado (en el celular no entra entera).
 * Muestra un degradado en el borde que todavía tiene contenido para que se note que se puede deslizar:
 * a la derecha mientras falta ver columnas, a la izquierda una vez que se deslizó.
 */
export function ScrollTable({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft < max - 2 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="card table-scroll" data-reveal data-more-left={edges.left || undefined} data-more-right={edges.right || undefined}>
      <div className="table-wrap" ref={ref}>
        {children}
      </div>
    </div>
  );
}
