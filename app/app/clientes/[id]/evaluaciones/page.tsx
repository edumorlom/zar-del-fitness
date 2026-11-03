import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { canManage } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { MEASURES } from "~/lib/clients";
import { getCheckins, getClient, type Checkin } from "~/lib/data";
import { num, shortDate } from "~/lib/format";

export const metadata: Metadata = { title: "Detalle de evaluaciones" };

type Param = { label: string; unit: string; group: string; of: (c: Checkin) => number | null; digits: number };

const PARAMS: Param[] = [
  { label: "Peso", unit: "kg", group: "Composición", of: (c) => c.weight_kg, digits: 1 },
  { label: "% graso", unit: "%", group: "Composición", of: (c) => c.body_fat_pct, digits: 1 },
  { label: "Masa magra", unit: "kg", group: "Composición", of: (c) => c.weight_kg * (1 - c.body_fat_pct / 100), digits: 1 },
  { label: "Peso graso", unit: "kg", group: "Composición", of: (c) => (c.weight_kg * c.body_fat_pct) / 100, digits: 1 },
  ...MEASURES.map((m) => ({ label: m.label, unit: m.unit, group: m.group, of: (c: Checkin) => c[m.key], digits: m.int ? 0 : 1 })),
];

const value = (v: number | null, p: Param) => (v === null ? null : `${num(v, p.digits)}${p.unit ? ` ${p.unit}` : ""}`);

/** Todos los parámetros de todas las evaluaciones, con la variación contra la anterior. */
export default async function EvaluationsPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const client = await getClient(id);
  if (!client || !canManage(viewer, client)) notFound();
  const checkins = (await getCheckins(id)).reverse(); // la última primero
  // Los parámetros que nunca se midieron no aparecen
  const shown = PARAMS.filter((p) => checkins.some((c) => p.of(c) !== null));
  const groups = [...new Set(shown.map((p) => p.group))];

  return (
    <AdminShell viewer={viewer}>
      <Link className="back" href={`/clientes/${client.id}`}>
        ← {client.name}
      </Link>
      <PageHead title="Detalle de" accent="evaluaciones" sub={`${client.name} · todos los parámetros, con la variación contra la evaluación anterior`} />

      {checkins.length === 0 ? (
        <div className="card empty">
          <p className="fact">Todavía no hay evaluaciones</p>
        </div>
      ) : (
        <div className="card table-wrap" data-reveal>
          <table className="table matrix">
            <thead>
              <tr>
                <th scope="col">Parámetro</th>
                {checkins.map((c, i) => (
                  <th key={c.id} scope="col" className={i === 0 ? "right is-latest" : "right"}>
                    <span className="mono">{shortDate(c.date)}</span>
                    {i === 0 && <span className="person__sub">Última</span>}
                  </th>
                ))}
                <th scope="col" className="right">
                  Tendencia
                </th>
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g}>
                <tr className="matrix__group">
                  <th scope="rowgroup" colSpan={checkins.length + 2}>
                    {g}
                  </th>
                </tr>
                {shown
                  .filter((p) => p.group === g)
                  .map((p) => {
                    const vals = checkins.map((c) => p.of(c));
                    const known = vals.filter((v): v is number => v !== null);
                    const trend = known.length >= 2 ? known[0] - known[known.length - 1] : null;
                    return (
                      <tr key={p.label}>
                        <th scope="row">{p.label}</th>
                        {vals.map((v, i) => {
                          const prev = vals.slice(i + 1).find((x) => x !== null) ?? null;
                          const d = v !== null && prev !== null ? v - prev : null;
                          return (
                            <td key={checkins[i].id} className="right mono">
                              {value(v, p) ?? <span className="muted">—</span>}
                              {d !== null && Math.abs(d) >= 0.05 && (
                                <span className="person__sub">
                                  {d > 0 ? "↑" : "↓"} {num(Math.abs(d), p.digits)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="right mono">
                          {trend === null || Math.abs(trend) < 0.05 ? <span className="muted">—</span> : `${trend > 0 ? "↑" : "↓"} ${num(Math.abs(trend), p.digits)}`}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </AdminShell>
  );
}
