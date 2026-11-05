import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { ClientForm } from "~/components/ClientForm";
import { requireViewer } from "~/lib/auth";
import { getCoaches } from "~/lib/data";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default async function NewClientPage() {
  const viewer = await requireViewer();
  if (viewer.role !== "admin") notFound();
  return (
    <AdminShell viewer={viewer}>
      <Link className="back" href="/portal/clientes">
        ← Clientes
      </Link>
      <PageHead title="Nuevo" accent="cliente" sub="Con el correo que cargues entra al portal: con Google o con un código que le llega ahí." />
      <ClientForm viewer={viewer} coaches={await getCoaches()} />
    </AdminShell>
  );
}
