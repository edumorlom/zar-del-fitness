import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCheckin } from "~/actions";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { CheckinFields } from "~/components/CheckinFields";
import { Form } from "~/components/Form";
import { canManage } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { getCheckin, getClient } from "~/lib/data";
import { shortDate, todayISO } from "~/lib/format";

export const metadata: Metadata = { title: "Editar evaluación" };

/** Corregir una evaluación ya cargada: medidas y el plan de alimentación que se le dio. */
export default async function EditCheckinPage({ params }: { params: Promise<{ id: string; evaluacion: string }> }) {
  const viewer = await requireViewer();
  const { id: rawId, evaluacion } = await params;
  const id = Number(rawId);
  const checkinId = Number(evaluacion);
  if (!Number.isInteger(id) || !Number.isInteger(checkinId)) notFound();
  const [client, found] = await Promise.all([getClient(id), getCheckin(checkinId)]);
  if (!client || !found || found.clientId !== client.id || !canManage(viewer, client)) notFound();

  return (
    <AdminShell viewer={viewer}>
      <Link className="back" href={`/portal/clientes/${client.id}#historico`}>
        ← {client.name}
      </Link>
      <PageHead title="Editar" accent="evaluación" sub={`${client.name} · ${shortDate(found.checkin.date)}`} />
      <Form action={updateCheckin} submit="Guardar cambios" className="card form">
        <input type="hidden" name="id" value={checkinId} />
        <CheckinFields checkin={found.checkin} diet={found.diet} today={todayISO()} />
      </Form>
    </AdminShell>
  );
}
