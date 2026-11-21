import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { deleteClient } from "~/actions";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { Empty } from "~/components/Cards";
import { CoachSelect, PlanSelect, STATUSES, StatusSelect } from "~/components/FilterFields";
import { Filters } from "~/components/Filters";
import { Form } from "~/components/Form";
import { Person } from "~/components/Person";
import { canCreate, homeOf, isTeam } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { age, bmi, controlStatus, daysBetween, STATUS_LABEL, type ControlStatus } from "~/lib/clients";
import { getCoaches, listClients } from "~/lib/data";
import { days, num, shortDate, todayISO } from "~/lib/format";

export const metadata: Metadata = { title: "Clientes" };

type Row = Awaited<ReturnType<typeof listClients>>[number];
// Columnas que se pueden ordenar (?orden=columna, o ?orden=-columna para invertir)
const SORTS: Record<string, (r: Row) => string | number | null> = {
  cliente: (r) => r.name,
  coach: (r) => r.coach_name,
  control: (r) => r.last_date,
  medidas: (r) => r.last_weight,
  perfil: (r) => [r.sex, r.body_type].filter(Boolean).join(" ") || null,
};

/** Ordena por una columna; los vacíos siempre van al final. */
function sortRows(rows: Row[], orden?: string) {
  const desc = orden?.startsWith("-") ?? false;
  const by = SORTS[orden?.replace(/^-/, "") ?? ""];
  if (!by) return rows;
  return rows.sort((a, b) => {
    const x = by(a);
    const y = by(b);
    if (x === y) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "es");
    return desc ? -c : c;
  });
}

/** Un encabezado que ordena la tabla: el primer clic ordena ascendente, el segundo lo invierte. */
function SortTh({ col, label, sp, className }: { col: string; label: string; sp: Record<string, string | undefined>; className?: string }) {
  const current = sp.orden === col ? "ascending" : sp.orden === `-${col}` ? "descending" : undefined;
  const params = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => Boolean(e[1])));
  params.set("orden", current === "ascending" ? `-${col}` : col);
  return (
    <th scope="col" className={className} aria-sort={current}>
      <Link className="th-sort" href={`?${params}`} scroll={false}>
        {label}
        <span aria-hidden="true">{current === "ascending" ? " ↑" : current === "descending" ? " ↓" : ""}</span>
      </Link>
    </th>
  );
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; coach?: string; plan?: string; estado?: string; bajas?: string; orden?: string }>;
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
  const rows = sortRows(estado ? all.filter((r) => controlStatus(r.last_date, today) === estado) : all, sp.orden);
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
            <Icon name="plus" />
          </Link>
        )}
      </PageHead>

      <Filters>
        {inactive && <input type="hidden" name="bajas" value="1" />}
        {sp.orden && <input type="hidden" name="orden" value={sp.orden} />}
        <input className="filters__search" name="q" type="search" defaultValue={sp.q ?? ""} placeholder="Buscar por nombre, DNI o correo" aria-label="Buscar" />
        {admin && <CoachSelect coaches={coaches} value={sp.coach} />}
        <PlanSelect value={sp.plan} />
        <StatusSelect value={estado ?? undefined} />
      </Filters>

      {rows.length === 0 ? (
        <Empty
          reveal
          title={filtered ? "No hay nadie con esos filtros" : inactive ? "No hay clientes dados de baja" : "Todavía no hay clientes"}
          text={filtered ? "Probá con otros." : admin ? "Creá el primero con “Nuevo cliente”." : "El admin te los asigna desde su cuenta."}
        />
      ) : (
        <div className="card table-wrap" data-reveal>
          <table className="table table--cards">
            <thead>
              <tr>
                <SortTh col="cliente" label="Cliente" sp={sp} />
                <SortTh col="coach" label="Coach · Plan" sp={sp} />
                <SortTh col="control" label="Último control" sp={sp} />
                <SortTh col="medidas" label="Medidas" sp={sp} className="right" />
                <SortTh col="perfil" label="Perfil" sp={sp} />
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
                      <Person
                        name={r.name}
                        photo={r.photo_url}
                        href={`/portal/clientes/${r.id}`}
                        sub={[r.dni, years !== null && `${years} años`].filter(Boolean).join(" · ") || r.email || "—"}
                      >
                        {r.plan === "Premium" && <span className="tag-star" title="Premium"> ★</span>}
                        {r.conditions.length > 0 && (
                          <span className="tag-alert" title={`Patologías: ${r.conditions.join(", ")}`}>
                            {" "}
                            ⚠<span className="sr-only">con patologías</span>
                          </span>
                        )}
                      </Person>
                    </td>
                    <td data-label="Coach · Plan">
                      <Person quiet name={r.coach_name} label="Sin coach asignado" photo={r.coach_photo} sub={r.plan ?? "Sin plan"} />
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
                        <Icon name="eye" />
                      </Link>
                      {admin && (
                        <Form
                          action={deleteClient}
                          submit={<Icon name="trash" />}
                          button="icon-btn icon-btn--sm icon-btn--danger"
                          label={`Borrar a ${r.name}`}
                          className="inline-form"
                          confirm={{ title: "¿Borrar", accent: `a ${r.name}?`, text: "Se borran su cuenta y sus controles. No se puede deshacer.", yes: "Borrar" }}
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
