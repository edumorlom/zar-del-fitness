"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

/**
 * Los filtros de una lista: un formulario GET (la búsqueda y los filtros quedan en la URL, se pueden compartir) que se
 * manda solo al cambiar un desplegable. La búsqueda se manda sola al dejar de escribir (o con Enter).
 */
export function Filters({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const typing = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <form
      className="filters"
      role="search"
      onChange={(e) => {
        const form = e.currentTarget;
        if ((e.target as HTMLElement).tagName === "SELECT") return form.requestSubmit();
        clearTimeout(typing.current);
        // Navegación del lado del cliente: el campo no se recarga, así no pierde el foco ni lo que se está escribiendo
        typing.current = setTimeout(() => {
          const params = new URLSearchParams(new FormData(form) as unknown as string[][]);
          router.replace(`?${params}`, { scroll: false });
        }, 300);
      }}
    >
      {children}
    </form>
  );
}
