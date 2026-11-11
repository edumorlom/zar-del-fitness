import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EvaluationsTable } from "~/components/EvaluationsTable";
import { Title } from "~/components/Progress";
import { Shell } from "~/components/Shell";
import { homeOf } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { getCheckins } from "~/lib/data";
import { getLang } from "~/lib/lang";
import { pick } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({ title: pick(await getLang())("Mis medidas", "My measurements") });

/** Todas las medidas del cliente que entró (sólo las suyas: el id sale de la sesión, no de la dirección). */
export default async function MyMeasuresPage() {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("user")) redirect(homeOf(viewer));
  const checkins = (await getCheckins(viewer.id)).reverse(); // la última primero
  const lang = await getLang();
  const tr = pick(lang);

  return (
    <Shell viewer={viewer}>
      <section>
        <Link className="back" href="/portal/mi-progreso">
          ← {tr("Mi progreso", "My progress")}
        </Link>
        <div className="block__head">
          <div>
            <Title plain={tr("Todas tus", "All your")} accent={tr("medidas", "measurements")} as="h1" />
            <p className="sub">{tr("Cada evaluación, con la variación contra la anterior.", "Every evaluation, with the change from the previous one.")}</p>
          </div>
        </div>
        <EvaluationsTable checkins={checkins} lang={lang} />
      </section>
    </Shell>
  );
}
