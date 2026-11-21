import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { Kpi } from "~/components/Cards";
import { CoachSelect, PlanSelect } from "~/components/FilterFields";
import { Filters } from "~/components/Filters";
import { LineChart } from "~/components/LineChart";
import { Person } from "~/components/Person";
import { homeOf, isTeam } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { LATE_DAYS, STATUS_LABEL, type ControlStatus } from "~/lib/clients";
import { checkinDates, getCoaches, listClients } from "~/lib/data";
import { todayISO } from "~/lib/format";
import { dashboard } from "~/lib/stats";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS_ORDER: ControlStatus[] = ["al-dia", "por-vencer", "atrasado", "sin-control"];
const SHORT_MONTH = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });
const short = (iso: string) => SHORT_MONTH.format(new Date(`${iso}T00:00:00Z`)).replace(".", "");

function Delta({ now, before, unit = "" }: { now: number; before: number; unit?: string }) {
  const d = now - before;
  if (!d) return <p className="kpi__foot">Igual que los 30 días anteriores</p>;
  return (
    <p className="kpi__foot">
      <span className={d > 0 ? "delta delta--good" : "delta"}>
        {d > 0 ? "↑" : "↓"} {Math.abs(d)}
        {unit}
      </span>{" "}
      vs los 30 anteriores
    </p>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ coach?: string; plan?: string }> }) {
  const viewer = await requireViewer();
  if (!isTeam(viewer)) redirect(homeOf(viewer));
  const sp = await searchParams;
  const admin = viewer.scopes.includes("admin");
  const coach = admin && sp.coach ? Number(sp.coach) : null;
  const plan = sp.plan ?? "";
  const today = todayISO();
  const since = new Date(Date.parse(today) - 90 * 86_400_000).toISOString().slice(0, 10);

  const [rows, dates, coaches] = await Promise.all([
    listClients(viewer, { coach, plan }),
    checkinDates(viewer, since, coach),
    admin ? getCoaches() : [],
  ]);
  const ids = new Set(rows.map((r) => r.id));
  const d = dashboard(rows, dates.filter((x) => ids.has(x.client_id)), today);

  return (
    <AdminShell viewer={viewer}>
      <PageHead title="Dashboard" sub={`El seguimiento, al día de hoy · ${d.total} clientes activos en la selección`}>
        <Filters>
          {admin && <CoachSelect coaches={coaches} value={sp.coach} />}
          <PlanSelect value={plan} />
        </Filters>
      </PageHead>

      <div className="kpis" data-reveal-stagger>
        <Kpi wide label="Cobertura de controles" sub="Clientes con un control en los últimos 30 días" value={d.coverage} unit="%" of={`${d.by["al-dia"]} de ${d.total}`}>
          <div className="seg" aria-hidden="true">
            {STATUS_ORDER.map((s) => (d.by[s] ? <span key={s} className={`seg__part st--${s}`} style={{ flexGrow: d.by[s] }} /> : null))}
          </div>
          <ul className="seg__legend">
            {STATUS_ORDER.map((s) => (
              <li key={s}>
                <span className={`st-dot st--${s}`} aria-hidden="true" />
                {STATUS_LABEL[s]}
                <b>{d.by[s]}</b>
              </li>
            ))}
          </ul>
          <p className="kpi__note">
            Midiendo a los {d.by["por-vencer"]} que están por vencer, la cobertura llega a <b>{d.coverageWithDue} %</b>. Los
            atrasados son la lista de llamados: <Link href="/portal/clientes?estado=atrasado">verlos</Link>.
          </p>
        </Kpi>
        <Kpi label="Controles" sub="Últimos 30 días" value={d.last30} foot={<Delta now={d.last30} before={d.prev30} />} />
        <Kpi
          label="Clientes que mejoraron"
          sub="Bajaron el % graso en su último control"
          value={d.comparable ? Math.round((d.improved / d.comparable) * 100) : 0}
          unit="%"
          foot={`${d.improved} de ${d.comparable} con dos controles o más en el portal`}
        />
        <Kpi label="Altas" sub="Clientes nuevos, últimos 30 días" value={d.newLast} foot={<Delta now={d.newLast} before={d.newPrev} />} />
        <Kpi
          label="Atrasados"
          sub={`Más de ${LATE_DAYS} días sin control`}
          value={d.by.atrasado}
          foot={
            <p className="kpi__foot">
              <Link href="/portal/clientes?estado=atrasado">Ver la lista</Link>
            </p>
          }
        />
      </div>

      <div className="dash-row">
        <section className="card panel-card" data-reveal>
          <h2 className="card-title">Controles por semana</h2>
          <p className="kpi__sub">Últimas 12 semanas</p>
          <LineChart
            label="controles"
            points={d.weeks.map((w) => ({ label: short(w.week), tip: `Semana del ${short(w.week)}`, value: w.count }))}
          />
        </section>
        <section className="card panel-card" data-reveal>
          <h2 className="card-title">Mezcla de planes</h2>
          <p className="kpi__sub">Clientes activos por plan</p>
          <div className="seg seg--plans" aria-hidden="true">
            {d.plans.map((p, i) => (p.n ? <span key={p.plan ?? "-"} className={`seg__part plan--${i}`} style={{ flexGrow: p.n }} /> : null))}
          </div>
          <ul className="plans">
            {d.plans.map((p, i) => (
              <li key={p.plan ?? "-"}>
                <span className={`st-dot plan--${i}`} aria-hidden="true" />
                <span>{p.plan ?? "Sin plan asignado"}</span>
                <b>{p.n}</b>
                <span className="muted">{p.pct} %</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {admin && (
        <section className="card table-wrap" data-reveal>
          <div className="card-head">
            <h2 className="card-title">Clientes por coach</h2>
            <p className="kpi__sub">Carga, cobertura y cómo vienen con los controles</p>
          </div>
          <table className="table table--cards">
            <thead>
              <tr>
                <th scope="col">Coach</th>
                <th scope="col">Clientes</th>
                <th scope="col">Cobertura</th>
                <th scope="col">Controles 30 días</th>
                <th scope="col">Atrasados</th>
              </tr>
            </thead>
            <tbody>
              {d.perCoach.map((c) => (
                <tr key={c.id ?? "-"}>
                  <td data-label="Coach">
                    <Person name={c.name} photo={c.photo} href={c.id ? `/portal/clientes?coach=${c.id}` : "/portal/clientes"} />
                  </td>
                  <td data-label="Clientes">{c.clients}</td>
                  <td data-label="Cobertura">
                    <span className="meter" aria-hidden="true">
                      <span style={{ width: `${c.coverage}%` }} />
                    </span>{" "}
                    {c.coverage} %
                  </td>
                  <td data-label="Controles 30 días">{c.checkins30}</td>
                  <td data-label="Atrasados" className={c.late ? "warn" : undefined}>
                    {c.late}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </AdminShell>
  );
}
