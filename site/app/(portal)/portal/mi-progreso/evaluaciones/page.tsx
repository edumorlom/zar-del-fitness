import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EvaluationsTable } from "~/components/EvaluationsTable";
import { Title } from "~/components/Progress";
import { Shell } from "~/components/Shell";
import { requireViewer } from "~/lib/auth";
import { getCheckins } from "~/lib/data";

export const metadata: Metadata = { title: "Mis medidas" };

/** Todas las medidas del cliente que entró (sólo las suyas: el id sale de la sesión, no de la dirección). */
export default async function MyMeasuresPage() {
  const viewer = await requireViewer();
  if (viewer.role !== "user") redirect("/portal/dashboard");
  const checkins = (await getCheckins(viewer.id)).reverse(); // la última primero

  return (
    <Shell viewer={viewer}>
      <section>
        <Link className="back" href="/portal/mi-progreso">
          ← Mi progreso
        </Link>
        <div className="block__head">
          <div>
            <Title plain="Todas tus" accent="medidas" as="h1" />
            <p className="sub">Cada evaluación, con la variación contra la anterior.</p>
          </div>
        </div>
        <EvaluationsTable checkins={checkins} />
      </section>
    </Shell>
  );
}
