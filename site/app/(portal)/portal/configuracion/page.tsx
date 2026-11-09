import type { Metadata } from "next";
import Link from "next/link";
import { portalUrl } from "@/lib/content";
import { notFound } from "next/navigation";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { Filters } from "~/components/Filters";
import { initials } from "~/components/Shell";
import { SCOPE_LABEL, SCOPES, type Scope } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { listUsers } from "~/lib/data";

export const metadata: Metadata = { title: "Configuración" };

const SCOPE_PLURAL: Record<Scope, string> = { admin: "Admins", coach: "Coaches", user: "Clientes", receptionist: "Recepción" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ q?: string; rol?: string }> }) {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("admin")) notFound();
  const sp = await searchParams;
  const role = SCOPES.includes(sp.rol as Scope) ? (sp.rol as Scope) : null;
  const q = sp.q ?? "";
  const all = await listUsers();
  const needle = q.trim().toLowerCase();
  const users = all.filter(
    (u) => (!role || u.scopes.includes(role)) && (!needle || u.name.toLowerCase().includes(needle) || u.email?.includes(needle))
  );
  const counts = { admin: 0, coach: 0, user: 0, receptionist: 0 };
  for (const u of all) for (const s of u.scopes) counts[s]++;
  const waiting = all.filter((u) => u.email && !u.linked && u.active).length;
  const noEmail = all.filter((u) => !u.email).length;
  const tab = (r: Scope | null) => `/portal/configuracion${r ? `?rol=${r}` : ""}`;

  return (
    <AdminShell viewer={viewer}>
      <PageHead title="Configuración" sub="Quién entra al portal, con qué rol, y quiénes son los coaches." />

      <nav className="tiles" aria-label="Roles">
        {[null, ...SCOPES].map((r) => (
          <Link key={r ?? "all"} className="card tile" href={tab(r)} aria-current={role === r ? "page" : undefined}>
            <span className="label">{r ? SCOPE_PLURAL[r] : "Todos"}</span>
            <span className="tile__n" data-count={r ? counts[r] : all.length}>
              {r ? counts[r] : all.length}
            </span>
          </Link>
        ))}
      </nav>

      {(waiting > 0 || noEmail > 0) && (
        <div className="card notice" data-reveal>
          <p className="strong">
            {waiting} {waiting === 1 ? "cuenta todavía no entró" : "cuentas todavía no entraron"} al portal
          </p>
          <p className="muted">
            Entran con Google o con el código que les llega a su correo, en {portalUrl.replace("https://", "")}: alcanza con avisarles.
            {noEmail > 0 && ` ${noEmail} no ${noEmail === 1 ? "tiene" : "tienen"} correo: completalo en su ficha para que puedan entrar.`}
          </p>
        </div>
      )}

      <div className="toolbar toolbar--wide">
        <Filters>
          {role && <input type="hidden" name="rol" value={role} />}
          <input className="filters__search" name="q" type="search" defaultValue={q} placeholder="Buscar por nombre o correo" aria-label="Buscar" />
        </Filters>
        <Link className="btn btn--gold btn--sm" href="/portal/clientes/nuevo">
          Nuevo usuario
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <use href="#i-plus" />
          </svg>
        </Link>
      </div>

      <div className="card table-wrap" data-reveal>
        <table className="table table--cards">
          <thead>
            <tr>
              <th scope="col">Cuenta</th>
              <th scope="col">Rol</th>
              <th scope="col">Acceso</th>
              <th scope="col">Detalle</th>
              <th scope="col" className="right">
                <span className="sr-only">Editar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.active ? undefined : "is-off"}>
                <td data-label="Cuenta">
                  <Link className="person" href={`/portal/clientes/${u.id}`}>
                    {u.photo_url ? <img className="person__img" src={u.photo_url} alt="" /> : <span className="avatar avatar--sm">{initials(u.name)}</span>}
                    <span>
                      <span className="strong">{u.name}</span>
                      <span className="person__sub mono">{u.email ?? "sin correo"}</span>
                    </span>
                  </Link>
                </td>
                <td data-label="Rol">
                  <span className="chips">
                    {u.scopes.map((s) => (
                      <span key={s} className={s === "user" ? "pill pill--quiet" : "pill"}>
                        {SCOPE_LABEL[s]}
                      </span>
                    ))}
                  </span>
                </td>
                <td data-label="Acceso">
                  {!u.email ? (
                    <span className="warn">Sin correo</span>
                  ) : u.linked ? (
                    <span>
                      <span className="st-dot st--al-dia" aria-hidden="true" /> Ya entró
                    </span>
                  ) : (
                    <span className="muted">Todavía no entró</span>
                  )}
                  {!u.active && <span className="person__sub">Dado de baja</span>}
                </td>
                <td data-label="Detalle" className="muted">
                  {u.scopes.includes("admin")
                    ? (u.title ?? "Acceso completo")
                    : u.scopes.includes("coach")
                      ? (u.title ?? "Coach")
                      : u.scopes.includes("user")
                        ? u.coach_name
                          ? `Coach: ${u.coach_name}`
                          : "Sin coach"
                        : "Crea clientes"}
                </td>
                <td className="right actions">
                  <Link className="icon-btn icon-btn--sm" href={`/portal/clientes/${u.id}#editar`} aria-label={`Editar a ${u.name}`} title="Editar">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
