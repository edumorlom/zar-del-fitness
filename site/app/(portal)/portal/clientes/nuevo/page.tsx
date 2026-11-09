import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { ClientForm } from "~/components/ClientForm";
import { canCreate, isTeam } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { getCoaches } from "~/lib/data";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default async function NewClientPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  const viewer = await requireViewer();
  if (!canCreate(viewer)) notFound();
  const { creado } = await searchParams;
  return (
    <AdminShell viewer={viewer}>
      {isTeam(viewer) && (
        <Link className="back" href="/portal/clientes">
          ← Clientes
        </Link>
      )}
      <PageHead title="Nuevo" accent="cliente" sub="Con el correo que cargues entra al portal: con Google o con un código que le llega ahí." />
      {creado && (
        <div className="card notice" role="status">
          <p className="strong">Cliente creado. Ya podés cargar otro.</p>
        </div>
      )}
      {/* La key vacía el formulario y lo vuelve al primer paso después de cada alta. */}
      <ClientForm key={creado} viewer={viewer} coaches={await getCoaches()} />
    </AdminShell>
  );
}
