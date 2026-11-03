import { Reveals } from "@/components/motion/Reveals";
import type { Viewer } from "~/lib/auth";
import { initials, SignOut } from "./Shell";
import { Sidebar, type NavItem } from "./Sidebar";

/** El panel del equipo (admin y coaches): el menú al costado y la página. Los clientes ven Shell, con el menú del sitio. */
export function AdminShell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/agenda", label: "Agenda", icon: "agenda" },
    { href: "/clientes", label: "Clientes", icon: "clients" },
    ...(viewer.role === "admin" ? [{ href: "/configuracion", label: "Configuración", icon: "settings" } as const] : []),
  ];
  return (
    <div className="admin">
      <Sidebar
        items={items}
        account={
          <>
            <span className="avatar" aria-hidden="true">
              {initials(viewer.name)}
            </span>
            <span className="side__who">
              <span className="strong">{viewer.name}</span>
              <span className="side__role">{viewer.role === "admin" ? "Admin" : "Coach"}</span>
            </span>
            <SignOut />
          </>
        }
      />
      <main id="main" className="admin__main">
        {children}
      </main>
      {/* Último: conecta las animaciones data-* una vez montado todo el contenido */}
      <Reveals />
    </div>
  );
}

/** El encabezado de cada página del panel: título (con la segunda parte en cursiva dorada), bajada y acciones. */
export function PageHead({ title, accent, sub, children }: { title: string; accent?: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-head__title intro-lines">
          <span className="ln">
            <span>{title}</span>
          </span>
          {accent && (
            <>
              {" "}
              <span className="ln">
                <span>
                  <em className="serif gold-text">{accent}</em>
                </span>
              </span>
            </>
          )}
        </h1>
        {sub && <p className="page-head__sub intro">{sub}</p>}
      </div>
      {children && <div className="page-head__actions intro">{children}</div>}
    </header>
  );
}
