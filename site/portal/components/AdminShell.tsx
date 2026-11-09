import { Reveals } from "@/components/motion/Reveals";
import type { Viewer } from "~/lib/auth";
import { DiguiChat } from "./DiguiChat";
import { initials, SIGN_OUT, SignOut } from "./Shell";
import { Sidebar, type NavItem } from "./Sidebar";
import { SiteHeader } from "./SiteHeader";

/** El equipo usa el menú unificado en el celular y conserva el panel lateral en la compu. */
export function AdminShell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  const items: NavItem[] = [
    { href: "/portal/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/portal/agenda", label: "Agenda", icon: "agenda" },
    { href: "/portal/clientes", label: "Clientes", icon: "clients" },
    ...(viewer.role === "admin" ? [{ href: "/portal/configuracion", label: "Configuración", icon: "settings" } as const] : []),
  ];
  return (
    <>
      <div className="admin-header">
        <SiteHeader login={SIGN_OUT} portal={{ items, name: viewer.name, role: viewer.role === "admin" ? "Admin" : "Coach" }} />
      </div>
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
        <DiguiChat customerId={viewer.id} />
        {/* Último: conecta las animaciones data-* una vez montado todo el contenido */}
        <Reveals />
      </div>
    </>
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
