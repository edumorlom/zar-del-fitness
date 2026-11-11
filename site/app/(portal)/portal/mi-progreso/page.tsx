import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hero, Results, Title } from "~/components/Progress";
import { ProgressPhotos } from "~/components/ProgressPhotos";
import { Shell } from "~/components/Shell";
import { homeOf } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { DietCard } from "~/components/Diet";
import { getCheckins, getClient, getDiet, getOpenAppointment, getProgressPhotos } from "~/lib/data";
import { getLang } from "~/lib/lang";
import { pick } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({ title: pick(await getLang())("Mi progreso", "My progress") });

export default async function MyProgressPage() {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("user")) redirect(homeOf(viewer));
  const [client, checkins, appointment, photos, diet] = await Promise.all([
    getClient(viewer.id),
    getCheckins(viewer.id),
    getOpenAppointment(viewer.id),
    getProgressPhotos(viewer.id),
    getDiet(viewer.id),
  ]);
  if (!client) redirect("/portal/ingresar");
  const lang = await getLang();
  const tr = pick(lang);
  // Resultados ocupa 01, o 01 y 02 si hay controles; el plan sólo existe con un control.
  const next = (checkins.length ? 3 : 2) + (diet ? 1 : 0);
  return (
    <Shell viewer={viewer}>
      <Hero client={client} checkins={checkins} you appointment={appointment} lang={lang} />
      <Results checkins={checkins} you manage={false} lang={lang} />
      {diet && (
        <section id="alimentacion">
          <div className="block__head">
            <div>
              <p className="eyebrow">
                <span className="num">03</span> {tr("Alimentación", "Nutrition")}
              </p>
              <Title plain={tr("Tu plan de", "Your nutrition")} accent={tr("alimentación", "plan")} />
              <p className="sub">{tr("Lo arma tu coach en cada evaluación.", "Your coach puts it together at each evaluation.")}</p>
            </div>
          </div>
          <DietCard diet={diet} lang={lang} />
        </section>
      )}
      <section id="fotos">
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{String(next).padStart(2, "0")}</span> {tr("Fotos", "Photos")}
            </p>
            <Title plain={tr("Tu progreso", "Your progress")} accent={tr("en fotos", "in photos")} />
            <p className="sub">
              {tr(
                "Las sube tu coach en los controles. Las ven sólo vos, tu coach y el admin.",
                "Your coach uploads them at your check-ins. Only you, your coach and the admin can see them."
              )}
            </p>
          </div>
        </div>
        <ProgressPhotos clientId={viewer.id} photos={photos} you lang={lang} />
      </section>
    </Shell>
  );
}
