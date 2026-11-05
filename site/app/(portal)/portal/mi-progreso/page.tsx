import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hero, Results, Title } from "~/components/Progress";
import { ProgressPhotos } from "~/components/ProgressPhotos";
import { Shell } from "~/components/Shell";
import { requireViewer } from "~/lib/auth";
import { getCheckins, getClient, getOpenAppointment, getProgressPhotos } from "~/lib/data";

export const metadata: Metadata = { title: "Mi progreso" };

export default async function MyProgressPage() {
  const viewer = await requireViewer();
  if (viewer.role !== "user") redirect("/portal/dashboard");
  const [client, checkins, appointment, photos] = await Promise.all([
    getClient(viewer.id),
    getCheckins(viewer.id),
    getOpenAppointment(viewer.id),
    getProgressPhotos(viewer.id),
  ]);
  if (!client) redirect("/portal/ingresar");
  return (
    <Shell viewer={viewer}>
      <Hero client={client} checkins={checkins} you appointment={appointment} />
      <Results checkins={checkins} you manage={false} />
      <section id="fotos">
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{checkins.length ? "03" : "02"}</span> Fotos
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
