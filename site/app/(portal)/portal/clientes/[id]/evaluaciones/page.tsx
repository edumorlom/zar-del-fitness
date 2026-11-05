import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { EvaluationsTable } from "~/components/EvaluationsTable";
import { canManage } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { getCheckins, getClient } from "~/lib/data";

export const metadata: Metadata = { title: "Detalle de evaluaciones" };

/** Todos los parámetros de todas las evaluaciones, con la variación contra la anterior. */
export default async function EvaluationsPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const client = await getClient(id);
  if (!client || !canManage(viewer, client)) notFound();
  const checkins = (await getCheckins(id)).reverse(); // la última primero

  return (
    <AdminShell viewer={viewer}>
      <Link className="back" href={`/portal/clientes/${client.id}`}>
        ← {client.name}
      </Link>
      <PageHead title="Detalle de" accent="evaluaciones" sub={`${client.name} · todos los parámetros, con la variación contra la evaluación anterior`} />
      <EvaluationsTable checkins={checkins} />
    </AdminShell>
  );
}
