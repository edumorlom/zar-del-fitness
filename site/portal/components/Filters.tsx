"use client";

/**
 * Los filtros de una lista: un formulario GET (la búsqueda y los filtros quedan en la URL, se pueden compartir) que se
 * manda solo al cambiar un desplegable. La búsqueda se manda con Enter.
 */
export function Filters({ children }: { children: React.ReactNode }) {
  return (
    <form
      className="filters"
      role="search"
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") e.currentTarget.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
