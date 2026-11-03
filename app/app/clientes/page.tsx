import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Title } from "~/components/Progress";
import { Shell } from "~/components/Shell";
import { requireViewer } from "~/lib/auth";
import { listClients } from "~/lib/data";
import { daysUntil, shortDate } from "~/lib/format";

export const metadata: Metadata = { title: "Clientes" };

const ROLE = { admin: "Admin", coach: "Coach", user: "Cliente" } as const;

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const viewer = await requireViewer();
  if (viewer.role === "user") redirect("/mi-progreso");
  const q = String((await searchParams).q ?? "").trim();
  const clients = await listClients(viewer, q);
  const admin = viewer.role === "admin";

  return (
    <Shell viewer={viewer}>
      <section>
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{clients.length}</span> {admin ? "Cuentas" : "Asignados a vos"}
            </p>
            <Title as="h1" plain={admin ? "Todos los" : "Tus"} accent="clientes" className="h2" />
          </div>
          <div className="toolbar">
            <form className="search" role="search">
              <input name="q" type="search" defaultValue={q} placeholder="Buscar por nombre o correo" aria-label="Buscar clientes" />
            </form>
            {admin && (
              <Link className="btn btn--gold btn--sm" href="/clientes/nuevo">
                Nuevo cliente
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#i-plus" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="card empty" data-reveal>
            <p className="fact">{q ? "No hay nadie con ese nombre" : admin ? "Todavía no hay clientes" : "Todavía no tenés clientes"}</p>
            <p className="muted">
              {q ? "Probá con otra búsqueda." : admin ? "Creá el primero con “Nuevo cliente”." : "El admin te los asigna desde su cuenta."}
            </p>
          </div>
        ) : (
          <div className="card table-wrap" data-reveal>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  {admin && <th scope="col">Rol</th>}
                  {admin && <th scope="col">Coach</th>}
                  <th scope="col">Último control</th>
                  <th scope="col">Pase</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((m) => {
                  const left = m.pass_expires ? daysUntil(m.pass_expires) : null;
                  return (
                    <tr key={m.id}>
                      <td>
                        <Link className="row-link" href={`/clientes/${m.id}`}>
                          <span className="strong">{m.name}</span>
                          <span className="muted"> {m.email}</span>
                        </Link>
                      </td>
                      {admin && (
                        <td>
                          <span className={m.role === "user" ? "pill pill--quiet" : "pill"}>{ROLE[m.role]}</span>
                        </td>
                      )}
                      {admin && <td className="muted">{m.coach_name ?? "—"}</td>}
                      <td>{m.last_checkin ? shortDate(m.last_checkin) : <span className="muted">—</span>}</td>
                      <td className={left !== null && left <= 3 ? "warn" : undefined}>
                        {left === null ? <span className="muted">—</span> : left < 0 ? "Vencido" : `Vence ${shortDate(m.pass_expires!)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Shell>
  );
}
