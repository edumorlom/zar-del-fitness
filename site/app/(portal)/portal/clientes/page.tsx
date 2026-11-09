import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteClient } from "~/actions";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { Filters } from "~/components/Filters";
import { Form } from "~/components/Form";
import { initials } from "~/components/Shell";
import { canCreate, homeOf, isTeam } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { age, bmi, controlStatus, daysBetween, PLANS, STATUS_LABEL, type ControlStatus } from "~/lib/clients";
import { getCoaches, listClients } from "~/lib/data";
import { days, num, shortDate, todayISO } from "~/lib/format";

export const metadata: Metadata = { title: "Clientes" };

const STATUSES = Object.keys(STATUS_LABEL) as ControlStatus[];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; coach?: string; plan?: string; estado?: string; bajas?: string }>;
}) {
  const viewer = await requireViewer();
  if (!isTeam(viewer)) redirect(homeOf(viewer));
  const sp = await searchParams;
  const admin = viewer.scopes.includes("admin");
  const inactive = sp.bajas === "1";
  const today = todayISO();
  const [all, coaches] = await Promise.all([
    listClients(viewer, { q: sp.q, coach: admin && sp.coach ? Number(sp.coach) : null, plan: sp.plan, active: !inactive }),
    admin ? getCoaches() : [],
  ]);
  const estado = STATUSES.includes(sp.estado as ControlStatus) ? (sp.estado as ControlStatus) : null;
  const rows = estado ? all.filter((r) => controlStatus(r.last_date, today) === estado) : all;
  const filtered = Boolean(sp.q || sp.coach || sp.plan || estado);

  return (
    <AdminShell viewer={viewer}>
      <PageHead title={inactive ? "Dados de" : admin ? "Todos los" : "Tus"} accent={inactive ? "baja" : "clientes"} sub={`${rows.length} ${rows.length === 1 ? "cliente" : "clientes"}`}>
        <Link className="btn btn--ghost btn--sm" href={inactive ? "/portal/clientes" : "/portal/clientes?bajas=1"}>
          {inactive ? "Ver activos" : "Dados de baja"}
        </Link>
        {canCreate(viewer) && (
          <Link className="btn btn--gold btn--sm" href="/portal/clientes/nuevo">
            Nuevo cliente
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <use href="#i-plus" />
            </svg>
          </Link>
        )}
      </PageHead>

      <Filters>
        {inactive && <input type="hidden" name="bajas" value="1" />}
        <input className="filters__search" name="q" type="search" defaultValue={sp.q ?? ""} placeholder="Buscar por nombre, DNI o correo" aria-label="Buscar" />
        {admin && (
          <select name="coach" defaultValue={sp.coach ?? ""} aria-label="Coach">
            <option value="">Todos los coaches</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <select name="plan" defaultValue={sp.plan ?? ""} aria-label="Plan">
          <option value="">Todos los planes</option>
          {PLANS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="-">Sin plan</option>
        </select>
        <select name="estado" defaultValue={estado ?? ""} aria-label="Seguimiento">
          <option value="">Todo el seguimiento</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </Filters>

      {rows.length === 0 ? (
        <div className="card empty" data-reveal>
          <p className="fact">{filtered ? "No hay nadie con esos filtros" : inactive ? "No hay clientes dados de baja" : "Todavía no hay clientes"}</p>
          <p className="muted">{filtered ? "Probá con otros." : admin ? "Creá el primero con “Nuevo cliente”." : "El admin te los asigna desde su cuenta."}</p>
        </div>
      ) : (
        <div className="card table-wrap" data-reveal>
          <table className="table table--cards">
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Coach · Plan</th>
                <th scope="col">Último control</th>
                <th scope="col" className="right">Medidas</th>
                <th scope="col">Perfil</th>
                <th scope="col" className="right">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = controlStatus(r.last_date, today);
                const years = age(r.birth_year, today);
                const index = bmi(r.last_weight, r.height_cm);
                return (
                  <tr key={r.id}>
                    <td data-label="Cliente">
                      <Link className="person" href={`/portal/clientes/${r.id}`}>
                        {r.photo_url ? (
                          <img className="person__img" src={r.photo_url} alt="" />
                        ) : (
                          <span className="avatar avatar--sm" aria-hidden="true">
                            {initials(r.name)}
                          </span>
                        )}
                        <span>
                          <span className="strong">{r.name}</span>
                          {r.plan === "Premium" && <span className="tag-star" title="Premium"> ★</span>}
                          {r.conditions.length > 0 && (
                            <span className="tag-alert" title={`Patologías: ${r.conditions.join(", ")}`}>
                              {" "}
                              ⚠<span className="sr-only">con patologías</span>
                            </span>
                          )}
                          <span className="person__sub">
                            {[r.dni, years !== null && `${years} años`].filter(Boolean).join(" · ") || r.email || "—"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td data-label="Coach · Plan">
                      <span className="person person--quiet">
                        {r.coach_photo ? (
                          <img className="person__img" src={r.coach_photo} alt="" />
                        ) : (
                          <span className="avatar avatar--sm avatar--quiet" aria-hidden="true">
                            {r.coach_name ? initials(r.coach_name) : "—"}
                          </span>
                        )}
                        <span>
                          <span>{r.coach_name ?? "Sin coach asignado"}</span>
                          <span className="person__sub">{r.plan ?? "Sin plan"}</span>
                        </span>
                      </span>
                    </td>
                    <td data-label="Último control">
                      {r.last_date ? (
                        <>
                          <span className="mono">{shortDate(r.last_date)}</span>
                          <span className="person__sub">
                            <span className={`st-dot st--${st}`} aria-hidden="true" /> Hace {days(daysBetween(r.last_date, today))}
                            <span className="sr-only"> ({STATUS_LABEL[st]})</span>
                          </span>
                        </>
                      ) : (
                        <span className="muted">Sin control</span>
                      )}
                    </td>
                    <td data-label="Medidas" className="right">
                      <span className="mono">{r.last_weight ? `${num(r.last_weight)} kg` : "—"}</span>
                      <span className="person__sub mono">
                        {[r.height_cm && `${num(r.height_cm / 100, 2)} m`, index && `IMC ${num(index)}`].filter(Boolean).join(" · ")}
                      </span>
                    </td>
                    <td data-label="Perfil">
                      <span className="chips">
                        {r.sex && <span className={`chip chip--sex-${r.sex}`}>{r.sex === "M" ? "♂" : "♀"}<span className="sr-only">{r.sex === "M" ? "Masculino" : "Femenino"}</span></span>}
                        {r.body_type && <span className="chip chip--type">{r.body_type}</span>}
                      </span>
                    </td>
                    <td className="right actions">
                      <Link className="icon-btn icon-btn--sm" href={`/portal/clientes/${r.id}`} aria-label={`Ver a ${r.name}`} title="Ver ficha">
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>
                      {admin && (
                        <Form
                          action={deleteClient}
                          submit={
                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                            </svg>
                          }
                          button="icon-btn icon-btn--sm icon-btn--danger"
                          label={`Borrar a ${r.name}`}
                          className="inline-form"
                          confirm={`¿Borrar a ${r.name}? Se borran su cuenta y sus controles. No se puede deshacer.`}
                        >
                          <input type="hidden" name="id" value={r.id} />
                        </Form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
