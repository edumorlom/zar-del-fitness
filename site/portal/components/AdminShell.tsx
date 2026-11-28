import { Reveals } from "@/components/motion/Reveals";
import { canHandlePayments, isTeam, SCOPE_LABEL } from "~/lib/access";
import type { Viewer } from "~/lib/auth";
import { DiguiChat } from "./DiguiChat";
import { PostHogIdentify } from "./DiguiIdentify";
import { initials } from "./Person";
import { SIGN_OUT, SignOut } from "./Shell";
import { Sidebar, type NavItem } from "./Sidebar";
import { SiteHeader } from "./SiteHeader";
import { Title } from "./Title";

/** El equipo usa el menú unificado en el celular y conserva el panel lateral en la compu. */
export function AdminShell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  const items: NavItem[] = [];
  if (isTeam(viewer))
    items.push(
      { href: "/portal/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/portal/agenda", label: "Agenda", icon: "agenda" },
      { href: "/portal/clientes", label: "Clientes", icon: "clients" }
    );
  else if (viewer.scopes.includes("receptionist")) items.push({ href: "/portal/clientes/nuevo", label: "Nuevo cliente", icon: "clients" });
  if (canHandlePayments(viewer)) items.push({ href: "/portal/pagos", label: "Pagos", icon: "payments" });
  if (viewer.scopes.includes("admin"))
    items.push({ href: "/portal/broadcast", label: "Broadcast", icon: "broadcast" }, { href: "/portal/configuracion", label: "Configuración", icon: "settings" });
  if (viewer.scopes.includes("user")) items.push({ href: "/portal/mi-progreso", label: "Mi progreso", icon: "progress" });
  const role = viewer.scopes.map((s) => SCOPE_LABEL[s]).join(" · ");
  return (
    <>
      <PostHogIdentify userId={viewer.id} name={viewer.name} email={viewer.email} role={role} />
      <div className="admin-header">
        <SiteHeader login={SIGN_OUT} portal={{ items, name: viewer.name, role }} />
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
                <span className="side__role">{role}</span>
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
        <Title as="h1" plain={title} accent={accent} className="page-head__title" intro />
        {sub && <p className="page-head__sub intro">{sub}</p>}
      </div>
      {children && <div className="page-head__actions intro">{children}</div>}
    </header>
  );
}
