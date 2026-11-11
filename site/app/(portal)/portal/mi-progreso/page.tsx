import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hero, Results, Title } from "~/components/Progress";
import { ProgressPhotos } from "~/components/ProgressPhotos";
import { Shell } from "~/components/Shell";
import { homeOf } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { DietCard } from "~/components/Diet";
import { getCheckins, getClient, getDiet, getOpenAppointment, getProgressPhotos } from "~/lib/data";

export const metadata: Metadata = { title: "Mi progreso" };

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
  // Resultados ocupa 01, o 01 y 02 si hay controles; el plan sólo existe con un control.
  const next = (checkins.length ? 3 : 2) + (diet ? 1 : 0);
  return (
    <Shell viewer={viewer}>
      <Hero client={client} checkins={checkins} you appointment={appointment} />
      <Results checkins={checkins} you manage={false} />
      {diet && (
        <section id="alimentacion">
          <div className="block__head">
            <div>
              <p className="eyebrow">
                <span className="num">03</span> Alimentación
              </p>
              <Title plain="Tu plan de" accent="alimentación" />
              <p className="sub">Lo arma tu coach en cada evaluación.</p>
            </div>
          </div>
          <DietCard diet={diet} />
        </section>
      )}
      <section id="fotos">
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{String(next).padStart(2, "0")}</span> Fotos
            </p>
            <Title plain="Tu progreso" accent="en fotos" />
            <p className="sub">Las sube tu coach en los controles. Las ven sólo vos, tu coach y el admin.</p>
          </div>
        </div>
        <ProgressPhotos clientId={viewer.id} photos={photos} you />
      </section>
    </Shell>
  );
}
