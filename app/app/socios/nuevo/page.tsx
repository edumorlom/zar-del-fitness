import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberForm } from "~/components/MemberForm";
import { Title } from "~/components/Progress";
import { Shell } from "~/components/Shell";
import { requireViewer } from "~/lib/auth";
import { getCoaches } from "~/lib/data";

export const metadata: Metadata = { title: "Nuevo socio" };

export default async function NewMemberPage() {
  const viewer = await requireViewer();
  if (viewer.role !== "admin") notFound();
  return (
    <Shell viewer={viewer}>
      <section>
        <Link className="back" href="/socios">
          ← Socios
        </Link>
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="dot" /> Cuenta nueva
            </p>
            <Title as="h1" plain="Nuevo" accent="socio" className="h2" />
            <p className="sub">Con el correo que cargues entra al portal: con Google o con un código que le llega ahí.</p>
          </div>
        </div>
        <MemberForm viewer={viewer} coaches={await getCoaches()} />
      </section>
    </Shell>
  );
}
